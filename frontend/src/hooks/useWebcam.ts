import { useCallback, useEffect, useRef, useState } from "react";

interface UseWebcamOptions {
  video: MediaTrackConstraints;
  audio?: boolean;
}

const DEFAULT_OPTIONS: UseWebcamOptions = {
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 30 },
  },
  audio: false,
};

const useWebcam = (options: UseWebcamOptions = DEFAULT_OPTIONS) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia(options);

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
  }, [options, videoRef]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
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
