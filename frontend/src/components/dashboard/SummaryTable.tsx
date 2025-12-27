import { useCrypto } from "../../context/CryptoContext.tsx";
import Container from "../../layouts/Container.tsx";
import {
  Cpu,
  Gauge,
  KeyRound,
  Settings,
  TextSearch,
  Timer,
} from "lucide-react";
import type { Algorithm, FileRaceState } from "../../types/crypto.ts";
import { useSimulationDataContext } from "../../context/SimulationDataContext.tsx";
import type { AverageData } from "../../hooks/useSimulationData.ts";

const algorithms = ["AES", "RSA"] as Algorithm[];

const tableRows = [
  {
    title: "Postęp",
    type: "progress",
  },
  {
    title: "Wielkość klucza",
    type: "keySize",
    icon: <KeyRound size={"1rem"} />,
  },
  {
    title: "Inne parametry",
    type: "config",
    icon: <Settings size={"1rem"} />,
  },
  {
    title: "Średnia przepustowość (MB/s)",
    type: "averageThroughput",
    icon: <Gauge size={"1rem"} />,
  },
  {
    title: "Średnie zużycie CPU (%)",
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
  const { samples, average } = useSimulationDataContext();
  const { currentFile, config } = useCrypto();

  return (
    <Container className={"!p-0 overflow-x-auto"}>
      <section className="flex items-center gap-2 border-b-[1px] border-slate-200 p-4">
        <div className={`p-2 rounded-lg bg-blue-100 text-blue-700`}>
          <TextSearch size={"1rem"} />
        </div>
        <div>
          <h3 className="font-bold text-slate-700">
            Podsumowanie wyników przetwarzania plików
          </h3>
          <p className="text-xs text-slate-400">
            Przegląd wydajności algorytmów AES i RSA dla aktualnie
            przetwarzanych plików
          </p>
        </div>
      </section>
      <section className={"border-b-[1px] border-slate-200 !w-full"}>
        {/*table header*/}
        <div className={"grid grid-cols-[12rem_1fr_1fr]"}>
          <div className={"!w-40"} />
          {algorithms.map((alg) => (
            <div key={alg} className={"relative p-4 font-normal text-center"}>
              {alg}
            </div>
          ))}
        </div>
      </section>

      <section className={""}>
        {tableRows.map((row) => (
          <div
            className={"grid grid-cols-[12rem_1fr_1fr] text-sm"}
            key={row.type}
          >
            <div className={"border-r-[1px] border-slate-200 text-sm"}>
              <span className={"inline-block px-4 py-2"}>{row.title}</span>
            </div>
            {algorithms.map((alg) =>
              renderTableRow(alg, row.type, {
                config,
                file: currentFile!,
                average,
              }),
            )}
          </div>
        ))}
      </section>
    </Container>
  );
};

const renderTableRow = (
  algorithm: Algorithm,
  type: string,
  data: { file: FileRaceState; config: any; average: AverageData },
) => {
  const alg = algorithm.toLowerCase();

  let element;

  switch (type) {
    case "progress":
      element = <div>Postęp</div>;
      break;
    case "keySize":
      element = <span>{data.config[alg].keySize} bity</span>;
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

      element = <span>{throughput.toFixed(2)} MB/s</span>;
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
        value = data.file?.aes?.finished
          ? data.file.aes.time
          : "Proces nadal trwa...";
      } else {
        value = data.file?.rsa?.finished
          ? data.file.rsa.time
          : "Proces nadal trwa...";
      }

      element = <span>{value}</span>;
      break;
  }

  return <div className={"px-4 py-2"}>{element}</div>;
};

export default SummaryTable;
