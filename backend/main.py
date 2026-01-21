import json
import os
import uuid
import shutil
import asyncio
import sys
from typing import List, Dict

from fastapi import FastAPI, WebSocket, UploadFile, File, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import BackgroundTasks
from multiprocessing import Queue, Event, Process

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from logic.schemas import StartRaceCommand
from logic.menager import process_queue_task
from functions._endpoint import what_to_run
from concurrent.futures import ProcessPoolExecutor


executor = ProcessPoolExecutor(max_workers=os.cpu_count())

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_ROOT = "./temp"
os.makedirs(TEMP_ROOT, exist_ok=True)

sessions_db: Dict[str, Dict[str, str]] = {}

queue_manager_task = None

LIBRARY_KEYS_CACHE = {}


def reset_executor():
    global executor

    executor.shutdown(wait=False, cancel_futures=True)
    executor = ProcessPoolExecutor(max_workers=os.cpu_count())

async def cleanup_processes(active_processes: List[Process], queue_manager_task: asyncio.Task):
    if queue_manager_task and not queue_manager_task.done():
        queue_manager_task.cancel()
        try:
            await queue_manager_task
        except asyncio.CancelledError:
            pass

    for p in active_processes:
        if p.is_alive():
            p.terminate()
            p.join(timeout=0.1)

    active_processes.clear()

def run_library_aes(data: bytes, key_size: int, mode_str: str) -> bytes:
    if key_size not in LIBRARY_KEYS_CACHE:
        LIBRARY_KEYS_CACHE[key_size] = os.urandom(key_size // 8)

    key = LIBRARY_KEYS_CACHE[key_size]

    if "GCM" in mode_str:
        aesgcm = AESGCM(key)
#         nonce = b'\0' * 12
        nonce = os.urandom(12)
        return aesgcm.encrypt(nonce, data, None)

    elif "CBC" in mode_str:
#         iv = b'\0' * 16
        iv = os.urandom(16)
        mode = modes.CBC(iv)
        cipher = Cipher(algorithms.AES(key), mode, backend=default_backend())
        encryptor = cipher.encryptor()
        return encryptor.update(data) + encryptor.finalize()

    else:
        mode = modes.ECB()
        cipher = Cipher(algorithms.AES(key), mode, backend=default_backend())
        encryptor = cipher.encryptor()
        return encryptor.update(data) + encryptor.finalize()


def optimize_frame(frame_bytes: bytes) -> bytes:
    data = bytearray(frame_bytes)
    for i in range(len(data)):
        data[i] &= 0xE0

    return bytes(data)

@app.get("/api/config")
async def get_config():
    return {
        "max_file_size_bytes": 1024 * 1024 * 1024,  # 1GB
        "allowed_extensions": [".txt", ".pdf", ".docx", ".jpg", ".png"]
    }


async def remove_session_folder(session_id: str):
    await asyncio.sleep(900)
    if session_id in sessions_db:
        path = os.path.join(TEMP_ROOT, session_id)
        if os.path.exists(path):
            shutil.rmtree(path, ignore_errors=True)
        sessions_db.pop(session_id, None)


@app.post("/api/upload")
async def upload_files(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    session_id = f"sess_{uuid.uuid4()}"
    session_path = os.path.join(TEMP_ROOT, session_id)
    os.makedirs(session_path, exist_ok=True)

    uploaded_info = []
    sessions_db[session_id] = {}

    for file in files:
        file_id = str(uuid.uuid4())
        file_path = os.path.join(session_path, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        sessions_db[session_id][file_id] = file_path
        uploaded_info.append({
            "id": file_id,
            "name": file.filename,
            "size": os.path.getsize(file_path)
        })

    background_tasks.add_task(remove_session_folder, session_id)
    return {"session_id": session_id, "files": uploaded_info}


@app.get("/api/download/{filename}")
async def download_file(filename: str, background_tasks: BackgroundTasks):
    for root, dirs, files in os.walk(TEMP_ROOT):
        if filename in files:
            file_path = os.path.join(root, filename)
            background_tasks.add_task(os.remove, file_path)
            return FileResponse(file_path, filename=filename)
    raise HTTPException(status_code=404, detail="Plik nie istnieje lub został już pobrany.")



@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    next_file_event = asyncio.Event()

    stream_mode = False
    current_session_id = None
    webcam_config = {"key_size": 128, "mode": "ECB","implementation": "our"}

    global queue_manager_task
    metric_queue = Queue()
    stop_event = Event()
    active_processes: List[Process] = []

    is_processing = False

    async def monitor_queue():
        try:
            while True:
                while not metric_queue.empty():
                    msg = metric_queue.get_nowait()
                    await websocket.send_json(msg)
                await asyncio.sleep(0.1)
        except Exception:
            pass

    queue_task = asyncio.create_task(monitor_queue())

    try:

        while True:
            try:
                message = await websocket.receive()
            except RuntimeError:
                break

            if "bytes" in message:
                if stream_mode:
                    if is_processing:
                        continue
                    is_processing = True
                    raw_frame = message["bytes"]

                    async def process_frame(frame_data, config):
                        nonlocal is_processing

                        try:
                            loop = asyncio.get_running_loop()

                            mode_raw = config.get('mode', 'ECB')
                            ms = f"AES_{mode_raw}"
                            ks = config.get("key_size", 128)
                            impl = config.get("implementation", "our")


                            if mode_raw == "ECB":
                                ready_data = await loop.run_in_executor(None, optimize_frame, frame_data)
                            else:
                                ready_data = frame_data

                            if impl == "library":
                                enc_frame = await loop.run_in_executor(None, run_library_aes, ready_data, ks, ms)
                            else:
                                result = await loop.run_in_executor(executor, what_to_run, ready_data, ks, ms)
                                enc_frame = result[0] if isinstance(result, tuple) else result

                            await websocket.send_bytes(enc_frame)
                        except Exception as e:
                            print(f"Błąd klatki: {e}")
                        finally:
                            is_processing = False

                    asyncio.create_task(process_frame(raw_frame, webcam_config))

                continue

            if "text" in message:
                raw_data = json.loads(message["text"])
                command = raw_data.get("command")

                if command == "START_WEBCAM":
                    await cleanup_processes(active_processes, queue_manager_task)

                    current_session_id = raw_data.get("session_id")
                    if "config" in raw_data and "aes" in raw_data["config"]:
                        webcam_config = raw_data["config"]["aes"]
                    stream_mode = True
                    is_processing = False

                elif command == "STOP_WEBCAM":
                    stream_mode = False
                    is_processing = False
                    await websocket.send_json({"type": "info", "message": "Stream zatrzymany"})

                    reset_executor()

                elif command == "START_RACE":
                    current_session_id = raw_data.get("session_id")

                    await cleanup_processes(active_processes, queue_manager_task)

                    if queue_manager_task and not queue_manager_task.done():
                        await websocket.send_json({"type": "error", "message": "Szyfrowanie już trwa!"})
                        continue

                    try:
                        data = StartRaceCommand(**raw_data)
                        stop_event.clear()

                        next_file_event.set()

                        queue_manager_task = asyncio.create_task(process_queue_task(
                            data.session_id,
                            data.file_ids,
                            data.config.model_dump(),
                            metric_queue,
                            stop_event,
                            active_processes,
                            websocket,
                            sessions_db,
                            next_file_event
                        ))
                    except Exception as e:
                        await websocket.send_json({"type": "error", "message": f"Błąd startu: {str(e)}"})

                elif command == "NEXT_FILE":
                    for p in active_processes:
                        if p.is_alive():
                            p.terminate()
                    active_processes.clear()

                    next_file_event.set()

                elif command == "STOP_ALL":
                    stop_event.set()
                    if queue_manager_task:
                        queue_manager_task.cancel()
                    for p in active_processes:
                        if p.is_alive():
                            p.terminate()
                    active_processes.clear()
                    await websocket.send_json({"type": "info", "message": "Zatrzymano procesy"})

                    reset_executor()

    except WebSocketDisconnect:
        print("WebSocket rozłączony")
    finally:
        stop_event.set()
        queue_task.cancel()
        if queue_manager_task:
            queue_manager_task.cancel()
        for p in active_processes:
            if p.is_alive():
                p.terminate()

        if current_session_id:
            session_path = os.path.join(TEMP_ROOT, current_session_id)
            if os.path.exists(session_path):
                shutil.rmtree(session_path, ignore_errors=True)
            sessions_db.pop(current_session_id, None)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)