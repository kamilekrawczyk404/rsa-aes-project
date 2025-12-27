import { Square } from "lucide-react";
import { useCrypto } from "../../context/CryptoContext.tsx";
import { motion } from "framer-motion";
import Button from "../button/Button.tsx";
import Container from "../../layouts/Container.tsx";

const Header = () => {
  const { isConnected, queueProgress, stopAll } = useCrypto();

  return (
    <Container className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <motion.div
          animate={{
            boxShadow: isConnected
              ? [
                  "0 0 4px oklch(59.6% 0.145 163.225)",
                  "0 0 8px oklch(50.8% 0.118 165.612)",
                ]
              : "",
            opacity: isConnected ? ["100%", "50%"] : "100%",
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "mirror",
          }}
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />
        <div>
          <h2>
            {isConnected
              ? `Przetwarzanie pliku ${queueProgress.current} z ${queueProgress.total}`
              : "Oczekiwanie na połączenie..."}
          </h2>
          <p className="text-sm text-slate-500">
            Sesja aktywna • WebSocket Secure
          </p>
        </div>
      </div>

      <Button.Danger onClick={() => stopAll()} disabled={!isConnected}>
        <span className={"inline-flex gap-2 items-center"}>
          <Square size={"1rem"} fill="currentColor" /> Przerwij wszystko
        </span>
      </Button.Danger>
    </Container>
  );
};

export default Header;
