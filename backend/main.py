import json
import os
import uuid
import shutil
import asyncio
from typing import List, Dict
from fastapi import FastAPI, WebSocket, UploadFile, File, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import BackgroundTasks
from multiprocessing import Queue, Event, Process

from logic.schemas import StartRaceCommand
from logic.menager import process_queue_task

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_ROOT = "./temp"
os.makedirs(TEMP_ROOT, exist_ok=True)

# Baza sesji: {session_id: {file_id: path}}
sessions_db: Dict[str, Dict[str, str]] = {}

queue_manager_task = None

@app.get("/api/config")
async def get_config():
    return {
        "max_file_size_bytes": 1024 * 1024 * 1024,
        "allowed_extensions": [".txt", ".pdf", ".docx", ".jpg", ".png"]
    }


async def remove_session_folder(session_id: str):
    await asyncio.sleep(900) #po 15 minutach bezczynnosci pliki sa usuwane
    if session_id in sessions_db:
        path = os.path.join(TEMP_ROOT, session_id)
        if os.path.exists(path):
            shutil.rmtree(path)
        sessions_db.pop(session_id, None)

@app.post("/api/upload")
async def upload_files(background_tasks: BackgroundTasks,files: List[UploadFile] = File(...)):
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


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    stream_mode = False
    current_session_id = None

    global queue_manager_task
    metric_queue = Queue()
    stop_event = Event()
    active_processes: List[Process] = []

    async def monitor_queue():
        try:
            while True:
                while not metric_queue.empty():
                    msg = metric_queue.get_nowait()
                    await websocket.send_json(msg)
                await asyncio.sleep(0.1)
        except:
            pass

    queue_task = asyncio.create_task(monitor_queue())


    try:
        while True:
            message = await websocket.receive()
            if "bytes" in message:
                if stream_mode:
                    raw_frame = message["bytes"]
                                #miejsce na szyfrowanie
                    encrypted_frame = raw_frame

                    await websocket.send_bytes(encrypted_frame)
                continue
            if "text" in message:
                raw_data = json.loads(message["text"])
                command = raw_data.get("command")

                if command == "START_WEBCAM":
                    current_session_id = raw_data.get("session_id")
                    stream_mode = True

                elif command == "STOP_WEBCAM":
                    stream_mode = False
                    await websocket.send_json({"type": "info", "message": "Stream wideo zatrzymany"})


                if command == "START_RACE":
                    current_session_id = raw_data.get("session_id")
                    if queue_manager_task and not queue_manager_task.done():
                        await websocket.send_json({"type": "error", "message": "Szyfrowanie już trwa!"})
                        continue

                    try:
                        data = StartRaceCommand(**raw_data)
                        stop_event.clear()

                        queue_manager_task = asyncio.create_task(process_queue_task(
                            data.session_id,
                            data.file_ids,
                            data.config.model_dump(),
                            metric_queue,
                            stop_event,
                            active_processes,
                            websocket,
                            sessions_db
                        ))
                    except Exception as e:
                        await websocket.send_json({"type": "error", "message": f"Błąd startu: {str(e)}"})

                elif command == "NEXT_FILE":
                    for p in active_processes:
                        if p.is_alive():
                            p.terminate()
                    active_processes.clear()

                elif command == "STOP_ALL":
                    stop_event.set()
                    if queue_manager_task:
                        queue_manager_task.cancel()
                    for p in active_processes:
                        if p.is_alive():
                            p.terminate()
                    active_processes.clear()
                    await websocket.send_json({"type": "info", "message": "Zatrzymano cały proces"})

    except WebSocketDisconnect:
        stop_event.set()
        if queue_manager_task:
            queue_manager_task.cancel()
        for p in active_processes:
            p.terminate()
    finally:
        queue_task.cancel()
        if current_session_id:
            session_path = os.path.join(TEMP_ROOT, current_session_id)
            if os.path.exists(session_path):
                shutil.rmtree(session_path)
            sessions_db.pop(current_session_id, None)

@app.get("/api/download/{filename}")
async def download_file(filename: str, background_tasks: BackgroundTasks):
    for root, dirs, files in os.walk(TEMP_ROOT):
        if filename in files:
            file_path = os.path.join(root, filename)
            background_tasks.add_task(os.remove, file_path)
            return FileResponse(file_path, filename=filename)
    raise HTTPException(status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)