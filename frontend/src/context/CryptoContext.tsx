import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import type {
  Algorithm,
  BatchSummary,
  ControlCommand,
  FileRaceState,
  FileRaceStatus,
  MetricDTO,
  StartRaceCommand,
  UploadedFile,
} from "../types/crypto.ts";
import { useEffect, useRef, useState } from "react";
import type { LocalConfig } from "../pages/Configurator.tsx";
import { useWebSocketConnection } from "./WebSocketProvider.tsx";

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
  skipRsa: () => void;
  stopAll: () => void;
  resetRace: () => void;
  setCurrentlyDisplayedFile: (fileId: string) => void;
  skipToNextFile: () => void;
}

const CryptoContext = createContext<CryptoContextValues | null>(null);

// Crypto Process must be available throughout the app
export const CryptoProcessProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  // If race is running
  const { isConnected, sendJson, lastJsonMessage, disconnect } =
    useWebSocketConnection({ onDisconnect: () => setSessionId(null) });

  const [hasSentStartedCommand, setHasSentStartedCommand] =
    useState<boolean>(false);

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

  // Determine if the process is running
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const currentFile = raceState[currentFileIndex];

  const configRef = useRef<LocalConfig | null>(null);

  const isSessionInitialized = sessionId !== null;

  // Decide when to start the process
  // It runs only when
  // 1. We have connection
  // 2. We have files in the queue
  // 3. Session is initialized, but the race doesn't start yet
  useEffect(() => {
    if (
      isConnected &&
      isSessionInitialized &&
      fileQueue.length > 0 &&
      !hasSentStartedCommand
    ) {
      const payload: StartRaceCommand = {
        command: "START_RACE",
        session_id: sessionId,
        file_ids: fileQueue.map((f) => f.id),
        config: configRef.current!,
      };

      sendJson(payload);
      setHasSentStartedCommand(true);
      setIsRunning(true);
      processNextFile();
    }
  }, [
    isConnected,
    isSessionInitialized,
    fileQueue,
    hasSentStartedCommand,
    sendJson,
  ]);

  // Handle messaged that are coming from WebSocket
  useEffect(() => {
    if (!lastJsonMessage) return;

    const msg = lastJsonMessage;

    if (msg.type === "metric_update" && msg.data && msg.algorithm) {
      updateRaceMetrics(msg.algorithm, msg.data);
    }

    if (msg.type === "process_finished" && msg.algorithm) {
      console.log("Process finished received for algorithm:", msg);

      completeAlgorithm(
        msg.algorithm,
        msg.download_url,
        msg.total_time,
        msg?.status,
      );
    }

    if (msg.type === "file_completed") {
      console.log("File complete received for file ID:", msg.file_id);

      if (currentFile && msg.file_id === currentFile.fileId) {
        console.log("File ID matches current file. Processing next file.");
        setIsFileProcessed(true);

        completeProcessedFile(currentFile.fileId);
      } else {
        console.log("File ID does not match current file. Ignoring.");
      }
    }

    if (msg.type === "batch_complete" && msg.summary) {
      // Prepare batch summary (content for the summary modal)
      setBatchSummary({
        total_time: msg.summary.total_time || 0,
        total_files: msg.summary.total_files || 0,
        average_throughput: msg.summary.average_throughput || 0,
        average_cpu_usage: msg.summary.average_cpu_usage || 0,
      });

      // Set the status of the last file to processed
      completeProcessedFile(currentFile.fileId);

      // Process is not running now
      setIsRunning(false);
      disconnect();
    }
  }, [lastJsonMessage]);

  const updateRaceMetrics = useCallback(
    (alg: Algorithm, data: MetricDTO) => {
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
    },
    [currentFileIndex],
  );

  const completeAlgorithm = useCallback(
    (alg: Algorithm, url?: string, time?: number, status?: FileRaceStatus) => {
      setRaceState((prev) =>
        prev.map((rs, index) => {
          if (index !== currentFileIndex) return rs;

          let fileStatus = rs.status;

          if (
            (alg === "AES" && rs.rsa.finished) ||
            (alg === "RSA" && rs.aes.finished)
          ) {
            fileStatus = "completed";
          }

          let algorithmStatus = "processing";

          if (alg === "AES" && rs.aes.finished) {
            algorithmStatus = "completed";
          } else if (alg === "RSA" && rs.rsa.finished) {
            algorithmStatus = "completed";
          } else if (status === "skipped") {
            algorithmStatus = "skipped";
          }

          return {
            ...rs,
            status: fileStatus,
            [alg.toLowerCase()]: {
              ...rs[alg.toLowerCase() as "aes" | "rsa"],
              finished: true,
              downloadUrl: url,
              time,
              status: algorithmStatus,
              progress:
                algorithmStatus === "completed"
                  ? 100
                  : rs[alg.toLowerCase() as "aes" | "rsa"].progress,
            },
          };
        }),
      );
    },
    [currentFileIndex],
  );

  const initializeSession = useCallback(
    (sessId: string, files: UploadedFile[], config: any) => {
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

      setCurrentFileIndex(-1);
      setHasSentStartedCommand(false);
      setIsRunning(false);
      setBatchSummary(null);
    },
    [],
  );

  // Process the next file in the queue
  const processNextFile = useCallback(() => {
    const index = currentFileIndex + 1;

    if (index >= fileQueue.length) return;

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
  }, [currentFileIndex, fileQueue]);

  // Send command to skip to the next file (backend is waiting after processing each file)
  const skipToNextFile = useCallback(() => {
    const payload: ControlCommand = {
      command: "NEXT_FILE",
      session_id: sessionId!,
    };

    sendJson(payload);
    processNextFile();
  }, [sessionId, processNextFile]);

  const resetRace = useCallback(() => {
    setIsRunning(false);
    setSessionId(null);
    setBatchSummary(null);
    setRaceState([]);
    setFileQueue([]);
    setCurrentFileIndex(-1);
    setHasSentStartedCommand(false);
    disconnect();
  }, []);

  const skipRsa = useCallback(() => {
    setRaceState((prev) =>
      prev.map((rs, index) => {
        if (index !== currentFileIndex) return rs;

        return {
          ...rs,
          status: "skipped",
          rsa: {
            ...rs.rsa,
            finished: true,
            progress: 100,
            status: "skipped",
          },
        };
      }),
    );

    setIsFileProcessed(true);

    skipToNextFile();
  }, [currentFileIndex]);

  const completeProcessedFile = useCallback((fileId: string) => {
    setRaceState((prev) =>
      prev.map((rs) => {
        if (rs.fileId !== fileId) return rs;

        if (rs.status === "skipped") return rs;

        return {
          ...rs,
          status: "completed",
        };
      }),
    );
  }, []);

  const stopAll = useCallback(() => {
    if (sessionId) {
      const payload: ControlCommand = {
        command: "STOP_ALL",
        session_id: sessionId,
      };

      sendJson(payload);
    }

    resetRace();
  }, [sessionId]);

  const setCurrentlyDisplayedFile = useCallback(
    (fileId: string) => {
      const foundFileIndex = raceState.findIndex((f) => f.fileId === fileId);
      if (foundFileIndex === -1) return;

      setCurrentFileIndex(foundFileIndex);
    },
    [raceState],
  );

  const contextValue = useMemo(
    () => ({
      config: configRef.current,
      isSessionInitialized,
      batchSummary,
      isFileProcessed,
      fileQueue: raceState,
      isConnected,
      isRunning,
      currentFile,
      currentFileIndex,
      queueProgress: {
        current: currentFileIndex + 1,
        total: fileQueue.length,
      },
      initializeSession,
      skipRsa,
      stopAll,
      resetRace,
      setCurrentlyDisplayedFile,
      skipToNextFile,
      disconnect,
    }),
    [
      isSessionInitialized,
      batchSummary,
      isFileProcessed,
      raceState,
      isConnected,
      isRunning,
      currentFile,
      currentFileIndex,
      fileQueue.length,
      initializeSession,
      skipRsa,
      stopAll,
      resetRace,
      setCurrentlyDisplayedFile,
      skipToNextFile,
    ],
  );

  return (
    <CryptoContext.Provider value={contextValue}>
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
