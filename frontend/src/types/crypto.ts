// HTTP GET /api/config

export interface SystemConfig {
  max_file_size_bytes: number;
  allowed_extensions: string[];
}

// HTTP POST /api/upload
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
}

export interface UploadResponse {
  session_id: string;
  files: UploadedFile[];
}

// WebSocket Messages

export type Algorithm = "AES" | "RSA";

export const AES_MODES = ["ECB", "CBC", "CFB", "OFB", "CTR"] as const;
export type AesMode = (typeof AES_MODES)[number];

export type AlgorithmMode = AesMode;

export const AES_KEY_SIZES = [128, 192, 256] as const;
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
  aes: { keySize: AesKeySize; mode: AesMode };
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
    modes: AES_MODES,
  },
  RSA: {
    id: "RSA",
    name: "RSA (Rivest–Shamir–Adleman)",
    description:
      "Standard asymetryczny. Wolniejszy, ale umożliwia bezpieczną wymianę kluczy.",
    keySizes: RSA_KEY_SIZES,
  },
} as const;

// export interface StatusDataDTO {
//   cpu_usage_percent: number;
//   mem_total: number;
//   mem_usage: number;
//   mem_usage_percent: number;
// }

// interface BaseWebSocketMessage {
//   type: "status" | "summary";
//   sequence: number;
//   timestamp: string;
// }

// export interface StatusPackageDTO extends BaseWebSocketMessage {
//   type: "status";
//   data: StatusDataDTO;
// }
//
// export interface SummaryPackageDTO extends BaseWebSocketMessage {
//   type: "summary";
//   time_elapsed: number;
// }

// export type IncomingWebSocketMessage = StatusPackageDTO | SummaryPackageDTO;

export interface MetricPoint {
  timestamp: string;
  sequence: number;
  cpuUsage: number;
  ramUsageMB: number;
}

export interface TestSummary {
  totalTimeElapsed: number;
}

// export interface CryptoState {
//   status: "idle" | "running" | "finished";
//   metrics: MetricPoint[];
//   summary: TestSummary | null;
// }

// export interface StartProcessParams {
//   files: string[];
//   aesKeySize: AesKeySize;
//   rsaKeySize: RsaKeySize;
// }

export interface StartRaceCommand {
  command: "START_RACE";
  session_id: string;
  file_id: string;

  config: {
    aes: { key_size: number; mode: AesMode };
    rsa: { key_size: number };
  };
}

export interface ControlCommand {
  command: "NEXT_FILE" | "STOP_ALL";
  session_id?: string;
}

export interface MetricDTO {
  progress: number;
  cpu_usage: number;
  throughput: number;
  processed_bytes: number;
}

export interface IncomingWebSocketMessage {
  type:
    | "metric_update"
    | "process_finished"
    | "file_start"
    | "batch_completed"
    | "error";
  file_id?: string;
  algorithm?: Algorithm;
  timestamp?: number;
  data?: MetricDTO;
  total_time?: number;
  download_url?: string;
  summary?: {
    total_time: number;
    total_files: number;
    average_throughput: number;
  };
}

export interface AlgorithmRaceState {
  progress: number;
  throughput: number;
  finished: boolean;
  cpu: number;
  downloadUrl?: string;
  time?: number;
}

export interface FileRaceState {
  fileId: string;
  fileName: string;
  fileSize: number;
  status: "pending" | "processing" | "completed" | "error";
  aes: AlgorithmRaceState;
  rsa: AlgorithmRaceState & { aborted?: boolean };
}
