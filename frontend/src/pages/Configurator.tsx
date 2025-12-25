import { useEffect, useState } from "react";
import Section from "../components/Section.tsx";
import {
  type AesMode,
  type Algorithm,
  type FileWithMeta,
} from "../types/crypto.ts";
import AlgorithmCard from "../components/algorithms/AlgorithmCard.tsx";
import FilesUpload from "../components/files/FilesUpload.tsx";
import ProcessButton from "../components/button/ProcessButton.tsx";
import { useCryptoProcess } from "../hooks/useCryptoProcess.ts";
import { useNavigate } from "react-router-dom";
import { menuItems } from "../App.tsx";
import { useFileUpload } from "../hooks/useFileUpload.ts";
import { AES_MODE_DETAILS, type AesDetails } from "../types/modes.tsx";
import { ShieldAlert, ShieldCheck } from "lucide-react";

interface LocalConfig {
  aes: {
    keySize: number;
    mode: AesMode;
  };
  rsa: {
    keySize: number;
  };
  files: FileWithMeta[];
}

const Configurator = () => {
  const navigate = useNavigate();
  const { mutate: uploadFiles, isPending: isUploading } = useFileUpload();
  const { initializeSession } = useCryptoProcess();

  const [canStart, setCanStart] = useState<boolean>(false);

  const [config, setConfig] = useState<LocalConfig>({
    aes: { keySize: 256, mode: "CFB" },
    rsa: { keySize: 2048 },
    files: [],
  });

  const handleAlgorithmKeySizeChange = (
    algorithm: Algorithm,
    newKeySize: number,
  ) => {
    setConfig((prev) => ({
      ...prev,
      [algorithm.toLowerCase()]: {
        ...prev[algorithm.toLowerCase() as "rsa" | "aes"],
        keySize: newKeySize,
      },
    }));
  };

  const handleAesModeChange = (modeDetails: AesDetails & { mode: AesMode }) => {
    setConfig((prev) => ({
      ...prev,
      aes: {
        ...prev.aes,
        mode: modeDetails.mode,
      },
    }));
  };

  const handleStartSimulation = () => {
    if (config.files.length === 0 || config.files.some((f) => f.progress < 100))
      return;

    uploadFiles(
      config.files.map((f) => f.file),
      {
        onSuccess: (response) => {
          console.log("Files uploaded, starting session...", response);
          initializeSession(response.session_id, response.files, {
            aes: config.aes,
            rsa: config.rsa,
          });

          navigate(menuItems.dashboard.link);
        },
        onError: (error) => {
          console.log("Error uploading files:", error);
        },
      },
    );
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
                keySizes={[params.keySize]}
                onKeySizeChange={(newSize) =>
                  handleAlgorithmKeySizeChange(
                    key.toUpperCase() as Algorithm,
                    newSize,
                  )
                }
                modes={
                  key === "aes"
                    ? Object.entries(AES_MODE_DETAILS).map(
                        ([mode, values]) => ({
                          mode: mode as AesMode,
                          ...values,
                        }),
                      )
                    : []
                }
                onModeChange={handleAesModeChange}
                renderSelectorItem={(item, withAnnotation) => (
                  <div className={""}>
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
            );
        })}
      </div>

      <FilesUpload
        onFilesChange={(files) => setConfig((prev) => ({ ...prev, files }))}
      />

      <ProcessButton
        className={"lg:self-start mt-auto"}
        disabled={!canStart}
        onClick={() => handleStartSimulation()}
      >
        {isUploading ? (
          <span className={"flex items-center gap-2"}>
            <span
              className={
                "animate-spin h-4 w-4 border-[1px] border-white border-t-transparent rounded-full"
              }
            />
            Wysyłanie plików...
          </span>
        ) : (
          "Rozpocznij symulację"
        )}
      </ProcessButton>
    </Section>
  );
};

export default Configurator;
