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

interface WsResponse {
  type: "metric_update" | "process_finished" | "error" | "batch_complete";
  algorithm?: "AES" | "RSA";
  file_id?: string;
  data?: MetricPayload;
  total_time?: number;
  download_url?: string;
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
}

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get("/api/config", (req: Request, res: Response) => {
  res.json({
    max_file_size_bytes: 10 * 1024 * 1024,
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

    const fakeFiles = files.map((f) => ({
      id: "mock_file_" + Math.random().toString(36).substring(2, 9),
      name: f.originalname,
      size: f.size,
    }));

    res.json({
      session_id: "mock_session_" + Date.now(),
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

      if (message.command === "START_RACE" && message.file_id) {
        clearSimulation();
        startRaceSimulation(ws, message.file_id);
      }

      if (message.command === "NEXT_FILE" || message.command === "STOP_ALL") {
        console.log("🛑 Zatrzymywanie symulacji...");
        clearSimulation();
      }
    } catch (e) {
      console.error("Błąd parsowania JSON:", e);
    }
  });

  ws.on("close", () => {
    console.log("🔌 WS: Frontend rozłączony");
    clearSimulation();
  });

  const startRaceSimulation = (socket: WebSocket, fileId: string) => {
    let aesProgress = 0;
    let rsaProgress = 0;

    aesInterval = setInterval(() => {
      aesProgress += Math.random() * 8 + 2;

      if (aesProgress >= 100) {
        aesProgress = 100;

        if (aesInterval) clearInterval(aesInterval);

        const finishMsg: WsResponse = {
          type: "process_finished",
          algorithm: "AES",
          file_id: fileId,
          total_time: 1.45,
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
            cpu_usage: parseFloat((Math.random() * 10 + 5).toFixed(1)), // 5-15%
            throughput: parseFloat((Math.random() * 50 + 250).toFixed(1)), // 250-300 MB/s
            processed_bytes: Math.floor(aesProgress * 1024 * 1024),
          },
        };

        socket.send(JSON.stringify(metricMsg));
      }
    }, 100);

    rsaInterval = setInterval(() => {
      rsaProgress += 0.05 + Math.random() * 5;

      if (rsaProgress >= 100) {
        rsaProgress = 100;

        if (rsaInterval) clearInterval(rsaInterval);

        const finishMsg: WsResponse = {
          type: "process_finished",
          algorithm: "RSA",
          file_id: fileId,
          total_time: 20.45,
          download_url: "http://localhost:8000/fake_download_rsa.enc",
        };

        socket.send(JSON.stringify(finishMsg));
      } else {
        const metricMsg: WsResponse = {
          type: "metric_update",
          algorithm: "RSA",
          file_id: fileId,
          data: {
            progress: parseFloat(rsaProgress.toFixed(2)),
            cpu_usage: parseFloat((Math.random() * 5 + 95).toFixed(1)),
            throughput: parseFloat((Math.random() * 0.2).toFixed(2)),
            processed_bytes: Math.floor(rsaProgress * 1024),
          },
        };

        socket.send(JSON.stringify(metricMsg));
      }
    }, 100);
  };
});

server.listen(port, () => {
  console.log(`🚀 TS Mock Server działa na http://localhost:${port}`);
  console.log(`📡 WebSocket dostępny na ws://localhost:${port}/ws`);
});
