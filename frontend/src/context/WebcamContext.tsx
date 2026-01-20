import {
  createContext,
  useContext,
  type ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useWebSocketConnection } from "./WebSocketProvider.tsx";

interface WebcamConfig {
  algo: string;
  mode: string;
  keySize: number;
}

interface WebcamContextType {
  isStreaming: boolean;
  config: WebcamConfig;
  setConfig: (c: WebcamConfig) => void;
  toggleStream: () => void;
  lastFrame: ImageBitmap | null;
  latency: number;
}

const WebcamContext = createContext<WebcamContextType | null>(null);

export const WebcamProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, sendJson, lastMessage } = useWebSocketConnection();

  const [isStreaming, setIsStreaming] = useState(false);
  const [config, setConfig] = useState<WebcamConfig>({
    algo: "AES",
    mode: "ECB",
    keySize: 128,
  });

  const [lastFrame, setLastFrame] = useState<ImageBitmap | null>(null);
  const [latency, setLatency] = useState(0);

  const lastPingRef = useRef<number>(0);

  useEffect(() => {
    if (!lastMessage || !isStreaming) return;

    const now = performance.now();

    if (lastPingRef.current > 0) {
      setLatency(Math.round(now - lastPingRef.current));
    }

    if (lastMessage.data instanceof Blob) {
      createImageBitmap(lastMessage.data).then(setLastFrame);
    }
  }, [lastMessage, isStreaming]);

  const toggleStream = useCallback(() => {
    if (!isConnected) return;

    if (isStreaming) {
      sendJson({ command: "STOP_WEBCAM" });
      setIsStreaming(false);
    } else {
      const sessionId = "cam_" + crypto.randomUUID();
      sendJson({
        command: "START_WEBCAM",
        session_id: sessionId,
        config: { aes: { key_size: config.keySize, mode: config.mode } },
      });
      setIsStreaming(true);
    }
  }, [isConnected, isStreaming, sendJson, config]);

  useEffect(() => {
    if (!isConnected && isStreaming) {
      setIsStreaming(false);
    }
  }, [isConnected]);

  return (
    <WebcamContext.Provider
      value={{
        isStreaming,
        config,
        setConfig,
        toggleStream,
        lastFrame,
        latency,
      }}
    >
      {children}
    </WebcamContext.Provider>
  );
};

export const useWebcamLogic = () => {
  const context = useContext(WebcamContext);
  if (!context)
    throw new Error("useWebcamLogic must be used within WebcamProvider");
  return context;
};
