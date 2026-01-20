import { useCallback, useMemo } from "react";
import ModalLayout from "./ModalLayout.tsx";
import { useModal } from "../../context/ModalContext.tsx";
import { useNavigate } from "react-router-dom";
import { menuItems } from "../../App.tsx";
import { useCrypto } from "../../context/CryptoContext.tsx";
import { useSimulationData } from "../../context/SimulationDataContext.tsx";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  FastForward,
  Gauge,
  Hash,
  Timer,
  Trophy,
} from "lucide-react";
import { formatBytes } from "../../utils/formatters.ts";
import ComponentContainer from "../../layouts/ComponentContainer.tsx";
import type { BatchSummary, FileRaceState } from "../../types/crypto.ts";

const TABLE_ROWS = [
  { id: "status", label: "Status", icon: null },
  {
    id: "throughput",
    label: "Średnia przepustowość",
    icon: <Gauge size={"1rem"} />,
  },
  { id: "cpu", label: "Średnie zużycie CPU", icon: <Cpu size={"1rem"} /> },
  { id: "time", label: "Czas całkowity (s)", icon: <Timer size={"1rem"} /> },
];

const getStatusIcon = (status: string) => {
  if (status === "skipped") return <FastForward size={".75rem"} />;
  if (status === "completed") return <CheckCircle2 size={".75rem"} />;
  // Error or pending
  return <AlertCircle size={".75rem"} />;
};

const getStatusText = (status: string) => {
  if (status === "skipped") return "POMINIĘTO";
  if (status === "completed") return "ZAKOŃCZONO";
  return "BŁĄD";
};

const getStatusClass = (status: string) => {
  if (status === "skipped")
    return "bg-amber-50 text-amber-600 border-amber-200";
  if (status === "completed")
    return "bg-emerald-50 text-emerald-600 border-emerald-200";
  return "bg-red-50 text-red-600 border-red-200";
};

interface CryptoSummaryModalProps {
  mockSummary?: any;
  mockQueue?: any[];
}

const CryptoSummaryModal = ({
  mockSummary,
  mockQueue,
}: CryptoSummaryModalProps) => {
  const { simulationData } = useSimulationData();
  const { closeModal } = useModal();
  const navigate = useNavigate();
  const {
    batchSummary: ctxSummary,
    fileQueue: ctxQueue,
    resetRace,
  } = useCrypto();

  const batchSummary: BatchSummary | null = mockSummary || ctxSummary;
  const fileQueue: FileRaceState[] = mockQueue || ctxQueue;

  const winner = useMemo(() => {
    if (!batchSummary) return null;

    return simulationData.every(
      (data) => data.average.aes.throughput > data.average.rsa.throughput,
    )
      ? "AES"
      : "RSA";
  }, [batchSummary, simulationData]);

  const performanceDiff = useMemo(() => {
    if (!batchSummary) return null;

    const aesThroughput =
      simulationData.reduce((acc, data) => {
        return (acc += data.average.aes.throughput);
      }, 0) / simulationData.length;

    const rsaThroughput =
      simulationData.reduce((acc, data) => {
        return (acc += data.average.rsa.throughput);
      }, 0) / simulationData.length;

    if (winner === "AES") {
      return (((aesThroughput - rsaThroughput) / rsaThroughput) * 100).toFixed(
        2,
      );
    } else {
      return (((rsaThroughput - aesThroughput) / aesThroughput) * 100).toFixed(
        2,
      );
    }
  }, [batchSummary, simulationData]);

  const onProceed = useCallback(() => {
    closeModal();
    resetRace();
    navigate(menuItems.configurator.link);
  }, [closeModal, navigate, resetRace]);

  if (!batchSummary) return null;

  return (
    <ModalLayout>
      <ModalLayout.Header
        title="Podsumowanie sesji kryptograficznej"
        description={
          "Sprawdź, który z algorytmów poradził sobie lepiej z wgranymi przez Ciebie plikami"
        }
      />
      <ModalLayout.Body>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <SimulationSingleResult
            title={"Przetworzone Pliki"}
            value={batchSummary?.total_files.toString() || "0"}
          />
          <SimulationSingleResult
            title={"Czas Całkowity"}
            value={`${batchSummary?.total_time?.toFixed(2) || "0.00"} s`}
          />
          <SimulationSingleResult
            title={"Śr. Przepustowość"}
            value={formatBytes(batchSummary?.average_throughput || 0)}
          />
          <SimulationSingleResult
            title={"Śr. zużycie CPU"}
            value={`${batchSummary?.average_cpu_usage?.toFixed(2) || "0.00"} %`}
          />
        </div>

        <div className="relative bg-gradient-to-b from-blue-600 to-indigo-700 text-white py-8 px-6 text-center overflow-hidden mt-4 rounded-lg">
          <motion.div
            className={
              "absolute left-1/2 top-1/2 w-[300px] h-[300px] bg-yellow-400 rounded-full blur-[40px]"
            }
            initial={{
              scale: 0,
              opacity: 0,
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
              transform: "translate(-50%, -50%)",
            }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ width: 300, height: 300 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-white rounded-full blur-[50px] opacity-10"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mb-4 bg-white/20 p-4 rounded-full backdrop-blur-sm border border-white/30"
            >
              <Trophy size={48} className="text-yellow-300 drop-shadow-lg" />
            </motion.div>

            <h3 className="text-3xl font-extrabold tracking-tight mb-1">
              Zwycięzca: {winner}
            </h3>
            <p className="text-blue-100 font-medium text-sm">
              Szybszy o{" "}
              <span className="text-yellow-300 font-bold">
                {performanceDiff}
              </span>{" "}
              {winner === "AES" ? "niż RSA" : "niż AES"}
            </p>
          </div>
        </div>

        <ComponentContainer
          className={"mt-6 !p-0"}
          title={"Szczegółowe wyniki dla każdego pliku"}
          description={
            "Poniżej znajdziesz szczegółowe wyniki kryptograficzne dla każdego z przesłanych plików."
          }
          icon={<Hash size={"1rem"} />}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-blue-50 text-xs">
                <tr
                  className={
                    "[&>th]:px-4 [&>th]:py-3 [&>th]:border-b [&>th]:border-slate-200"
                  }
                >
                  <th className="w-1/4 min-w-[150px] border-r">Plik</th>
                  <th className="w-1/3 border-r">AES</th>
                  <th className="w-1/3">RSA</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {fileQueue.map((file) => (
                  <FileRow key={file.fileId} file={file} />
                ))}
              </tbody>
            </table>
          </div>
        </ComponentContainer>
      </ModalLayout.Body>
      <ModalLayout.Footer options={{ onProceed }} />
    </ModalLayout>
  );
};

const SimulationSingleResult = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => (
  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
    <span className="block text-slate-500 text-xs uppercase font-semibold">
      {title}
    </span>
    <span className="text-lg font-bold">{value}</span>
  </div>
);

const FileRow = ({ file }: { file: FileRaceState }) => {
  return (
    <>
      <tr>
        <td className="bg-blue-50 px-4 py-2 border-r border-slate-200 font-medium flex flex-col justify-between max-w-72">
          <span className="truncate" title={file.fileName}>
            {file.fileName}
          </span>
          <span className="text-xs text-slate-500 font-normal">
            {formatBytes(file.fileSize)}
          </span>
        </td>
      </tr>

      {TABLE_ROWS.map((row) => (
        <tr
          key={row.id}
          className="hover:bg-slate-50 s transition-colors [&>td]:h-[2.5rem]"
        >
          <td className="px-4 py-2 border-r border-slate-200 flex items-center gap-2 text-xs">
            {row.icon} {row.label}
          </td>

          <td className="px-4 py-2 border-r border-slate-200 text-xs">
            {renderMetric(row.id, file.aes, "aes")}
          </td>

          <td className="px-4 py-2 text-xs">
            {renderMetric(row.id, file.rsa, "rsa", file.rsa.status)}
          </td>
        </tr>
      ))}
    </>
  );
};

const renderMetric = (
  metricId: string,
  data: any,
  alg: "aes" | "rsa",
  globalStatus?: string,
) => {
  if (!data) return "-";

  switch (metricId) {
    // Badge with file status
    case "status": {
      let effectiveStatus = "error";

      // console.log("DANE", alg, globalStatus, data);

      if (alg === "rsa" && globalStatus === "skipped") {
        effectiveStatus = "skipped";
      } else if (data.finished) {
        effectiveStatus = "completed";
      }

      return (
        <span
          className={`inline-flex items-center gap-1 px-2 h-6 rounded-full font-bold border text-xs ${getStatusClass(
            effectiveStatus,
          )}`}
        >
          {getStatusIcon(effectiveStatus)}
          {getStatusText(effectiveStatus)}
        </span>
      );
    }
    case "time":
      return data.time ? `${data.time.toFixed(2)}s` : "-";
    case "throughput":
      return data.throughput ? `${formatBytes(data.throughput)}` : "0.00 MB/s";
    case "cpu":
      return data.cpu ? `${data.cpu.toFixed(1)}%` : "0%";
    default:
      return "-";
  }
};

export default CryptoSummaryModal;
