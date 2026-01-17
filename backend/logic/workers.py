import time
import psutil
import os


def encryption_worker(algo, file_id, file_path, config, queue, stop_event):
    process = psutil.Process(os.getpid())
    process.cpu_percent(None)
    file_size = os.path.getsize(file_path)
    processed_bytes = 0
    start_time = time.time()
    last_metric_time = start_time

    if algo == "AES":
        chunk_size = 64 * 1024
    else:
        chunk_size = (config.get("key_size", 2048) // 8) - 42

    output_filename = f"{os.path.basename(file_path)}_{algo.lower()}.enc"
    output_path = os.path.join(os.path.dirname(file_path), output_filename)

    try:
        with open(file_path, "rb") as f_in, open(output_path, "wb") as f_out:
            while processed_bytes < file_size:
                if stop_event.is_set():
                    return

                elapsed_total = time.time() - start_time
                if algo == "RSA" and elapsed_total > 60:
                    queue.put({
                        "file_id": file_id,
                        "type": "process_finished",
                        "algorithm": algo,
                        "status": "timeout",
                        "message": "Limit 60s przekroczony"
                    })
                    return

                chunk = f_in.read(chunk_size)
                if not chunk:
                    break

                if algo == "RSA":
                    time.sleep(0.01) #zamiast tego pozniej normalna funkcja

                f_out.write(chunk)
                processed_bytes += len(chunk)

                current_time = time.time()
                if current_time - last_metric_time >= 0.1:
                    elapsed = current_time - start_time
                    throughput = (processed_bytes / (1024 * 1024)) / elapsed if elapsed > 0 else 0

                    queue.put({
                        "file_id": file_id,
                        "type": "metric_update",
                        "algorithm": algo,
                        "timestamp": int(current_time),
                        "data": {
                            "progress": round((processed_bytes / file_size) * 100, 2),
                            "cpu_usage": process.cpu_percent(),
                            "throughput": round(throughput, 2),
                            "processed_bytes": processed_bytes
                        }
                    })

        queue.put({
            "file_id": file_id,
            "type": "process_finished",
            "algorithm": algo,
            "download_url": f"/api/download/{output_filename}"
        })
    except Exception as e:
        queue.put({"type": "error", "algorithm": algo, "message": str(e)})