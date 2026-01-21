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

export interface BatchSummary {
  total_time: number;
  total_files: number;
  average_throughput: number;
  average_cpu_usage: number;
}

export interface UploadResponse {
  session_id: string;
  files: UploadedFile[];
}

// WebSocket Messages
export type Algorithm = "AES" | "RSA";

export const AES_MODES = ["ECB", "CBC", "GCM"] as const;
export type AesMode = (typeof AES_MODES)[number];

export type AlgorithmMode = AesMode;

export const AES_KEY_SIZES = [128, 192, 256] as const;
export const RSA_KEY_SIZES = [1024, 2048, 4096] as const;

export type AesKeySize = (typeof AES_KEY_SIZES)[number];
export type RsaKeySize = (typeof RSA_KEY_SIZES)[number];

export type FileWithMeta = {
  file: File;
  id: string;
  progress: number;
  status: "uploading" | "completed" | "error";
};

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

export interface StartRaceCommand {
  command: "START_RACE";
  session_id: string;
  file_ids: string[];

  config: {
    aes: { key_size: number; mode: AesMode };
    rsa: { key_size: number };
  };
}

export interface ControlCommand {
  command: "NEXT_FILE" | "STOP_ALL";
  session_id?: string;
}

export interface StartRaceCommand {
  command: "START_RACE";
  session_id: string;
  file_ids: string[];

  config: {
    aes: { key_size: number; mode: AesMode };
    rsa: { key_size: number };
  };
}

export interface StartWebcamCommand {
  command: "START_WEBCAM";
  session_id: string;
  config: {
    aes: { key_size: number; mode: AesMode; implementation: "library" | "our" };
  };
}

export interface MetricDTO {
  progress: number;
  cpu_usage: number;
  throughput: number;
  processed_bytes: number;
}

export interface AlgorithmRaceState {
  progress: number;
  throughput: number;
  finished: boolean;
  cpu: number;
  downloadUrl?: string;
  time?: number;
}

export type FileRaceStatus =
  | "pending"
  | "processing"
  | "completed"
  | "error"
  | "skipped";

export interface FileRaceState {
  fileId: string;
  fileName: string;
  fileSize: number;
  status: FileRaceStatus;
  aes: AlgorithmRaceState;
  rsa: AlgorithmRaceState & { status?: FileRaceStatus };
}
