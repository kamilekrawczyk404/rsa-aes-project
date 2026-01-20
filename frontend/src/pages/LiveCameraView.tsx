import React, { useEffect, useRef, useState } from "react";
import Section from "../components/Section.tsx";
import ComponentContainer from "../layouts/ComponentContainer.tsx";
import { AlertCircle, LoaderCircle, Video } from "lucide-react";
import useWebcam from "../hooks/useWebcam.ts";
import Banner from "../components/banners/Banner.tsx";
import { useCrypto } from "../context/CryptoContext.tsx";
import type { AesModeDetails } from "../types/modes.tsx";
import type { AesKeySize, AesMode } from "../types/crypto.ts";

interface CameraAlgorithmConfig {
  algo: "AES";
  mode: AesMode;
  key_size: AesKeySize;
}

const LiveCameraView = () => {
  const { isActive, error, videoRef, startCamera, stopCamera } = useWebcam();

  const { isConnected, lastMessage, sendJsonMessage, sendBytes } = useCrypto();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [latency, setLatency] = useState<number | null>(null);
  const lastPingRef = useRef<number>(0);

  const [config, setConfig] = useState<>({
    algo: "AES",
    mode: "CBC" as AesMode,
    key_size: 128 as AesKeySize,
  });

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Draw received image to canvas
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.data instanceof Blob) {
      const blob = lastMessage.data;
      const now = performance.now();

      if (lastPingRef.current > 0) {
        setLatency(Math.round(now - lastPingRef.current));
      }

      createImageBitmap(blob).then((bitmap) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }
      });
    }
  }, [lastMessage]);

  useEffect(() => {
    let intervalId: number;

    if (isStreaming && isActive) {
      const sessionId = "sess_";
    }
  });

  // useEffect(() => {
  //   if (cameraStream && originalVideoRef.current) {
  //     originalVideoRef.current.srcObject = cameraStream;
  //   }
  // }, [cameraStream, originalVideoRef]);

  return (
    <Section
      title={"Szyfrowanie obrazu z kamery na żywo"}
      description={
        "Zobacz podgląd pracy algorytmu symetrycznego w czasie rzeczywistym"
      }
    >
      <div className={"grid grid-cols-2 gap-4"}>
        <ComponentContainer
          title={"Obraz z kamery (oryginał)"}
          description={"Ten obraz pochodzi bezpośrednio z kamery."}
          icon={<Video size={"1rem"} />}
        >
          <div
            className={`h-[300px] w-full place-content-center ${
              !isActive || error ? "p-4" : ""
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${
                !isActive ? "hidden" : ""
              }`}
            />

            {!isActive && !error && (
              <Banner.Info
                title={"Oczekiwanie na obraz z kamery"}
                description={
                  "Zaakceptuj prośbę o dostęp do kamery, aby móc zobaczyć efekt pracy algorytmu."
                }
              />
            )}

            {error && (
              <Banner.Error
                title={"Błąd kamery"}
                description={"Nie można uzyskać dostępu do kamery."}
              />
            )}
          </div>
        </ComponentContainer>
        <ComponentContainer
          title={"Obraz z kamery (szyfrowany)"}
          description={
            "Ten obraz jest szyfrowany w czasie rzeczywistym za pomocą algorytmu AES"
          }
          icon={<Video size={"1rem"} />}
        >
          <div></div>
        </ComponentContainer>
      </div>
    </Section>
  );
};

export default LiveCameraView;
