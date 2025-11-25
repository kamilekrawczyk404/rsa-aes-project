import asyncio
import datetime
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse

app = FastAPI()
#na razie prosty html poki frontu nie ma
html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test</title>
</head>
<body>
<h1>Dane</h1>
<button id="start">Start</button>
<div id="output"></div>

<script>
let ws;
document.getElementById("start").onclick = () => {
    ws = new WebSocket("ws://localhost:8080/ws");
    ws.onmessage = (event) => {
        document.getElementById("output").textContent = event.data;
    };
};
</script>
</body>
</html>
"""

@app.get("/")
async def get():
    return HTMLResponse(html)

async def przykladowy_timer():
    await asyncio.sleep(5)
    return 1

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    timer = asyncio.create_task(przykladowy_timer())
    while not timer.done():
        data = {"value": datetime.datetime.now().isoformat()}
        await ws.send_json(data)
        await asyncio.sleep(0.2)
    await ws.send_json({"status": "finished"})