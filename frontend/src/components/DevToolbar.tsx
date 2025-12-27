import { useNavigate } from "react-router-dom";
import { useCrypto } from "../context/CryptoContext";
import { menuItems } from "../App";
import { BugPlay } from "lucide-react";
import type { UploadedFile } from "../types/crypto.ts";

const MOCK_FILES: UploadedFile[] = [
  { id: "mock_f1", name: "debug_image_hd.jpg", size: 5242880 }, // 5MB
  { id: "mock_f2", name: "debug_document.pdf", size: 102400 }, // 100KB
  { id: "mock_f3", name: "debug_movie_4k.mp4", size: 154857600 }, // 150MB
];

const MOCK_CONFIG = {
  aes: { keySize: 256, mode: "GCM" },
  rsa: { keySize: 2048 },
};

const DevToolbar = () => {
  const { initializeSession, isRunning } = useCrypto();
  const navigate = useNavigate();

  const handleQuickStart = () => {
    console.log("🐛 DEV: Wstrzykiwanie fałszywej sesji...");

    initializeSession("sess_debug_" + Date.now(), MOCK_FILES, MOCK_CONFIG);

    navigate(menuItems.dashboard.link);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        disabled={isRunning}
        onClick={handleQuickStart}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg font-mono text-xs font-bold transition-transform hover:scale-105"
      >
        <BugPlay size={"1rem"} />
        DEV: Quick Start
      </button>
    </div>
  );
};

export default DevToolbar;
