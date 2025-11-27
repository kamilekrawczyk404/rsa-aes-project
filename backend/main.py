import asyncio
from fastapi import FastAPI, WebSocket
import tasks


app = FastAPI()


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    current_task = None
    enc_mode = "aes"
    while True:
        message = await ws.receive_json()

        if message["type"] == "change_mode":
            if current_task is None or current_task.done():
                enc_mode = message["enc_mode"]
                await ws.send_json({"type": "mode_changed"})
            else:
                await ws.send_json({"type": "error",
                                    "message": "cannot_change_mode_while_running"})

        elif message["type"]=="start":
            if current_task is None or current_task.done():
                current_task = asyncio.create_task(tasks.run_with_status(ws, enc_mode))
                await ws.send_json({"type":"started"})
            else:
                await ws.send_json({"type":"already_running"})

        elif message["type"]=="cancel":
            if current_task and not current_task.done():
                current_task.cancel()
                await ws.send_json({"type":"canceling"})
            else:
                await ws.send_json({"type":"not_running"})




