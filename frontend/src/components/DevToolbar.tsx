import { useNavigate } from "react-router-dom";
import { useCrypto } from "../context/CryptoContext";
import { menuItems } from "../App";
import { BugPlay, Loader2 } from "lucide-react";
import { useFileUpload } from "../hooks/useFileUpload.ts";

const MOCK_SCENARIOS = [
  { name: "debug_image_hd.jpg", size: 5242880 },
  // { name: "debug_document.pdf", size: 102400 },
  // { name: "debug_movie_4k.mp4", size: 154857600 }
];

const MOCK_CONFIG = {
  aes: { keySize: 256, mode: "GCM" },
  rsa: { keySize: 2048, padding: "OAEP" },
};

const DevToolbar = () => {
  const { initializeSession, isRunning } = useCrypto();
  const navigate = useNavigate();

  const { mutate: uploadFiles, isPending } = useFileUpload();

  const handleQuickStart = () => {
    console.log("🐛 DEV: Generowanie atrap plików...");

    const dummyFiles = MOCK_SCENARIOS.map((mock) => {
      const blob = new Blob(["mock_content_for_dev_testing"], {
        type: "text/plain",
      });
      return new File([blob], mock.name, { type: "text/plain" });
    });

    console.log("🐛 DEV: Wysyłanie do mock-backendu...");

    uploadFiles(dummyFiles, {
      onSuccess: (response) => {
        console.log("✅ DEV: Backend odpowiedział:", response);

        const filesWithFakeSizes = response.files.map((serverFile: any) => {
          const originalMock = MOCK_SCENARIOS.find(
            (m) => m.name === serverFile.name,
          );
          return {
            ...serverFile,
            size: originalMock ? originalMock.size : serverFile.size,
          };
        });

        initializeSession(response.session_id, filesWithFakeSizes, MOCK_CONFIG);

        navigate(menuItems.dashboard.link);
      },
      onError: (error) => {
        console.error("❌ DEV: Błąd uploadu:", error);
        alert(
          "Nie udało się połączyć z backendem (sprawdź czy port 8000 działa)",
        );
      },
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        disabled={isRunning || isPending}
        onClick={handleQuickStart}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg 
          font-mono text-xs font-bold transition-all
          ${
            isRunning || isPending
              ? "bg-slate-600 cursor-not-allowed opacity-70"
              : "bg-purple-600 hover:bg-purple-700 hover:scale-105 text-white"
          }
        `}
      >
        {isPending ? (
          <Loader2 size={"1rem"} className="animate-spin" />
        ) : (
          <BugPlay size={"1rem"} />
        )}
        {isPending ? "DEV: Uploading..." : "DEV: Quick Start"}
      </button>
    </div>
  );
};

export default DevToolbar;
