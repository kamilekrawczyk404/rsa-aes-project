export type Algorithm = "AES" | "RSA";
export type AesKeySize = 128 | 192 | 256 | 512;
export type RsaKeySize = 1024 | 2048 | 4096 | 8192;


export interface StatusDataDTO {
    cpu_usage_percent: number;
    mem_total: number;
    mem_usage: number;
    mem_usage_percent: number;
}

interface BaseWebSocketMessage {
    type: "status" | "summary";
    sequence: number;
    timestamp: string;
}

export interface StatusPackageDTO extends BaseWebSocketMessage {
    type: "status";
    data: StatusDataDTO
}

export interface SummaryPackageDTO extends BaseWebSocketMessage {
    type: "summary";
    time_elapsed: number;
}

export type IncomingWebSocketMessage = StatusPackageDTO | SummaryPackageDTO;

export interface MetricPoint {
    timestamp: string;
    sequence: number;
    cpuUsage: number;
    ramUsageMB: number;
}

export interface TestSummary {
    totalTimeElapsed: number;
}

export interface CryptoState {
    status: "idle" | "running" | "finished";
    metrics: MetricPoint[];
    summary: TestSummary | null;
}

export interface StartProcessParams {
    files: string[];
    aesKeySize: AesKeySize,
    rsaKeySize: RsaKeySize,
}