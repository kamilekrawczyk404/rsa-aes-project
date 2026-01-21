import { Square } from "lucide-react";
import { useCrypto } from "../../context/CryptoContext.tsx";
import Button from "../button/Button.tsx";
import Container from "../../layouts/Container.tsx";
import TextSlider from "../texts/TextSlider.tsx";
import Blinker from "./Blinker.tsx";

const Header = () => {
  const { isConnected, isRunning, queueProgress, stopAll } = useCrypto();

  return (
    <Container className="flex sm:flex-row flex-col justify-between items-center">
      <div className="flex items-center gap-4 basis-full">
        <Blinker trigger={isConnected} />
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
