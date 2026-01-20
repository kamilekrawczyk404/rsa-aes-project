import { memo } from "react";
import { Activity } from "lucide-react";
import ChartSkeleton from "./ChartSkeleton.tsx";
import { useSimulationData } from "../../context/SimulationDataContext.tsx";

const ThroughputChart = memo(() => {
  const {
    currentFileData: { samples },
  } = useSimulationData();

  return (
    <ChartSkeleton
      icon={<Activity size={"1rem"} />}
      title={"Przepustowość"}
      description={"Szybkość przetwarzania danych przez algorymy"}
      data={samples}
      unit={"(MB/s)"}
      keys={{ aes: "aes.throughput", rsa: "rsa.throughput" }}
    />
  );
});

export default ThroughputChart;
