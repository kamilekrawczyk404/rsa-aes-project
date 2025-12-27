import React, { useEffect } from "react";
import Section from "../components/Section.tsx";
import { useCrypto } from "../context/CryptoContext.tsx";
import Banner from "../components/Banner.tsx";
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Download,
  ListIcon,
  Loader2,
  SkipForward,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatBytes, formatSpeed } from "../utils/formatters.ts";
import Header from "../components/dashboard/Header.tsx";
import ThroughtputChart from "../components/charts/ThroughputChart.tsx";
import CpuUsageChart from "../components/charts/CpuUsageChart.tsx";
import type { UploadedFile } from "../types/crypto.ts";
import SummaryTable from "../components/dashboard/SummaryTable.tsx";

const Dashboard = () => {
  const {
    skipToNextFile,
    isConnected,
    isRunning,
    queueProgress,
    isSessionInitialized,
    fileQueue,
    currentFile,
    startProcessing,
  } = useCrypto();

  useEffect(() => {
    if (fileQueue.length > 0 && !isConnected && !isRunning) {
      startProcessing();
    }
  }, [fileQueue, isRunning, isConnected]);

  const getFileStatus = (index: number): string => {
    const activeIndex = queueProgress.current - 1;

    if (index < activeIndex) return "completed";

    if (index === activeIndex) return isRunning ? "processing" : "pending";

    return "pending";
  };

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
          <div className="lg:col-span-2 space-y-4">
            <SummaryTable />

            {/* WYŚCIG: AES (ZAJĄC) */}
            {currentFile && (
              <AlgorithmRow
                label="AES-256 (GCM)"
                stats={currentFile.aes}
                colorClass="bg-blue-500"
                icon={<Activity size={24} className="text-blue-600" />}
              />
            )}

            {/* WYŚCIG: RSA (ŻÓŁW) */}
            {currentFile && (
              <div className="relative">
                <AlgorithmRow
                  label="RSA-2048 (OAEP)"
                  stats={currentFile.rsa}
                  colorClass="bg-amber-500"
                  icon={<Database size={24} className="text-amber-600" />}
                />

                {/* Przycisk awaryjny dla RSA */}
                {!currentFile.rsa.finished && currentFile.aes.finished && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -right-2 -top-3"
                  >
                    <button
                      onClick={skipToNextFile}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full text-xs font-bold shadow-xl hover:bg-slate-700 hover:scale-105 transition-all border-2 border-white ring-2 ring-slate-200"
                    >
                      <SkipForward size={14} /> Pomiń RSA (Zbyt wolne)
                    </button>
                  </motion.div>
                )}
              </div>
            )}
            <ThroughtputChart />

            <CpuUsageChart />
          </div>

          {/* --- PRAWA KOLUMNA: KOLEJKA PLIKÓW --- */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <h3 className="flex items-center gap-2">
                  <ListIcon size={"1rem"} /> Kolejka przetwarzanych plików
                </h3>
              </div>

              <div className="p-2 space-y-2 overflow-y-auto max-h-[600px] flex-1">
                {fileQueue.map((file, idx) => {
                  const status = getFileStatus(idx);
                  const isCurrent = status === "processing";

                  return (
                    <ProcessedFile
                      key={file.id}
                      file={file}
                      isCurrent={isCurrent}
                      status={status}
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
  status,
}: {
  file: UploadedFile;
  isCurrent: boolean;
  status: string;
}) => {
  return (
    <div
      className={`relative p-2 rounded-lg border-[1px] flex items-center gap-2 transition-all ${
        isCurrent
          ? "bg-blue-50 border-blue-200 shadow-sm"
          : "bg-white border-transparent hover:bg-slate-50"
      } ${status === "completed" ? "opacity-60" : ""}`}
    >
      <div className="shrink-0">
        {status === "completed" && (
          <CheckCircle2 size={"1rem"} className="text-emerald-500" />
        )}
        {status === "processing" && (
          <Loader2 size={"1rem"} className="text-blue-700 animate-spin" />
        )}
        {status === "pending" && (
          <Clock size={"1rem"} className="text-slate-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isCurrent ? "text-blue-700" : ""}`}>
          {file.name}
        </p>
        <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
      </div>

      {isCurrent && (
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
          className="absolute right-2 w-2 h-2 bg-blue-500 rounded-full"
        />
      )}
    </div>
  );
};

const AlgorithmRow = ({
  label,
  stats,
  colorClass,
  icon,
}: {
  label: string;
  stats: {
    progress: number;
    cpu: number;
    throughput: number;
    finished: boolean;
    downloadUrl?: string;
    time?: number;
  };
  colorClass: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
      <motion.div
        className={`absolute left-0 top-0 bottom-0 ${colorClass} opacity-5 z-0`}
        initial={{ width: 0 }}
        animate={{ width: `${stats.progress}%` }}
        transition={{ ease: "linear", duration: 0.2 }}
      />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-3 flex items-center gap-3">
          <div
            className={`p-3 rounded-lg ${colorClass} bg-opacity-10 text-slate-700`}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">{label}</h3>
            {stats.finished ? (
              <span className="text-xs font-mono text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> Zakończono w {stats.time}s
              </span>
            ) : (
              <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Przetwarzanie...
              </span>
            )}
          </div>
        </div>

        {/* 2. Metryki (CPU / Speed) */}
        <div className="md:col-span-5 grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Cpu size={12} /> CPU Usage
            </span>
            <span className="font-mono text-lg font-medium">
              {stats.cpu.toFixed(1)}%
            </span>
            {/* Mini pasek CPU */}
            <div className="h-1 w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
              <motion.div
                className="h-full bg-slate-400"
                animate={{ width: `${stats.cpu}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Activity size={12} /> Speed
            </span>
            <span className="font-mono text-lg font-medium">
              {formatSpeed(stats.throughput)}
            </span>
          </div>
        </div>

        {/* 3. Akcje (Pobierz / Postęp) */}
        <div className="md:col-span-4 flex justify-end items-center gap-3">
          {stats.finished && stats.downloadUrl ? (
            <a
              href={`http://localhost:8000${stats.downloadUrl}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download size={16} /> Pobierz Wynik
            </a>
          ) : (
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-700">
                {stats.progress.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
