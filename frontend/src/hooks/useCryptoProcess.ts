import type {
  CryptoConfig,
  CryptoState,
  IncomingWebSocketMessage,
  MetricPoint,
} from "../types/crypto.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const WS_URL = "ws://localhost:8000/ws";
const CACHE_KEY = ["crypto-metrics"];

export const INITIAL_STATE: CryptoState = {
  status: "idle",
  metrics: [],
  summary: null,
};

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const useCryptoProcess = () => {
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);

  const queryClient = useQueryClient();

  const { data: state } = useQuery<CryptoState>({
    queryKey: CACHE_KEY,
    queryFn: () => INITIAL_STATE,
    enabled: false,
    initialData: INITIAL_STATE,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { lastJsonMessage, readyState, sendJsonMessage } =
    useWebSocket<IncomingWebSocketMessage>(socketUrl, {
      share: false,
      shouldReconnect: () => false,
      onOpen: () => console.log("WebSocket connection opened"),
      onClose: () => {
        setSocketUrl(null);
        console.log("WebSocket connection closed");
      },
      onError: (event) => console.error("WebSocket error observed:", event),
    });

  useEffect(() => {
    if (lastJsonMessage !== null) {
      handleServerMessage(lastJsonMessage);
    }
  }, [lastJsonMessage]);

  useEffect(() => {
    if (readyState === ReadyState.OPEN && pendingPayload) {
      console.log("FILES ARE BEING SENT", pendingPayload);

      sendJsonMessage({
        type: "START_PROCESS",
        pendingPayload: pendingPayload,
      });

      setPendingPayload(null);
    }
  }, [readyState, pendingPayload, sendJsonMessage]);

  const handleServerMessage = (message: IncomingWebSocketMessage) => {
    queryClient.setQueryData<CryptoState>(
      CACHE_KEY,
      (oldData: CryptoState | undefined): CryptoState => {
        const current = oldData ?? INITIAL_STATE;

        if (message.type === "status") {
          const newPoint: MetricPoint = {
            timestamp: new Date(message.timestamp).toLocaleTimeString(),
            cpuUsage: message.data.cpu_usage_percent,
            ramUsageMB: message.data.mem_usage_percent,
            sequence: message.sequence,
          };

          return {
            ...current,
            status: "running",
            metrics: [...current.metrics, newPoint].slice(-50),
          };
        }

        if (message.type === "summary") {
          return {
            ...current,
            status: "finished",
            summary: { totalTimeElapsed: message.time_elapsed },
          };
        }

        return current;
      },
    );
  };

  const startTest = useCallback(
    async (config: CryptoConfig) => {
      // Reset prev charts
      queryClient.setQueryData(CACHE_KEY, INITIAL_STATE);

      const processedFiles = await Promise.all(
        config.files.map(async (f) => ({
          name: f.file.name,
          size: f.file.size,
          content: await readFileAsBase64(f.file),
        })),
      );

      // Save processed files
      setPendingPayload({
        config,
        files: processedFiles,
      });

      // Open ws connection
      setSocketUrl(WS_URL);
    },
    [queryClient],
  );

  const stopTest = useCallback(() => {
    setSocketUrl(null);
    setPendingPayload(null);
  }, []);

  return {
    metrics: state?.metrics || [],
    status: state?.status || "idle",
    summary: state?.summary || null,
    isConnected: readyState === ReadyState.OPEN,
    startTest,
    stopTest,
  };
};
