import asyncio
from multiprocessing import Process
from .workers import encryption_worker


async def process_queue_task(session_id, file_ids, config, metric_queue, stop_event, active_processes, websocket, sessions_db):
    for index, f_id in enumerate(file_ids):
        file_path = sessions_db.get(session_id, {}).get(f_id)
        if not file_path:
            continue

        p_aes = Process(target=encryption_worker,
                        args=("AES", f_id, file_path, config['aes'], metric_queue, stop_event))
        p_rsa = Process(target=encryption_worker,
                        args=("RSA", f_id, file_path, config['rsa'], metric_queue, stop_event))

        active_processes.extend([p_aes, p_rsa])
        p_aes.start()
        p_rsa.start()

        while any(p.is_alive() for p in active_processes):
            await asyncio.sleep(0.5)
            if stop_event.is_set():
                break

        active_processes.clear()

        if stop_event.is_set():
            break

        await websocket.send_json({"type": "file_completed", "file_id": f_id})

    await websocket.send_json({"type": "batch_complete"})