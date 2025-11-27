import type {CryptoState, IncomingWebSocketMessage, MetricPoint } from "../types/crypto.ts";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useCallback, useEffect, useState} from "react";
import useWebSocket, {ReadyState} from "react-use-websocket";

const WS_URL = "ws://localhost:8000/ws";
const CACHE_KEY = ['crypto-metrics'];

export const INITIAL_STATE: CryptoState = {
    status: "idle",
    metrics: [],
    summary: null
}

export const useCryptoProcess = () => {
    const [socketUrl, setSocketUrl] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const {data: state} = useQuery<CryptoState>({
        queryKey: CACHE_KEY,
        initialData: INITIAL_STATE,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
    })

    const { lastJsonMessage, readyState } = useWebSocket<IncomingWebSocketMessage>(socketUrl, {
        share: false,
        shouldReconnect: () => false,
        onOpen: () => console.log("WebSocket connection opened"),
        onClose: () => {
            setSocketUrl(null);
            console.log("WebSocket connection closed")
        },
        onError: (event) => console.error("WebSocket error observed:", event),
    })


    useEffect(() => {
        if (lastJsonMessage !== null) {
            handleServerMessage(lastJsonMessage)
        }
    }, [lastJsonMessage])

    const handleServerMessage = (message: IncomingWebSocketMessage) => {
        queryClient.setQueryData<CryptoState>(CACHE_KEY, (oldData: CryptoState | undefined): CryptoState => {
            const current = oldData ?? INITIAL_STATE;

            if (message.type === 'status') {
                const newPoint: MetricPoint = {
                    timestamp: new Date(message.timestamp).toLocaleTimeString(),
                    cpuUsage: message.data.cpu_usage_percent,
                    ramUsageMB: message.data.mem_usage_percent,
                    sequence: message.sequence
                };

                return {
                    ...current,
                    status: 'running',
                    metrics: [...current.metrics, newPoint].slice(-50)
                };
            }

            if (message.type === 'summary') {
                return {
                    ...current,
                    status: 'finished',
                    summary: { totalTimeElapsed: message.time_elapsed }
                };
            }

            return current;
        });
    };

    const startTest = useCallback(() => {
        queryClient.setQueryData(CACHE_KEY, INITIAL_STATE);
        setSocketUrl(WS_URL);
    }, [queryClient]);

    const stopTest = useCallback(() => {
        setSocketUrl(null);
    }, []);

    return {
        metrics: state?.metrics || [],
        status: state?.status || 'idle',
        summary: state?.summary || null,
        isConnected: readyState === ReadyState.OPEN,
        startTest,
        stopTest
    };
}