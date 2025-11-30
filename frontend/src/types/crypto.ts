export type Algorithm = "AES" | "RSA";

export const AES_KEY_SIZES = [128, 192, 256, 512] as const;
export const RSA_KEY_SIZES = [1024, 2048, 4096, 8192] as const;

export type AesKeySize = (typeof AES_KEY_SIZES)[number];
export type RsaKeySize = (typeof RSA_KEY_SIZES)[number];

export type FileWithMeta = {
  file: File;
  id: string;
  progress: number;
  status: "uploading" | "completed" | "error";
};

export interface CryptoConfig {
  aes: { keySize: AesKeySize };
  rsa: { keySize: RsaKeySize };
  files: FileWithMeta[];
}

export const ALGORITHM_DEFS = {
  AES: {
    id: "AES",
    name: "AES (Advanced Encryption Standard)",
    description:
      "Standard symetryczny. Szybki i bezpieczny. Używany przez rządy i banki.",
    keySizes: AES_KEY_SIZES,
  },
  RSA: {
    id: "RSA",
    name: "RSA (Rivest–Shamir–Adleman)",
    description:
      "Standard asymetryczny. Wolniejszy, ale umożliwia bezpieczną wymianę kluczy.",
    keySizes: RSA_KEY_SIZES,
  },
} as const;

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
  data: StatusDataDTO;
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
  aesKeySize: AesKeySize;
  rsaKeySize: RsaKeySize;
}
