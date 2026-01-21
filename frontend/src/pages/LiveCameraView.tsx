import { useCallback, useEffect, useMemo, useRef } from "react";
import Section from "../components/Section.tsx";
import ComponentContainer from "../layouts/ComponentContainer.tsx";
import {
  Lock,
  Play,
  ShieldAlert,
  ShieldCheck,
  Square,
  Video,
} from "lucide-react";
import useWebcam from "../hooks/useWebcam.ts";
import Banner from "../components/banners/Banner.tsx";
import { type AesMode } from "../types/crypto.ts";
import {
  useWebcamLogic,
  type WebcamConfig,
} from "../context/WebcamContext.tsx";
import { useWebSocketConnection } from "../context/WebSocketProvider.tsx";
import AlgorithmCard from "../components/algorithms/AlgorithmCard.tsx";
import { AES_MODE_DETAILS } from "../types/modes.tsx";
import Input from "../components/form/Input.tsx";
import Button from "../components/button/Button.tsx";
import Blinker from "../components/dashboard/Blinker.tsx";
import TextSlider from "../components/texts/TextSlider.tsx";

const LiveCameraView = () => {
  const {
    lastFrame,
    isStreaming,
    latency,
    toggleStream,
    config,
    setConfig,
    notifyFrameSent,
  } = useWebcamLogic();

  const {
    isActive: cameraActive,
    error: cameraError,
    videoRef,
    startCamera,
  } = useWebcam({
    video: config.video,
  });

  const { sendBytes, isConnected, getWebSocket } = useWebSocketConnection();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);

  const isWaitingRef = useRef(false);
  const watchdogRef = useRef<number | null>(null);

  const dims = useMemo(() => {
    const w = (config.video.width as ConstrainULongRange)?.ideal || 480;
    const h = (config.video.height as ConstrainULongRange)?.ideal || 360;

    return {
      width: w,
      height: h,
      bufferSize: w * h * 4,
    };
  }, [config.video.width, config.video.height]);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Draw received image to canvas
  useEffect(() => {
    if (lastFrame && canvasRef.current) {
      if (lastFrame) {
        isWaitingRef.current = false;
      }

      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }

      const ctx = canvasRef.current.getContext("2d");

      if (!ctx) {
        return;
      }

      let dataToDraw = lastFrame;

      if (dataToDraw.length !== dims.bufferSize) {
        if (dataToDraw.length > dims.bufferSize) {
          // Truncate the data
          dataToDraw = dataToDraw.subarray(0, dims.bufferSize);
        } else {
          const temp = new Uint8ClampedArray(dims.bufferSize);
          temp.set(dataToDraw);
          dataToDraw = temp;
        }
      }

      const imgData = new ImageData(dataToDraw as any, dims.width, dims.height);

      ctx.putImageData(imgData, 0, 0);
    }
  }, [lastFrame]);

  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      // If no actions are needed, skip this frame
      if (!isStreaming || !cameraActive || !isConnected) return;

      // For better performance, use the raw WebSocket
      const socket = getWebSocket();

      // Check if we are waiting for the previous frame to be acknowledged
      const isLogicallyBlocked = isWaitingRef.current;

      // Check if the socket buffer is full
      const isPhysicallyBlocked =
        socket && (socket as WebSocket).bufferedAmount > 0;

      // If so, skip this frame
      if (isLogicallyBlocked || isPhysicallyBlocked) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // Getting current frame of actual video
      if (videoRef.current && processingCanvasRef.current) {
        const ctx = processingCanvasRef.current.getContext("2d");

        if (ctx) {
          // Draw the current video frame to the processing canvas
          ctx.drawImage(videoRef.current, 0, 0, dims.width, dims.height);
          const imageData = ctx.getImageData(0, 0, dims.width, dims.height);

          // Mark as waiting for server response
          isWaitingRef.current = true;

          // Set watchdog to reset the waiting flag in case of lost frame
          if (watchdogRef.current) clearTimeout(watchdogRef.current);

          // Set a watchdog timer to reset the isWaiting flag
          watchdogRef.current = window.setTimeout(() => {
            console.warn("Watchdog: Resetowanie blokady (zgubiona klatka?)");
            isWaitingRef.current = false;
          }, 1000);

          // Notify that a frame is being sent
          if (notifyFrameSent) notifyFrameSent();

          // Send the raw image data to the server
          sendBytes(imageData.data.buffer);
        }
      }

      // Request next frame
      animationFrameId = requestAnimationFrame(loop);
    };

    if (isStreaming) {
      loop();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
  }, [
    isStreaming,
    cameraActive,
    isConnected,
    sendBytes,
    videoRef,
    getWebSocket,
    notifyFrameSent,
  ]);

  const updateConfig = useCallback(
    (field: keyof WebcamConfig, value: any) => {
      const updatedValues: WebcamConfig = {
        ...config,
        [field]: value,
      };

      setConfig(updatedValues);
    },
    [config],
  );

  const updateVideo = useCallback(
    (field: keyof Partial<MediaTrackConstraints>, value: any) => {
      const updateVideoConfig: MediaTrackConstraints = {
        ...config.video,
        [field]: {
          ideal: value,
        },
      };

      setConfig({ ...config, video: updateVideoConfig });
    },
    [config],
  );

  return (
    <Section
      title={"Szyfrowanie obrazu z kamery na żywo"}
      description={
        "Zobacz podgląd pracy algorytmu symetrycznego w czasie rzeczywistym"
      }
    >
      <ComponentContainer
        title={"Panel sterowania"}
        description={"Zarządzaj strumieniem wideo i konfiguracją algorytmu."}
        icon={<Video size={"1rem"} />}
      >
        <div className="flex flex-wrap gap-6 items-stretch p-4">
          <AlgorithmCard
            disabled={isStreaming || !isConnected}
            algorithm={"AES"}
            keySizes={[config.keySize]}
            onKeySizeChange={(newSize) => updateConfig("keySize", newSize)}
            modes={Object.entries(AES_MODE_DETAILS).map(([mode, values]) => ({
              mode: mode as AesMode,
              ...values,
            }))}
            onModeChange={(item) => updateConfig("mode", item.mode)}
            renderSelectorItem={(item, withAnnotation) => (
              <div>
                {withAnnotation ? (
                  <div
                    className={
                      "border-[1px] rounded-md border-slate-100 bg-white font-normal p-2"
                    }
                  >
                    <div className={"flex items-center gap-2 mb-1"}>
                      <div
                        className={
                          "w-8 h-8 rounded-md bg-blue-500/15 flex items-center justify-center"
                        }
                      >
                        {item.icon}
                      </div>
                      <span className={""}>{item.label}</span>
                      <span
                        className={`inline-block ml-auto ${
                          item.isSecure ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {item.isSecure ? <ShieldCheck /> : <ShieldAlert />}
                      </span>
                    </div>
                    <p className={"text-sm text-slate-500"}>
                      {item.description}
                    </p>
                  </div>
                ) : (
                  <span>
                    {item.mode}{" "}
                    <span className={"mr-2 text-slate-500"}>
                      ({item.label})
                    </span>
                  </span>
                )}
              </div>
            )}
          />

          <div className={"flex flex-col flex-1 justify-between gap-3 h-auto"}>
            <div className={"grid sm:grid-cols-2 grid-cols-1 gap-3 w-full"}>
              <Input
                min={5}
                max={640}
                label={"Szerokość okna"}
                type={"number"}
                value={(config.video.width as ConstrainULongRange).ideal}
                onChange={(e) => updateVideo("width", e.target.value)}
                disabled={isStreaming || !isConnected}
              />
              <Input
                min={5}
                max={480}
                label={"Wysokość okna"}
                type={"number"}
                value={(config.video.height as ConstrainULongRange).ideal}
                onChange={(e) => updateVideo("height", e.target.value)}
                disabled={isStreaming || !isConnected}
              />
              <Input
                min={5}
                max={30}
                label={"FPS"}
                type={"number"}
                value={(config.video.frameRate as ConstrainULongRange).ideal}
                onChange={(e) => updateVideo("frameRate", e.target.value)}
                disabled={isStreaming || !isConnected}
              />
            </div>

            <div className="flex justify-between gap-3 sm:flex-row flex-col">
              <div className={"flex items-center gap-3"}>
                <Blinker trigger={isConnected} />
                <div className={"flex flex-col"}>
                  <TextSlider
                    trigger={!isConnected}
                    texts={{
                      hidden: "Trwa nawiązywanie połączenia...",
                      shown: "Połaczenie aktywne",
                    }}
                    className={"text-nowrap"}
                  />
                  <p className="text-sm text-slate-500">
                    Sesja aktywna • WebSocket Secure
                  </p>
                </div>
              </div>

              {!isStreaming ? (
                <Button.Process
                  onClick={toggleStream}
                  disabled={!isConnected || !cameraActive}
                >
                  <Play size={"1rem"} className={"mr-2"} />
                  <span>Rozpocznij Stream</span>
                </Button.Process>
              ) : (
                <Button.Danger onClick={toggleStream}>
                  <Square
                    size={"1rem"}
                    fill="currentColor"
                    className={"mr-2"}
                  />
                  <span>Zatrzymaj</span>
                </Button.Danger>
              )}
            </div>
          </div>
        </div>
      </ComponentContainer>

      <div className={"grid sm:grid-cols-2 grid-cols-1 gap-4"}>
        <ComponentContainer
          title={"Obraz z kamery (oryginał)"}
          description={"Ten obraz pochodzi bezpośrednio z kamery."}
          icon={<Video size={"1rem"} />}
          className={"overflow-hidden"}
        >
          <div
            className={`h-[300px] w-full place-content-center ${
              !cameraActive || cameraError ? "p-4" : ""
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover transform scale-x-[-1] ${
                !cameraActive ? "hidden" : ""
              }`}
              style={{
                imageRendering: "pixelated",
              }}
            />

            {!cameraActive && (
              <Banner.Info
                title={"Oczekiwanie na obraz z kamery"}
                description={
                  "Zaakceptuj prośbę o dostęp do kamery, aby rozpocząć."
                }
              />
            )}

            {cameraError && (
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
          icon={<Lock size={"1rem"} />}
          className={"overflow-hidden"}
        >
          <div
            className={`relative  h-[300px] w-full place-content-center ${
              !isStreaming || !isConnected ? "p-4" : ""
            }`}
          >
            <canvas
              ref={canvasRef}
              width={dims.width}
              height={dims.height}
              className={`object-cover transform scale-x-[-1] w-full h-full ${
                !isStreaming || !isConnected ? "hidden" : ""
              }`}
              style={{
                imageRendering: "pixelated",
              }}
            />
            {isStreaming && (
              <div className="text-xs text-slate-100 absolute left-3 top-3 h-6 flex items-center justify-center bg-slate-800 rounded-full">
                <span className="pl-2 pr-1">Latencja:</span>
                <span className={"inline-block min-w-12"}>{latency}ms</span>
              </div>
            )}
            {!isStreaming &&
              (isConnected ? (
                <Banner.Info
                  title={"Naciśnij start, aby rozpocząć szyfrowanie obrazu"}
                  description={
                    "Możesz również skonfigurować parametry szyfrowanego obrazu"
                  }
                />
              ) : (
                <Banner.Info
                  title={"Oczekiwanie na otrzymanie strumienia..."}
                  description={"Proszę czekać..."}
                />
              ))}
          </div>
        </ComponentContainer>
      </div>

      {/*Hidden canvas*/}
      <canvas
        ref={processingCanvasRef}
        width={dims.width}
        height={dims.height}
        className={"hidden"}
      />
    </Section>
  );
};

export default LiveCameraView;
