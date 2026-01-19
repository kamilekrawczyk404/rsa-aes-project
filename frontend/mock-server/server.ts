import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

interface MetricPayload {
  progress: number;
  cpu_usage: number;
  throughput: number;
  processed_bytes: number;
}

interface BatchSummary {
  total_time: number;
  total_files: number;
  average_throughput: number;
}

interface WsResponse {
  type: "metric_update" | "process_finished" | "error" | "batch_complete";
  algorithm?: "AES" | "RSA";
  file_id?: string;
  data?: MetricPayload;
  total_time?: number;
  download_url?: string;
  summary?: BatchSummary;
}

interface StartCommand {
  command: "START_RACE";
  file_id: string;
  session_id: string;
  config: any;
}

interface CommandMessage {
  command: "START_RACE" | "NEXT_FILE" | "STOP_ALL";
  file_id?: string;
  session_id?: string;
}

interface SessionState {
  totalFiles: number;
  processedCount: number;
  startTime: number;
}

const activeSessions = new Map<string, SessionState>();

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get("/api/config", (req: Request, res: Response) => {
  res.json({
    max_file_size_bytes: 1024 * 1024 * 1024, // 1GB
    allowed_extensions: [".jpg", ".png", ".txt", ".pdf", ".docx"],
  });
});

app.post(
  "/api/upload",
  upload.array("files"),
  (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const sessionId = "sess_" + Math.random().toString(36).substring(2, 15);

    activeSessions.set(sessionId, {
      totalFiles: files.length,
      processedCount: 0,
      startTime: Date.now(),
    });

    console.log(`📦 Utworzono sesję: ${sessionId}, plików: ${files.length}`);

    const fakeFiles = files.map((f) => ({
      id: "file_" + Math.random().toString(36).substring(2, 9),
      name: f.originalname,
      size: f.size,
    }));

    res.json({
      session_id: sessionId,
      files: fakeFiles,
    });
  },
);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws: WebSocket) => {
  console.log("🔌 WS: Frontend połączony");

  let aesInterval: NodeJS.Timeout | null = null;
  let rsaInterval: NodeJS.Timeout | null = null;

  let currentSessionId: string | null = null;

  const clearSimulation = () => {
    if (aesInterval) clearInterval(aesInterval);
    if (rsaInterval) clearInterval(rsaInterval);
    aesInterval = null;
    rsaInterval = null;
  };

  ws.on("message", (rawMessage: Buffer) => {
    try {
      const message = JSON.parse(rawMessage.toString()) as CommandMessage;
      console.log("📩 WS Command:", message.command);

      if (
        message.command === "START_RACE" &&
        message.file_id &&
        message.session_id
      ) {
        currentSessionId = message.session_id;
        clearSimulation();

        const session = activeSessions.get(message.session_id);
        if (session) {
          session.processedCount++;
          console.log(
            `📊 Sesja ${message.session_id}: Przetwarzanie pliku ${session.processedCount}/${session.totalFiles}`,
          );
        }

        startRaceSimulation(ws, message.file_id, message.session_id);
      }

      if (message.command === "NEXT_FILE") {
        clearSimulation();
      }

      if (message.command === "STOP_ALL") {
        console.log("🛑 Zatrzymywanie symulacji i czyszczenie sesji...");
        clearSimulation();
        if (currentSessionId) {
          activeSessions.delete(currentSessionId);
        }
      }
    } catch (e) {
      console.error("Błąd parsowania JSON:", e);
    }
  });

  ws.on("close", () => {
    console.log("🔌 WS: Frontend rozłączony");
    clearSimulation();
  });

  const startRaceSimulation = (
    socket: WebSocket,
    fileId: string,
    sessionId: string,
  ) => {
    let aesProgress = 0;
    let rsaProgress = 0;

    aesInterval = setInterval(() => {
      aesProgress += Math.random() * 16 + 15;

      if (aesProgress >= 100) {
        aesProgress = 100;
        if (aesInterval) clearInterval(aesInterval);

        const finishMsg: WsResponse = {
          type: "process_finished",
          algorithm: "AES",
          file_id: fileId,
          total_time: 0.85,
          download_url: "http://localhost:8000/fake_download_aes.enc",
        };
        socket.send(JSON.stringify(finishMsg));
      } else {
        const metricMsg: WsResponse = {
          type: "metric_update",
          algorithm: "AES",
          file_id: fileId,
          data: {
            progress: parseFloat(aesProgress.toFixed(1)),
            cpu_usage: parseFloat((Math.random() * 10 + 5).toFixed(1)),
            throughput: parseFloat((Math.random() * 50 + 450).toFixed(1)),
            processed_bytes: Math.floor(aesProgress * 1024 * 1024),
          },
        };
        socket.send(JSON.stringify(metricMsg));
      }
    }, 100);

    rsaInterval = setInterval(() => {
      rsaProgress += Math.random() * 3 + 10;

      if (rsaProgress >= 100) {
        rsaProgress = 100;
        if (rsaInterval) clearInterval(rsaInterval);

        const finishMsg: WsResponse = {
          type: "process_finished",
          algorithm: "RSA",
          file_id: fileId,
          total_time: 8.45,
          download_url: "http://localhost:8000/fake_download_rsa.enc",
        };
        socket.send(JSON.stringify(finishMsg));

        const session = activeSessions.get(sessionId);

        if (session && session.processedCount >= session.totalFiles) {
          console.log(
            "🏁 Wszystkie pliki przetworzone. Wysyłam batch_complete.",
          );

          const totalTime = (Date.now() - session.startTime) / 1000;

          const batchMsg: WsResponse = {
            type: "batch_complete",
            summary: {
              total_time: parseFloat(totalTime.toFixed(2)),
              total_files: session.totalFiles,
              average_throughput: 145.5,
            },
          };

          setTimeout(() => {
            if (socket.readyState === WebSocket.OPEN) {
              console.log("📤 Wysyłam batch_complete:", batchMsg);
              socket.send(JSON.stringify(batchMsg));
            }

            activeSessions.delete(sessionId);
          }, 500);
        }
      } else {
        const metricMsg: WsResponse = {
          type: "metric_update",
          algorithm: "RSA",
          file_id: fileId,
          data: {
            progress: parseFloat(rsaProgress.toFixed(2)),
            cpu_usage: parseFloat((Math.random() * 15 + 80).toFixed(1)),
            throughput: parseFloat((Math.random() * 0.5 + 1.5).toFixed(2)),
            processed_bytes: Math.floor(rsaProgress * 1024),
          },
        };
        socket.send(JSON.stringify(metricMsg));
      }
    }, 200);
  };
});

server.listen(port, () => {
  console.log(`🚀 TS Mock Server działa na http://localhost:${port}`);
  console.log(`📡 WebSocket dostępny na ws://localhost:${port}/ws`);
});
