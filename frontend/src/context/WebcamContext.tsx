import {
  createContext,
  useContext,
  type ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef,
  type Dispatch,
  type SetStateAction,
  useMemo,
} from "react";
import { useWebSocketConnection } from "./WebSocketProvider.tsx";
import type { AesKeySize, AesMode, Algorithm } from "../types/crypto.ts";

export interface WebcamConfig {
  algo: Algorithm;
  mode: AesMode;
  keySize: AesKeySize;
  video: MediaTrackConstraints;
}

interface WebcamContextType {
  isStreaming: boolean;
  config: WebcamConfig;
  setConfig: Dispatch<SetStateAction<WebcamConfig>>;
  toggleStream: () => void;
  lastFrame: Uint8ClampedArray | null;
  latency: number;
  notifyFrameSent: () => void;
}

export const DEFAULT_CONFIG_OPTIONS: WebcamConfig = {
  algo: "AES",
  mode: "ECB",
  keySize: 128,
  video: {
    width: { ideal: 40 },
    height: { ideal: 30 },
    frameRate: { ideal: 10 },
  },
};

const WebcamContext = createContext<WebcamContextType | null>(null);

export const WebcamProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, sendJson, lastMessage } = useWebSocketConnection();

  const [isStreaming, setIsStreaming] = useState(false);

  // Webcam configuration state
  const [config, setConfig] = useState<WebcamConfig>(DEFAULT_CONFIG_OPTIONS);

  // Last frame displayed on the processing side
  const [lastFrame, setLastFrame] = useState<Uint8ClampedArray | null>(null);

  // Latency measurement state
  const [latency, setLatency] = useState(0);

  const lastPingRef = useRef<number>(0);

  useEffect(() => {
    if (!lastMessage || !isStreaming) return;

    const now = performance.now();

    // Calculate latency
    if (lastPingRef.current > 0) {
      setLatency(Math.round(now - lastPingRef.current));
    }

    // Process incoming frame
    if (lastMessage.data instanceof Blob) {
      lastMessage.data.arrayBuffer().then((buffer) => {
        const rawBytes = new Uint8ClampedArray(buffer);

        setLastFrame(rawBytes);
      });
    }
  }, [lastMessage, isStreaming]);

  // Function to start/stop streaming
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

  // Notify that a frame has been sent to the server
  const notifyFrameSent = useCallback(() => {
    lastPingRef.current = performance.now();
  }, []);

  // Stop streaming if disconnected
  useEffect(() => {
    if (!isConnected && isStreaming) {
      setIsStreaming(false);
    }
  }, [isConnected]);

  const webcamContextValues = useMemo(
    () => ({
      isStreaming,
      config,
      setConfig,
      toggleStream,
      lastFrame,
      latency,
      notifyFrameSent,
    }),
    [
      isConnected,
      config,
      setConfig,
      toggleStream,
      lastFrame,
      lastFrame,
      notifyFrameSent,
    ],
  );

  return (
    <WebcamContext.Provider value={webcamContextValues}>
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
