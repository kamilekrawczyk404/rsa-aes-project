import type {
  Algorithm,
  ControlCommand,
  FileRaceState,
  IncomingWebSocketMessage,
  MetricDTO,
  StartRaceCommand,
  UploadedFile,
} from "../types/crypto.ts";
import { useEffect, useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const WS_URL = "ws://localhost:8000/ws";

export const useCryptoProcess = () => {
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Queue of files to be processed
  const [fileQueue, setFileQueue] = useState<UploadedFile[]>([]);

  // Currently processed file index
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(-1);

  // Race state for currently processed file
  const [raceState, setRaceState] = useState<FileRaceState | null>(null);

  // If race is running
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const configRef = useRef<any>(null);

  const { lastJsonMessage, readyState, sendJsonMessage } =
    useWebSocket<IncomingWebSocketMessage>(socketUrl, {
      share: false,
      shouldReconnect: () => false,
      onOpen: () => {
        console.log("WebSocket connection opened");
        if (fileQueue.length > 0 && currentFileIndex === -1) {
          processNextFile(0);
        }
      },
      onClose: () => {
        console.log("WebSocket connection closed");
        setIsRunning(false);
        setSocketUrl(null);
      },
      onError: (event) => console.error("WebSocket error observed:", event),
    });

  useEffect(() => {
    if (!lastJsonMessage) return;

    const msg = lastJsonMessage;

    if (msg.type === "metric_update" && msg.data && msg.algorithm) {
      updateRaceMetrics(msg.algorithm, msg.data);
    }

    if (msg.type === "process_finished" && msg.algorithm) {
      completeAlgorithm(msg.algorithm, msg.download_url, msg.total_time);
    }

    if (msg.type === "batch_completed") {
      setIsRunning(false);
      console.log("All files processed.");
    }
  }, [lastJsonMessage]);

  const updateRaceMetrics = (alg: Algorithm, data: MetricDTO) => {
    setRaceState((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        [alg.toLowerCase()]: {
          ...prev[alg.toLowerCase() as "aes" | "rsa"],
          progress: data.progress,
          cpu: data.cpu_usage,
          throughput: data.throughput,
        },
      };
    });
  };

  const completeAlgorithm = (alg: Algorithm, url?: string, time?: number) => {
    setRaceState((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        [alg.toLowerCase()]: {
          ...prev[alg.toLowerCase() as "aes" | "rsa"],
          finished: true,
          progress: 100,
          downloadUrl: url,
          time,
        },
      };
    });
  };

  const initializeSession = (
    sessId: string,
    files: UploadedFile[],
    config: any,
  ) => {
    setSessionId(sessId);
    setFileQueue(files);
    configRef.current = config;
  };

  const startProcessing = () => {
    if (!sessionId) return;
    setSocketUrl(WS_URL);
    setIsRunning(true);
  };

  const processNextFile = (index: number) => {
    if (index >= fileQueue.length) return;

    const file = fileQueue[index];
    setCurrentFileIndex(index);

    setRaceState({
      fileId: file.id,
      fileName: file.name,
      fileSize: file.size,
      status: "processing",
      aes: { progress: 0, cpu: 0, throughput: 0, finished: false },
      rsa: { progress: 0, cpu: 0, throughput: 0, finished: false },
    });

    const payload: StartRaceCommand = {
      command: "START_RACE",
      session_id: sessionId!,
      file_id: file.id,
      config: configRef.current,
    };

    sendJsonMessage(payload);
  };

  const skipToNextFile = () => {
    const payload: ControlCommand = {
      command: "NEXT_FILE",
      session_id: sessionId!,
    };

    sendJsonMessage(payload);

    const nextIndex = currentFileIndex + 1;
    if (nextIndex < fileQueue.length) {
      processNextFile(nextIndex);
    } else {
      setIsRunning(false);
    }
  };

  const stopAll = () => {
    const payload: ControlCommand = {
      command: "STOP_ALL",
      session_id: sessionId!,
    };

    sendJsonMessage(payload);

    setSocketUrl(null);
    setIsRunning(false);
    setRaceState(null);
  };

  return {
    isConnected: readyState === ReadyState.OPEN,
    isRunning,
    currentFile: raceState,
    queueProgress: { current: currentFileIndex + 1, total: fileQueue.length },
    initializeSession,
    startProcessing,
    skipToNextFile,
    stopAll,
  };
};
