import { useCrypto } from "../../context/CryptoContext.tsx";
import {
  Cpu,
  Download,
  FileDown,
  Gauge,
  KeyRound,
  Settings,
  SkipForward,
  TextSearch,
  Timer,
} from "lucide-react";
import type { Algorithm, FileRaceState } from "../../types/crypto.ts";
import { useSimulationData } from "../../context/SimulationDataContext.tsx";
import { type AverageData } from "../../hooks/prepareSimulationData.ts";
import { motion } from "framer-motion";
import { defaultTransition } from "../../framer/transitions.ts";
import ComponentContainer from "../../layouts/ComponentContainer.tsx";
import { formatBytes } from "../../utils/formatters.ts";

const algorithms = ["AES", "RSA"] as Algorithm[];

const tableRows = [
  {
    title: "Postęp",
    type: "progress",
  },
  {
    title: "Zaszyfrowany plik",
    type: "file",
    icon: <FileDown size={"1rem"} />,
  },
  {
    title: "Wielkość klucza",
    type: "keySize",
    icon: <KeyRound size={"1rem"} />,
  },
  {
    title: "Tryb",
    type: "config",
    icon: <Settings size={"1rem"} />,
  },
  {
    title: "Średnia przepustowość",
    type: "averageThroughput",
    icon: <Gauge size={"1rem"} />,
  },
  {
    title: "Średnie zużycie CPU",
    type: "averageCpuUsage",
    icon: <Cpu size={"1rem"} />,
  },
  {
    title: "Całkowity czas (s)",
    type: "totalTime",
    icon: <Timer size={"1rem"} />,
  },
];

const SummaryTable = () => {
  const { currentFileData } = useSimulationData();
  const { currentFile, config, skipRsa, isRunning } = useCrypto();

  return (
    <ComponentContainer
      className={"!p-0 overflow-x-auto"}
      title={"Podsumowanie wyników przetwarzania pliku"}
      description={
        "Przegląd wydajności algorytmów kryptograficznych zastosowanych do bieżącego pliku."
      }
      icon={<TextSearch size={"1rem"} />}
    >
      <section className={"border-b-[1px] border-slate-200 !w-full"}>
        {/*table header*/}
        <div
          className={
            "text-sm font-semibold grid grid-cols-[12rem_1fr_1fr] bg-blue-50"
          }
        >
          <div className={"relative py-2 px-4 flex gap-2 items-center"}>
            Algorytm
          </div>
          {algorithms.map((alg) => (
            <div
              key={alg}
              className={
                "relative px-4 py-2 flex gap-2 items-center border-l-[1px] border-slate-200"
              }
            >
              {alg}
              {isRunning &&
                alg === "RSA" &&
                currentFile &&
                !currentFile.rsa.finished &&
                currentFile.aes.finished && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className=""
                  >
                    <button
                      onClick={skipRsa}
                      className="flex items-center gap-1 px-2 h-6 bg-slate-800 text-white rounded-md text-xs font-semibold hover:bg-slate-700 transition-all border border-white"
                    >
                      <SkipForward size={14} />
                      Pomiń RSA
                    </button>
                  </motion.div>
                )}
            </div>
          ))}
        </div>
      </section>

      <section>
        {tableRows.map((row) => (
          <div
            className={
              "grid grid-cols-[12rem_1fr_1fr] text-sm hover:bg-slate-50 transition-colors [&:not(:last-of-type)]:border-b-[1px] border-slate-200"
            }
            key={row.type}
          >
            <div className={"text-sm"}>
              <span className={"inline-flex items-center gap-2 px-4 py-2"}>
                {row.icon && row.icon}
                {row.title}
              </span>
            </div>
            {algorithms.map((alg) =>
              renderTableRow(alg, row.type, {
                config,
                file: currentFile!,
                average: currentFileData.average,
              }),
            )}
          </div>
        ))}
      </section>
    </ComponentContainer>
  );
};

const renderTableRow = (
  algorithm: Algorithm,
  type: string,
  data: { file: FileRaceState; config: any; average: AverageData },
) => {
  const { isRunning } = useCrypto();

  const alg = algorithm.toLowerCase();

  let element;

  switch (type) {
    case "progress":
      let backgroundColor = "bg-blue-300";
      let width = 0;

      if (
        (alg === "aes" && data.file?.aes?.finished) ||
        (alg === "rsa" && data.file?.rsa?.finished)
      ) {
        backgroundColor = "bg-emerald-500/75";
      }

      if (alg === "rsa" && data.file?.rsa?.status === "skipped") {
        backgroundColor = "bg-amber-500/75";
      }

      if (alg === "aes" && data.file?.aes?.progress) {
        width = data.file.aes.progress;
      } else if (alg === "rsa" && data.file?.rsa?.progress) {
        width = data.file.rsa.progress;
      }

      element = (
        <div className={"relative flex gap-1 items-center"}>
          <div
            className={"absolute inset-0  overflow-hidden w-full bg-blue-50/50"}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: width + "%" }}
              transition={defaultTransition()}
              className={`absolute left-0 top-0 h-full transition-colors ${backgroundColor}`}
            ></motion.div>
          </div>
          <span className={"inline-block z-10 w-10 px-4 py-2"}>
            {width.toFixed()}%
          </span>
        </div>
      );
      break;

    case "file":
      let downloadUrl = "";
      if (alg === "aes" && data.file?.aes?.downloadUrl) {
        downloadUrl = data.file.aes.downloadUrl;
      } else if (alg === "rsa" && data.file?.rsa?.downloadUrl) {
        downloadUrl = data.file.rsa.downloadUrl;
      }

      element = (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={"relative"}
        >
          {downloadUrl !== "" ? (
            <a
              href={downloadUrl}
              download
              className={`inline-flex max-w-full items-center gap-1 px-2 h-6 text-white rounded-md text-xs font-semibold bg-blue-700 hover:bg-blue-800 transition-all border border-white`}
            >
              <Download size={14} />
              Pobierz
            </a>
          ) : (
            <button
              disabled
              className={`inline-flex max-w-full items-center gap-1 px-2 h-6 text-white rounded-md text-xs font-semibold bg-blue-700  transition-all border border-white opacity-50`}
            >
              <Download size={14} />
              Pobierz
            </button>
          )}
        </motion.div>
      );
      break;
    case "keySize":
      element = <span>{data.config[alg].key_size} bity</span>;
      break;

    case "config":
      element = (
        <span>{data.config[alg]?.mode ? data.config[alg].mode : "Brak"}</span>
      );
      break;

    case "averageThroughput":
      let throughput: number;

      if (algorithm === "AES") {
        throughput = data.average.aes.throughput;
      } else {
        throughput = data.average.rsa.throughput;
      }

      element = <span>{formatBytes(throughput)}</span>;
      break;

    case "averageCpuUsage":
      let cpuUsage: number;

      if (algorithm === "AES") {
        cpuUsage = data.average.aes.cpuUsage;
      } else {
        cpuUsage = data.average.rsa.cpuUsage;
      }

      element = <span>{cpuUsage.toFixed(2)} %</span>;
      break;

    case "totalTime":
      let value;

      if (algorithm === "AES") {
        value =
          data.file?.aes?.finished && data.file?.aes?.time
            ? data.file.aes.time + " s"
            : "Proces nadal trwa...";
      } else {
        value =
          data.file?.rsa?.finished && data.file?.rsa?.time
            ? data.file.rsa.time + " s"
            : isRunning
              ? "Proces nadal trwa..."
              : "N/A";
      }

      element = <span>{value}</span>;
      break;
  }

  return (
    <div
      key={`${type}.${alg}`}
      className={`border-l-[1px] border-slate-200 ${
        type === "progress" ? "" : "px-4 py-2"
      }`}
    >
      {element}
    </div>
  );
};

export default SummaryTable;
