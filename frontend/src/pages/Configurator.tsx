import { useEffect, useState } from "react";
import Section from "../components/Section.tsx";
import { type Algorithm, type CryptoConfig } from "../types/crypto.ts";
import AlgorithmCard from "../components/algorithms/AlgorithmCard.tsx";
import FilesUpload from "../components/files/FilesUpload.tsx";
import ProcessButton from "../components/button/ProcessButton.tsx";
import { useCryptoProcess } from "../hooks/useCryptoProcess.ts";
import { useNavigate } from "react-router-dom";
import { menuItems } from "../App.tsx";

const Configurator = () => {
  const navigate = useNavigate();

  const [canStart, setCanStart] = useState<boolean>(false);

  const [config, setConfig] = useState<CryptoConfig>({
    aes: { keySize: 256 },
    rsa: { keySize: 2048 },
    files: [],
  });

  const { startTest } = useCryptoProcess();

  const handleChangeAlgorithmKeySize = (
    algorithm: Algorithm,
    newKeySize: number,
  ) => {
    setConfig((prev) => ({
      ...prev,
      [algorithm.toLowerCase()]: { keySize: newKeySize },
    }));
  };

  useEffect(() => {
    setCanStart(
      config.files.length > 0 && config.files.every((f) => f.progress === 100),
    );
  }, [config.files]);

  return (
    <Section
      title={"Konfigurator algorytmów szyfrujących"}
      description={
        "Dostosuj parametry testu kryptograficznego do swoich potrzeb. W tej sekcji zdefiniujesz siłę kluczy (w bitach) dla algorytmów AES i RSA oraz załadujesz pliki, na których przeprowadzona zostanie analiza wydajności w czasie rzeczywistym."
      }
    >
      <div className={"flex lg:flex-row flex-col gap-4 justify-between"}>
        {Object.entries(config).map(([key, params]) => {
          if (key !== "files")
            return (
              <AlgorithmCard
                key={key}
                algorithm={key.toUpperCase() as Algorithm}
                selectedValue={params.keySize}
                onChange={(newSize) =>
                  handleChangeAlgorithmKeySize(
                    key.toUpperCase() as Algorithm,
                    newSize,
                  )
                }
              />
            );
        })}
      </div>

      <FilesUpload
        onFilesChange={(files) => setConfig((prev) => ({ ...prev, files }))}
      />

      <ProcessButton
        className={"lg:self-start mt-auto"}
        disabled={!canStart}
        onClick={async () => {
          await startTest(config);
          navigate(menuItems.dashboard.link);
        }}
      >
        Rozpocznij symulację
      </ProcessButton>
    </Section>
  );
};

export default Configurator;
