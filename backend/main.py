import asyncio
import os
import tempfile
import json
import uuid
from typing import Optional, Dict, Any, Union

from fastapi import FastAPI, WebSocket, UploadFile, File, HTTPException, Query, WebSocketDisconnect
from fastapi.responses import JSONResponse
import tasks


app = FastAPI()

MAX_FILE_SIZE = 10*1024*1024
ALLOWED_EXT = {".jpg", ".jpeg", ".png",".gif",
               ".mp3", ".wav",
               ".mp4", ".avi", ".pdf",
               ".txt", ".json", ".xml", ".csv", ".yml", ".yaml"}
TEMPORARY_FILE_STORAGE: Dict[str, Dict[str, str]] = {}


#przerobiłem tą funkcje tak aby plik byl zapisywany w temp
#zwraca na front wiadomosc o tym pliku i jego miejscu przechowywania, co pozniej jest uzyte jako wejscie websocketa
#czyli kazda sesja websocket otwiera sie dla swojego pliku
#po zamknieciu kart badz zakonczeniu sesji websocket pliki sa usuwane
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename if file.filename else "unknown_file"
    if "." not in filename:
        raise HTTPException(status_code=400, detail="Plik nie ma rozszerzenia")

    ext = filename[filename.rfind("."):].lower()

    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Nieobsługiwany format: {ext}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"Plik jest za duży (max 10MB)")

    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}_{os.path.basename(filename)}"
    temp_file_path = os.path.join(tempfile.gettempdir(), safe_filename)
    try:
        with open(temp_file_path, "wb") as f:
            f.write(content)
    except Exception:
        raise HTTPException(status_code=500, detail="Wystąpił błąd podczas zapisu pliku na serwerze.")

    TEMPORARY_FILE_STORAGE[file_id] = {
        "path": temp_file_path,
        "original_filename": filename
    }

    #print(f"Plik '{filename}' zapisany tymczasowo jako ID: {file_id}")

    return JSONResponse(content={
        "type": "file_status",
        "status": "verified_ready",
        "filename": filename,
        "file_id": file_id,
        "size": len(content)
    })


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()

    current_task: Optional[asyncio.Task] = None
    temp_file_id: Optional[str] = None

    try:
        while True:

            message = await ws.receive_json()
            msg_type = message.get("type")

            if msg_type == "start":
                if current_task is None or current_task.done():
                    #przerobilem ta funckje w taki sposob ze teraz backend nie obsluguje zmiany encmode
                    #enc_mode zalezy tylko od frontu, natomiast uruchomienie szyfrowania polega na przeslaniu jsona:
                    # "type":"start",
                     # "enc_mode":"aes",
                     # "file_id": "84a6ffab-a306-44cc-b99a-d3ac8c62f193"
                    #file_id jest dostarczane do frontu przez backend po uploadzie

                    enc_mode = message.get("enc_mode")
                    file_id = message.get("file_id")

                    if not file_id or file_id not in TEMPORARY_FILE_STORAGE:
                        await ws.send_json({"type": "error",
                                            "message": "Nie znaleziono takiego pliku"})
                        continue

                    file_info = TEMPORARY_FILE_STORAGE[file_id]
                    temp_file_id = file_id

                    current_task = asyncio.create_task(
                        tasks.run_with_status(ws, enc_mode, file_info["path"], file_info["original_filename"])
                    )
                    await ws.send_json({"type": "started", "mode": enc_mode})
                else:
                    await ws.send_json({
                        "type": "error",
                        "message": "Szyfowanie w trakcie, kliknij cancel"
                    })

            elif msg_type == "cancel":
                if current_task and not current_task.done():
                    current_task.cancel()
                    try:
                        await current_task
                    except asyncio.CancelledError:
                        pass

                    await ws.send_json({"type": "canceled"})
                    current_task = None


    except WebSocketDisconnect:

        if current_task and not current_task.done():
            current_task.cancel()
    finally:
        if current_task and not current_task.done():
            current_task.cancel()

        tasks.cleanup_file_logic(temp_file_id, TEMPORARY_FILE_STORAGE)