import asyncio
import time
from multiprocessing import Process, Manager
from .workers import encryption_worker


async def process_queue_task(session_id, file_ids, config, metric_queue, stop_event, active_processes, websocket, sessions_db, next_file_event):
    start_time = time.time()

    with Manager() as manager:
        shared_stats = manager.list()

        for index, f_id in enumerate(file_ids):
            await next_file_event.wait()
            next_file_event.clear()

            file_path = sessions_db.get(session_id, {}).get(f_id)
            if not file_path:
                continue

            p_aes = Process(target=encryption_worker,
                            args=("AES", f_id, file_path, config['aes'], metric_queue, stop_event, shared_stats))
            p_rsa = Process(target=encryption_worker,
                            args=("RSA", f_id, file_path, config['rsa'], metric_queue, stop_event, shared_stats))

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

        total_time = time.time() - start_time

        avg_throughput = 0
        avg_cpu = 0

        if len(shared_stats) > 0:
            total_throughput = sum(item['throughput'] for item in shared_stats)
            total_cpu = sum(item['cpu_usage'] for item in shared_stats)
            avg_throughput = total_throughput / len(shared_stats)
            avg_cpu = total_cpu / len(shared_stats)

        summary = {
            "total_time": round(total_time, 2),
            "total_files": len(file_ids),
            "average_throughput": round(avg_throughput, 2),
            "average_cpu_usage": round(avg_cpu, 2)
        }

        await websocket.send_json({
            "type": "batch_complete",
            "summary": summary
        })