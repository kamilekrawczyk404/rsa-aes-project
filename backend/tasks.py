import psutil
import datetime
import asyncio



#zamiast tego w pozniejszym czasie funkcja szyfrujaca
async def przykladowy_timer():
    await asyncio.sleep(5)
    return 1


ALGORITHMS = {
    "aes": {
        "normal": przykladowy_timer,
        "pro": przykladowy_timer
    },
    "rsa": {
        "normal": przykladowy_timer,
        "pro": przykladowy_timer
    }
}

#funcka odpowiadająca za uruchomienie szyfrowania, podczas ktorego wysyła ona dane z procesora, czasu oraz ramu
async def send_status(ws, func):
        task = asyncio.create_task(func())
        sequence = 0
        task_start = datetime.datetime.now()
        while not task.done():
            current_usage_package = {
                "type": "status",
                "sequence": sequence,
                "timestamp": datetime.datetime.now().isoformat(),
                "data": {
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
            "type": "summary",
            "sequence": sequence,
            "timestamp": datetime.datetime.now().isoformat(),
            "time_elapsed": time_elapsed.total_seconds()
        })


#funkcja która działa po kliknięciu start, wywoluje funkcje rozpoczynajaca szyfrowanie,
#najpierw normalne pozniej pro, nasluchuje cancela czyli przerwania szyfrowania i wysylania danych
async def run_with_status(ws, enc_mode):
    try:
        await ws.send_json({"type": "enc_mode", "value": enc_mode})
        normal_func = ALGORITHMS[enc_mode]["normal"]
        pro_func = ALGORITHMS[enc_mode]["pro"]

        await ws.send_json({"type": "phase", "value": "normal"})
        await send_status(ws, normal_func)

        await ws.send_json({"type": "phase", "value": "pro"})
        await send_status(ws, pro_func)

        await ws.send_json({"type": "finished"})

    except asyncio.CancelledError:
        await ws.send_json({"type": "cancelled"})
        raise