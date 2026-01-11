import { React, useEffect, useRef, useState } from "react";
import Section from "../components/Section.tsx";
import { useCrypto } from "../context/CryptoContext.tsx";
import {
  CheckCircle2,
  Clock,
  FastForward,
  ListIcon,
  Loader2,
  SkipForward,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatBytes } from "../utils/formatters.ts";
import Header from "../components/dashboard/Header.tsx";
import ThroughtputChart from "../components/charts/ThroughputChart.tsx";
import CpuUsageChart from "../components/charts/CpuUsageChart.tsx";
import type { FileRaceState } from "../types/crypto.ts";
import SummaryTable from "../components/dashboard/SummaryTable.tsx";
import Banner from "../components/banners/Banner.tsx";
import { usePopups } from "../context/PopUpContext.tsx";
import { useAutoSwitch } from "../hooks/useAutoSwitch.tsx";

const Dashboard = () => {
  const {
    skipToNextFile,
    isFileProcessed,
    isConnected,
    isRunning,
    queueProgress,
    isSessionInitialized,
    fileQueue,
    currentFile,
    currentFileIndex,
    startProcessing,
  } = useCrypto();

  const { addNewPopup, closePopup } = usePopups();

  const { triggerAutoSwitch, closeAutoSwitch } = useAutoSwitch();

  const skipProcessPopupId = useRef("");

  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!isFileProcessed) {
      setHasTriggered(false);
    }
  }, [isFileProcessed]);

  useEffect(() => {
    const hasMoreFiles = fileQueue && currentFileIndex < fileQueue.length - 1;

    if (isFileProcessed && hasMoreFiles && !hasTriggered) {
      triggerAutoSwitch({
        popup: {
          type: "success",
          title: "Przetwarzanie zakończone",
          description: "Przejście do następnego pliku...",
          fadeOut: false,
        },
        seconds: 7,
        onNext: () => {
          skipToNextFile();
          closeAutoSwitch();
        },
        onCancel: () => {
          console.log("Anulowano automatyczne przejście");
          closeAutoSwitch();
        },
      });

      setHasTriggered(true);
    }
  }, [
    isFileProcessed,
    fileQueue,
    currentFileIndex,
    hasTriggered,
    triggerAutoSwitch,
    skipToNextFile,
  ]);

  console.log(fileQueue);

  useEffect(() => {
    if (fileQueue.length > 0 && !isConnected && !isRunning) {
      startProcessing();
    }
  }, [fileQueue, isRunning, isConnected]);

  useEffect(() => {
    if (
      skipProcessPopupId.current === "" &&
      currentFile &&
      !currentFile.rsa.finished &&
      currentFile.aes.finished
    ) {
      skipProcessPopupId.current = addNewPopup({
        title: "AES zakończył swoją pracę",
        description:
          "RSA nadal pracuje ze względu na wysoką złożoność obliczeniową. Możesz pominąć resztę procesu RSA.",
      });
    }

    if (
      isFileProcessed ||
      (skipProcessPopupId.current !== "" &&
        ((currentFile &&
          currentFile.rsa.finished &&
          currentFile.aes.finished) ||
          !isRunning))
    ) {
      closePopup(skipProcessPopupId.current);
    }
  }, [currentFile, skipProcessPopupId, isFileProcessed]);

  if (!isSessionInitialized)
    return (
      <Section title={"Panel główny"}>
        <Banner.Info
          title={"Brak aktywnej sesji symulacyjnej"}
          description={
            "Dashboard jest obecnie nieaktywny, ponieważ nie zdefiniowano parametrów wyścigu. Przejdź do Konfiguratora, aby wgrać pliki i rozpocząć analizę porównawczą algorytmów AES i RSA."
          }
        />
      </Section>
    );

  return (
    <Section
      title="Panel główny"
      description="Monitoruj wydajność algorytmów AES i RSA w czasie rzeczywistym. Śledź zużycie CPU, przepustowość oraz postęp przetwarzania plików."
    >
      <div className={`flex flex-col gap-4`}>
        <Header />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/*LEFT SECTION (CHARTS, SUMMARY TABLE)*/}
          <div className="lg:col-span-2 space-y-4">
            <SummaryTable />
            <ThroughtputChart />
            <CpuUsageChart />
          </div>

          {/*FILES QUEUE*/}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <h3 className="flex items-center gap-2">
                  <ListIcon size={"1rem"} /> Kolejka przetwarzanych plików (
                  {queueProgress.current} z {queueProgress.total})
                </h3>
              </div>

              <div className="p-2 space-y-2 overflow-y-auto max-h-[600px] flex-1">
                {fileQueue.map((file, index) => {
                  return (
                    <ProcessedFile
                      key={file.fileId}
                      file={file}
                      isCurrent={index === currentFileIndex}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

const ProcessedFile = ({
  file,
  isCurrent,
}: {
  file: FileRaceState;
  isCurrent: boolean;
}) => {
  const { skipToNextFile, currentFile, currentFileIndex, fileQueue } =
    useCrypto();

  // Warunek: Czy można przejść dalej (dla aktywnego pliku, który się zakończył)
  const canSkipToNextFile =
    file.fileId === currentFile?.fileId &&
    currentFileIndex < fileQueue.length - 1 &&
    currentFile?.aes.finished &&
    currentFile?.rsa.finished;

  // Warunek pomocniczy: Czy plik został pominięty
  const isSkipped = file.status === "skipped";

  return (
    <div
      className={`relative p-2 rounded-lg border-[1px] flex items-center gap-2 transition-all ${
        isSkipped
          ? "bg-amber-50 border-amber-200"
          : canSkipToNextFile
            ? "bg-emerald-50 border-emerald-200 shadow-sm"
            : isCurrent
              ? "bg-blue-50 border-blue-200 shadow-sm"
              : "bg-white border-transparent hover:bg-slate-50"
      }`}
    >
      <div className="shrink-0">
        {isSkipped && <FastForward size={"1rem"} className="text-amber-500" />}

        {file.status === "completed" && (
          <CheckCircle2 size={"1rem"} className="text-emerald-500" />
        )}
        {file.status === "processing" && (
          <Loader2 size={"1rem"} className="text-blue-700 animate-spin" />
        )}
        {file.status === "pending" && (
          <Clock size={"1rem"} className="text-slate-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate ${
            isSkipped
              ? "text-amber-700"
              : canSkipToNextFile
                ? "text-emerald-700"
                : isCurrent
                  ? "text-blue-700"
                  : "text-slate-700"
          }`}
        >
          {file.fileName}
        </p>
        <p className="text-xs text-slate-500">{formatBytes(file.fileSize)}</p>
      </div>

      {file.fileId === currentFile?.fileId &&
        canSkipToNextFile &&
        !isSkipped && (
          <button
            onClick={skipToNextFile}
            className="rounded inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 transition-colors"
          >
            <SkipForward size={"1rem"} />
            <span className={"text-sm font-medium"}>Następny plik</span>
          </button>
        )}

      {isCurrent && !canSkipToNextFile && !isSkipped && (
        <motion.div
          animate={{
            boxShadow: [
              "0 0 4px oklch(48.8% 0.243 264.376)",
              "0 0 8px oklch(54.6% 0.245 262.881)",
            ],
            opacity: ["100%", "50%"],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "mirror",
          }}
          className="absolute right-3 w-2 h-2 bg-blue-500 rounded-full"
        />
      )}
    </div>
  );
};

export default Dashboard;
