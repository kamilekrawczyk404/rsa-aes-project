import {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const WS_URL = "ws://localhost:8000/ws";

interface UseWebsocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: MessageEvent<any> | null;
  lastJsonMessage: any;
  sendJson: (data: any) => void;
  sendBytes: (bytes: ArrayBuffer) => void;
  connect: () => void;
  getWebSocket: () => WebSocket | null | undefined;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(WS_URL, {
    share: true,
    shouldReconnect: () => true,
  });

  const sendBytes = useCallback(
    (bytes: ArrayBuffer) => {
      if (readyState === ReadyState.OPEN) {
        sendMessage(bytes);
      }
    },
    [readyState, sendMessage],
  );

  const value = useMemo(
    () => ({
      isConnected: readyState === ReadyState.OPEN,
      lastMessage,
      lastJsonMessage,
      sendJson: sendJsonMessage,
      sendBytes,
      getWebSocket,
      connect: () => {},
      disconnect: () => getWebSocket()?.close(),
    }),
    [
      readyState,
      lastMessage,
      lastJsonMessage,
      sendJsonMessage,
      sendBytes,
      getWebSocket,
    ],
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketConnection = (options?: UseWebsocketOptions) => {
  const context = useContext(WebSocketContext);
  if (!context)
    throw new Error(
      "useWebSocketConnection must be used within WebSocketProvider",
    );

  const onConnectRef = useRef(options?.onConnect);
  const onDisconnectRef = useRef(options?.onDisconnect);

  useEffect(() => {
    onConnectRef.current = options?.onConnect;
    onDisconnectRef.current = options?.onDisconnect;
  }, []);

  // Handle connection status changes
  useEffect(() => {
    if (context.isConnected) {
      if (onConnectRef.current) {
        onConnectRef.current();
      }
    } else {
      if (onDisconnectRef.current) {
        onDisconnectRef.current();
      }
    }
  }, [context.isConnected]);

  return context;
};
