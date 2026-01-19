import time
import psutil
import os
import sys

try:
    from functions._endpoint import what_to_run
except ImportError:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from functions._endpoint import what_to_run


def encryption_worker(algo, file_id, file_path, config, queue, stop_event):
    process = psutil.Process(os.getpid())
    try:
        process.cpu_percent(None)
    except:
        pass

    file_size = os.path.getsize(file_path)
    processed_bytes = 0
    start_time = time.time()
    last_metric_time = start_time

    key_size = config.get("key_size", 128)
    mode_raw = config.get("mode", "ECB")

    if algo == "AES":
        mode_str = f"AES_{mode_raw}"
        chunk_size = 64 * 1024
    else:
        mode_str = "RSA_encrypt"

        chunk_size = (key_size // 8) - 64
        if chunk_size <= 0: chunk_size = 32


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
                        "message": "Limit 60s przekroczony (RSA)"
                    })
                    return

                chunk = f_in.read(chunk_size)
                if not chunk:
                    break


                try:
                    if algo == "AES" and mode_raw in ["ECB", "CBC"]:
                        pad_len = 16 - (len(chunk) % 16)
                        if pad_len != 16:
                            chunk += b'\0' * pad_len


                    result_tuple = what_to_run(chunk, key_size, mode_str)

                    if isinstance(result_tuple, tuple):
                        encrypted_data = result_tuple[0]
                    else:
                        encrypted_data = result_tuple

                    f_out.write(encrypted_data)

                except Exception as crypt_err:
                    raise Exception(f"Błąd funkcji {mode_str}: {str(crypt_err)}")

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
                    last_metric_time = current_time

        queue.put({
            "file_id": file_id,
            "type": "process_finished",
            "algorithm": algo,
            "download_url": f"/api/download/{output_filename}"
        })

    except Exception as e:
        queue.put({"type": "error", "algorithm": algo, "message": str(e)})