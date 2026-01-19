import { createContext, type ReactNode, useCallback, useContext } from "react";
import type {
  Algorithm,
  BatchSummary,
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

export interface CryptoContextValues {
  config: any;
  batchSummary: BatchSummary | null;
  isFileProcessed: boolean;
  fileQueue: FileRaceState[];
  isSessionInitialized: boolean;
  isConnected: boolean;
  isRunning: boolean;
  currentFile: FileRaceState | undefined;
  currentFileIndex: number;
  queueProgress: { current: number; total: number };
  initializeSession: (
    sessId: string,
    files: UploadedFile[],
    config: any,
  ) => void;
  startProcessing: () => void;
  skipToNextFile: () => void;
  skipRsa: () => void;
  stopAll: () => void;
  resetRace: () => void;
  setCurrentlyDisplayedFile: (fileId: string) => void;
  disconnect: () => void;
}

const CryptoContext = createContext<CryptoContextValues | null>(null);

// Crypto Process must be available throughout the app
export const CryptoProcessProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Queue of files to be processed
  const [fileQueue, setFileQueue] = useState<UploadedFile[]>([]);

  // Currently processed file index
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(-1);

  // Race state for currently processed file
  const [raceState, setRaceState] = useState<FileRaceState[]>([]);

  // Storing batch summary
  const [batchSummary, setBatchSummary] = useState<BatchSummary | null>(null);

  // Determine if the current file is processed
  const [isFileProcessed, setIsFileProcessed] = useState<boolean>(false);

  // If race is running
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const currentFile = raceState[currentFileIndex];

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
    if (currentFile && currentFile.aes.finished && currentFile.rsa.finished) {
      setIsFileProcessed(true);

      setRaceState((prev) =>
        prev.map((rs, index) => {
          if (index !== currentFileIndex) return rs;

          return {
            ...rs,
            status: "completed",
          };
        }),
      );
    } else {
      setIsFileProcessed(false);
    }
  }, [raceState]);

  useEffect(() => {
    if (!lastJsonMessage) return;

    const msg = lastJsonMessage;

    if (msg.type === "metric_update" && msg.data && msg.algorithm) {
      updateRaceMetrics(msg.algorithm, msg.data);
    }

    if (msg.type === "process_finished" && msg.algorithm) {
      completeAlgorithm(msg.algorithm, msg.download_url, msg.total_time);
    }

    if (msg.type === "batch_complete" && msg.summary) {
      // Prepare batch summary (content for the summary modal)
      console.log("Batch complete received:", msg.summary);
      setBatchSummary({
        total_time: msg.summary.total_time || 0,
        total_files: msg.summary.total_files || 0,
        average_throughput: msg.summary.average_throughput || 0,
      });

      // Set the status of the last file to processed
      setRaceState((prev) =>
        prev.map((f, index) => {
          if (index !== currentFileIndex) return f;

          return {
            ...f,
            status: "completed",
          };
        }),
      );

      // Process is not running now
      setIsRunning(false);
    }
  }, [lastJsonMessage]);

  const updateRaceMetrics = (alg: Algorithm, data: MetricDTO) => {
    setRaceState((prev) =>
      prev.map((rs, index) => {
        if (index !== currentFileIndex) return rs;

        return {
          ...rs,
          [alg.toLowerCase()]: {
            ...rs[alg.toLowerCase() as "aes" | "rsa"],
            progress: data.progress,
            cpu: data.cpu_usage,
            throughput: data.throughput,
          },
        };
      }),
    );
  };

  const completeAlgorithm = (alg: Algorithm, url?: string, time?: number) => {
    setRaceState((prev) =>
      prev.map((rs, index) => {
        if (index !== currentFileIndex) return rs;

        let isFileCompleted = rs.status;

        if (
          (alg === "AES" && rs.rsa.finished) ||
          (alg === "RSA" && rs.aes.finished)
        ) {
          isFileCompleted = "completed";
        }
        return {
          ...rs,
          status: isFileCompleted,
          [alg.toLowerCase()]: {
            ...rs[alg.toLowerCase() as "aes" | "rsa"],
            finished: true,
            progress: 100,
            downloadUrl: url,
            time,
          },
        };
      }),
    );
  };

  const initializeSession = (
    sessId: string,
    files: UploadedFile[],
    config: any,
  ) => {
    setSessionId(sessId);

    setFileQueue(files);

    setRaceState(
      files.map((file) => ({
        fileId: file.id,
        fileName: file.name,
        fileSize: file.size,
        status: "pending",
        aes: { progress: 0, cpu: 0, throughput: 0, finished: false },
        rsa: { progress: 0, cpu: 0, throughput: 0, finished: false },
      })),
    );

    configRef.current = config;

    setIsRunning(false);
    setBatchSummary(null);
  };

  const startProcessing = () => {
    if (!sessionId) return;
    setSocketUrl(WS_URL);

    setIsRunning(true);
  };

  const skipRsa = () => {
    setRaceState((prev) =>
      prev.map((rs, index) => {
        if (index !== currentFileIndex) return rs;

        return {
          ...rs,
          status: "skipped",
        };
      }),
    );

    setIsFileProcessed(true);

    skipToNextFile();
  };

  const processNextFile = (index: number) => {
    if (index >= fileQueue.length) return;

    const file = fileQueue[index];
    setCurrentFileIndex(index);
    setIsFileProcessed(false);

    setRaceState((prev) =>
      prev.map((rs, rsIndex) => {
        if (rsIndex !== index) return rs;

        return {
          ...rs,
          status: "processing",
        };
      }),
    );

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

  const resetRace = () => {
    setIsRunning(false);
    setSocketUrl(null);
    setSessionId(null);
    setBatchSummary(null);
    setRaceState([]);
    setFileQueue([]);
    setCurrentFileIndex(-1);
  };

  const stopAll = () => {
    if (sessionId) {
      const payload: ControlCommand = {
        command: "STOP_ALL",
        session_id: sessionId,
      };

      sendJsonMessage(payload);
    }

    resetRace();
  };

  const disconnect = useCallback(() => {
    setSocketUrl(null);
    setIsRunning(false);
  }, []);

  const setCurrentlyDisplayedFile = (fileId: string) => {
    const foundFileIndex = raceState.findIndex((f) => f.fileId === fileId);
    if (foundFileIndex === -1) return;

    setCurrentFileIndex(foundFileIndex);
  };

  return (
    <CryptoContext.Provider
      value={{
        config: configRef.current,
        batchSummary,
        isFileProcessed,
        fileQueue: raceState,
        isSessionInitialized: sessionId !== null,
        isConnected: readyState === ReadyState.OPEN,
        isRunning,
        currentFile,
        currentFileIndex,
        queueProgress: {
          current: currentFileIndex + 1,
          total: fileQueue.length,
        },
        initializeSession,
        startProcessing,
        skipToNextFile,
        skipRsa,
        stopAll,
        resetRace,
        setCurrentlyDisplayedFile,
        disconnect,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => {
  const context = useContext(CryptoContext);

  if (!context) {
    throw new Error("useCrypto must be used within a CryptoProcessProvider");
  }

  return context;
};
