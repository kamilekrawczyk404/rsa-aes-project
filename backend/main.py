import os
import uuid
import shutil
import asyncio
from typing import List, Dict
from fastapi import FastAPI, WebSocket, UploadFile, File, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
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

@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...)):
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

    return {"session_id": session_id, "files": uploaded_info}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

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
            raw_data = await websocket.receive_json()
            command = raw_data.get("command")

            if command == "START_RACE":
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

@app.get("/api/download/{filename}")
async def download_file(filename: str):
    for root, dirs, files in os.walk(TEMP_ROOT):
        if filename in files:
            return FileResponse(os.path.join(root, filename), filename=filename)
    raise HTTPException(status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)