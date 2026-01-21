import { useCallback, useEffect, useRef, useState } from "react";
import Section from "../components/Section.tsx";
import { useCrypto } from "../context/CryptoContext.tsx";
import {
  ChartPie,
  CheckCircle2,
  Clock,
  FastForward,
  ListIcon,
  Loader2,
  SkipForward,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatBytes } from "../utils/formatters.ts";
import Header from "../components/dashboard/Header.tsx";
import ThroughtputChart from "../components/charts/ThroughputChart.tsx";
import CpuUsageChart from "../components/charts/CpuUsageChart.tsx";
import type { FileRaceState } from "../types/crypto.ts";
import SummaryTable from "../components/dashboard/SummaryTable.tsx";
import Banner from "../components/banners/Banner.tsx";
import { usePopups } from "../context/PopUpContext.tsx";
import { useAutoSwitch } from "../hooks/useAutoSwitch.tsx";
import { useModal } from "../context/ModalContext.tsx";
import TextSlider from "../components/texts/TextSlider.tsx";
import Container from "../layouts/Container.tsx";
import CryptoSummaryModal from "../components/modals/CryptoSummaryModal.tsx";

// Placeholder for storing popup ids that have been loaded for certain files (prevent reopen the same popups when user change tab)
const notifiedFileIds = new Set<string>();

const Dashboard = () => {
  const {
    isFileProcessed,
    isConnected,
    isRunning,
    queueProgress,
    isSessionInitialized,
    fileQueue,
    currentFile,
    currentFileIndex,
    skipToNextFile,
    resetRace,
  } = useCrypto();

  const { addNewPopup, closePopup } = usePopups();

  const { openModal, closeModal } = useModal();

  const { triggerAutoSwitch, closeAutoSwitch } = useAutoSwitch();

  const skipProcessPopupId = useRef("");

  const [summaryShown, setSummaryShown] = useState(false);

  useEffect(() => {
    if (fileQueue.length === 0) {
      notifiedFileIds.clear();
    }
  }, [fileQueue.length]);

  // Close skipping rsa popup if file changed
  useEffect(() => {
    if (skipProcessPopupId.current !== "") {
      closePopup(skipProcessPopupId.current);
      skipProcessPopupId.current = "";
    }
  }, [currentFileIndex]);

  useEffect(() => {
    if (isSessionInitialized) {
      setSummaryShown(false);
    }
  }, [isSessionInitialized]);

  // Auto switch to next file when processing is done
  // If the comparison ended show the summary instead
  useEffect(() => {
    const hasMoreFiles =
      isRunning &&
      currentFile &&
      fileQueue &&
      fileQueue.length > 0 &&
      currentFileIndex < fileQueue.length - 1;

    if (isFileProcessed && hasMoreFiles) {
      // setTimeout(() => {
      if (!notifiedFileIds.has(currentFile.fileId)) {
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
            console.log("Auto skip to next file cancelled");
            closeAutoSwitch();
          },
        });
      }

      if (!notifiedFileIds.has(currentFile.fileId)) {
        notifiedFileIds.add(currentFile.fileId);
      }
      // }, 500);
    }

    const isQueueCompleted =
      fileQueue.length > 0 &&
      (!isRunning || fileQueue.length - 1 === currentFileIndex);

    const areAllFilesCompleted =
      fileQueue.length &&
      fileQueue.every(
        (f) => f.status === "completed" || f.status === "skipped",
      );

    // Check if the process has ended (additionally ensure that every file has completed status in a scenario when server has notified batch_completed)
    if (isQueueCompleted && areAllFilesCompleted && !summaryShown) {
      if (fileQueue.some((f) => f.status === "error")) {
        return;
      }

      openModal(<CryptoSummaryModal />, {
        closeOnBackdropClick: true,
        onClose: resetRace,
      });

      setSummaryShown(true);
    }
  }, [
    currentFile,
    isRunning,
    isFileProcessed,
    fileQueue,
    currentFileIndex,
    triggerAutoSwitch,
    isConnected,
    summaryShown,
    skipToNextFile,
    openModal,
  ]);

  // Message for skipping RSA processing
  useEffect(() => {
    const shouldShowPopup =
      currentFile && !currentFile.rsa.finished && currentFile.aes.finished;

    if (shouldShowPopup) {
      if (!notifiedFileIds.has(currentFile.fileId)) {
        skipProcessPopupId.current = addNewPopup({
          title: "AES zakończył swoją pracę",
          description:
            "RSA nadal pracuje ze względu na wysoką złożoność obliczeniową. Możesz pominąć resztę procesu RSA.",
        });

        notifiedFileIds.add(currentFile.fileId);
      }
    }

    const shouldClosePopup =
      skipProcessPopupId.current !== "" &&
      ((currentFile && currentFile.rsa.finished && currentFile.aes.finished) ||
        !isRunning);

    if (shouldClosePopup && currentFile) {
      closePopup(skipProcessPopupId.current);

      notifiedFileIds.delete(currentFile.fileId);

      skipProcessPopupId.current = "";
    }
  }, [
    currentFile,
    skipProcessPopupId,
    isFileProcessed,
    addNewPopup,
    closePopup,
  ]);

  useEffect(() => {
    return () => closeModal();
  }, [closeModal]);

  return (
    <Section
      title="Panel główny"
      description="Monitoruj wydajność algorytmów AES i RSA w czasie rzeczywistym. Śledź zużycie CPU, przepustowość oraz postęp przetwarzania plików."
    >
      {!isSessionInitialized && (
        <Banner.Info
          title={"Brak aktywnej sesji symulacyjnej"}
          description={
            "Dashboard jest obecnie nieaktywny, ponieważ nie zdefiniowano parametrów wyścigu. Przejdź do Konfiguratora, aby wgrać pliki i rozpocząć analizę porównawczą algorytmów AES i RSA."
          }
        />
      )}

      {isSessionInitialized && (
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
            <div className="lg:col-span-1 h-fit">
              <Container className="h-full flex flex-col !p-0">
                <div className="border-b border-slate-200 bg-slate-50/50 rounded-t-xl p-4">
                  <TextSlider
                    trigger={!isRunning}
                    texts={{
                      shown: (
                        <h3 className="flex items-center gap-2">
                          <ListIcon size={"1rem"} /> Kolejka przetwarzanych
                          plików ({queueProgress.current} z{" "}
                          {queueProgress.total})
                        </h3>
                      ),
                      hidden: (
                        <h3 className="flex items-center gap-2">
                          <ChartPie size={"1rem"} /> Kliknij plik, aby zobaczyć
                          szczegóły
                        </h3>
                      ),
                    }}
                    className={"h-8"}
                  />
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[600px] flex-1 p-4 sm:mt-0 mt-16">
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
              </Container>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
};

// Display individual file in the processing queue
// After the whole processing is done, allow selecting the specified race to see results
const ProcessedFile = ({
  file,
  isCurrent,
}: {
  file: FileRaceState;
  isCurrent: boolean;
}) => {
  const {
    currentFile,
    currentFileIndex,
    fileQueue,
    isRunning,
    skipToNextFile,
    setCurrentlyDisplayedFile,
  } = useCrypto();

  const { closePopup, popups } = usePopups();

  const canShowResults =
    !isRunning && (file.status === "completed" || file.status === "skipped");

  const canSkipToNextFile =
    !canShowResults &&
    file.fileId === currentFile?.fileId &&
    currentFileIndex < fileQueue.length - 1 &&
    currentFile?.aes.finished &&
    currentFile?.rsa.finished;

  const isSkipped = file.status === "skipped";

  const nextFile = useCallback(() => {
    // Remove the last popup (also skipping to the next file) if user clicks on this button
    if (popups.length > 1) {
      closePopup(popups[popups.length - 1].id);
    }

    skipToNextFile();
  }, [skipToNextFile, closePopup, popups]);

  const showFileResults = useCallback(() => {
    if (!canShowResults) return;

    setCurrentlyDisplayedFile(file.fileId);
  }, [canShowResults, file.fileId]);

  return (
    <div
      onClick={showFileResults}
      className={`relative p-2 rounded-lg border-[1px] flex items-center gap-2 transition-all ${
        isSkipped
          ? "bg-amber-50 border-amber-200"
          : file.status === "completed"
            ? "bg-emerald-50 border-emerald-200 shadow-sm"
            : isCurrent
              ? "bg-blue-50 border-blue-200 shadow-sm"
              : "bg-white border-transparent hover:bg-slate-50"
      } ${canShowResults ? "cursor-pointer" : ""} ${
        canShowResults && currentFile?.fileId === file.fileId
          ? isSkipped
            ? "ring-2 ring-amber-500"
            : "ring-2 ring-emerald-500"
          : ""
      }
      `}
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

      <div className="flex-1 min-w-0 mr-6">
        <p
          className={`text-sm truncate ${
            isSkipped
              ? "text-amber-700"
              : file.status === "completed"
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

      <AnimatePresence>
        <>
          {!canShowResults &&
            file.fileId === currentFile?.fileId &&
            canSkipToNextFile &&
            !isSkipped && (
              <motion.button
                key={`${file.fileId}-skip`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={nextFile}
                className="rounded inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 transition-colors"
              >
                <SkipForward size={"1rem"} />
                <span className={"text-sm font-medium"}>Następny plik</span>
              </motion.button>
            )}

          {isRunning && isCurrent && !canSkipToNextFile && (
            <motion.div
              key={`${file.fileId}-pulse`}
              initial={{ opacity: 0 }}
              animate={{
                boxShadow: [
                  "0 0 4px oklch(48.8% 0.243 264.376)",
                  "0 0 8px oklch(54.6% 0.245 262.881)",
                ],
                opacity: ["100%", "50%"],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "mirror",
              }}
              className="absolute right-3 w-2 h-2 bg-blue-500 rounded-full"
            />
          )}
        </>
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
