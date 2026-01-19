import ChartSkeleton from "./ChartSkeleton.tsx";
import { Cpu } from "lucide-react";
import { useSimulationData } from "../../context/SimulationDataContext.tsx";

const CpuUsageChart = () => {
  const {
    currentFileData: { samples },
  } = useSimulationData();

  return (
    <ChartSkeleton
      icon={<Cpu size={"1rem"} />}
      title={"Zużycie procesora"}
      description={"Obciążenie rdzenia (%)"}
      data={samples}
      unit={"(%)"}
      keys={{ aes: "aes.cpuUsage", rsa: "rsa.cpuUsage" }}
    />
  );
};

export default CpuUsageChart;
