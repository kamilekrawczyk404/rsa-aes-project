import { Square } from "lucide-react";
import { useCrypto } from "../../context/CryptoContext.tsx";
import { motion } from "framer-motion";
import Button from "../button/Button.tsx";
import Container from "../../layouts/Container.tsx";
import TextSlider from "../texts/TextSlider.tsx";

const Header = () => {
  const { isConnected, isRunning, queueProgress, stopAll } = useCrypto();

  return (
    <Container className="flex justify-between items-center">
      <div className="flex items-center gap-4 basis-full">
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
        <div className={"w-full"}>
          <TextSlider
            texts={{
              hidden: <h2>Wszystkie pliki zostały przetworzone</h2>,
              shown: (
                <h2>{`Przetwarzanie pliku ${queueProgress.current} z ${queueProgress.total}`}</h2>
              ),
            }}
            trigger={!isRunning}
            className={"text-nowrap w-full"}
          />
          <p className="text-sm text-slate-500">
            Sesja aktywna • WebSocket Secure
          </p>
        </div>
      </div>

      <Button.Danger onClick={() => stopAll()} disabled={!isConnected}>
        <span className={"inline-flex gap-2 items-center text-nowrap"}>
          <Square size={"1rem"} fill="currentColor" /> Zakończ sesję
        </span>
      </Button.Danger>
    </Container>
  );
};

export default Header;
