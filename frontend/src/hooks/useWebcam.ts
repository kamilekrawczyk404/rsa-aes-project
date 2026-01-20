import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseWebcamOptions {
  video: MediaTrackConstraints;
  audio?: boolean;
}

const DEFAULT_OPTIONS: UseWebcamOptions = {
  video: {
    width: { ideal: 480 },
    height: { ideal: 360 },
    frameRate: { ideal: 10 },
    // @ts-ignore
    advanced: [{ whiteBalanceMode: "continous" }, { exposureMode: "manual" }],
  },
  audio: false,
};

const useWebcam = (options: UseWebcamOptions = DEFAULT_OPTIONS) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);

  const finalOptions = useMemo<UseWebcamOptions>(
    () => ({
      ...DEFAULT_OPTIONS,
      ...options,
      video: { ...DEFAULT_OPTIONS.video, ...options?.video },
    }),
    [options.video.width, options.video.height, options.video.frameRate],
  );

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // Stop previous track when options are changed
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia(finalOptions);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
      }
    } catch (error: any) {
      setIsActive(false);
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setError("Brak dostępu do kamery. Zezwól przeglądarce na dostęp.");
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setError(
          "Nie znaleziono kamery. Upewnij się, że kamera jest podłączona.",
        );
      } else {
        setError("Wystąpił błąd podczas uzyskiwania dostępu do kamery.");
      }
    }
  }, [finalOptions, isActive]);

  useEffect(() => {
    if (!isActive || !streamRef.current) return;

    // Debounce
    const timeoutId = setTimeout(() => {
      startCamera();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [finalOptions.video, isActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isActive,
    error,
    startCamera,
    stopCamera,
  };
};

export default useWebcam;
