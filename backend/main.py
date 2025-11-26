import asyncio
import datetime
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import psutil

app = FastAPI()

#zamiast tego w pozniejszym czasie funkcja szyfrujaca
async def przykladowy_timer():
    await asyncio.sleep(5)
    return 1

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()

    timer = asyncio.create_task(przykladowy_timer())
    sequence = 0
    task_start = datetime.datetime.now()
    while not timer.done():
        current_usage_package = {
            "type" : "status",
            "sequence":  sequence,
            "timestamp": datetime.datetime.now().isoformat(),
            "data":{
                "cpu_usage_percent": psutil.cpu_percent(),
                "mem_total": psutil.virtual_memory().total,
                "mem_usage": psutil.virtual_memory().used,
                "mem_usage_percent": psutil.virtual_memory().percent
            }
        }
        await ws.send_json(current_usage_package)
        sequence += 1
        await asyncio.sleep(0.2)
    time_elapsed = datetime.datetime.now() - task_start
    await ws.send_json({
            "type" : "summary",
            "sequence":  sequence,
            "timestamp": datetime.datetime.now().isoformat(),
            "time_elapsed": time_elapsed.total_seconds()
        })
    sequence = 0