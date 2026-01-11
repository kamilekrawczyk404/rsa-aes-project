import ChartSkeleton from "./ChartSkeleton.tsx";
import { Cpu } from "lucide-react";
import { useSimulationDataContext } from "../../context/SimulationDataContext.tsx";

const CpuUsageChart = () => {
  const { samples } = useSimulationDataContext();

  console.log(samples, samples.length);

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
