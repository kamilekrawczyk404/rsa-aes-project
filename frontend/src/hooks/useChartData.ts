import { useEffect, useState } from "react";
import type { FileRaceState } from "../types/crypto.ts";

const MAX_HISTORY_POINTS = 500;

interface ChartDataPoint {
  time: string;
  aes: {
    throughput: number;
    cpuUsage: number;
  };
  rsa: {
    throughput: number;
    cpuUsage: number;
  };
}

const useChartData = (currentFile: FileRaceState | null) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    setChartData([]);
  }, [currentFile?.fileId]);

  useEffect(() => {
    if (!currentFile) return;

    const aesThroughput = currentFile.aes.throughput;
    const rsaThroughput = currentFile.rsa.throughput;
    const aesCpuUsage = currentFile.aes.cpu;
    const rsaCpuUsage = currentFile.rsa.cpu;

    if (aesThroughput === 0 && rsaThroughput === 0 && chartData.length === 0)
      return;

    const timeLabel = (chartData.length * 0.1).toFixed(1) + "s";

    setChartData((prev) => {
      const newHistory = [
        ...prev,
        {
          time: timeLabel,
          aes: {
            throughput: currentFile.aes.finished ? 0 : aesThroughput,
            cpuUsage: currentFile.aes.finished ? 0 : aesCpuUsage,
          },
          rsa: {
            throughput: currentFile.rsa.finished ? 0 : rsaThroughput,
            cpuUsage: currentFile.rsa.finished ? 0 : rsaCpuUsage,
          },
        },
      ];

      if (newHistory.length >= MAX_HISTORY_POINTS) {
        return newHistory.slice(newHistory.length - MAX_HISTORY_POINTS);
      }

      return newHistory;
    });
  }, [
    currentFile?.aes?.throughput,
    currentFile?.rsa?.throughput,
    currentFile?.aes?.cpu,
    currentFile?.rsa?.cpu,
  ]);

  return chartData;
};

export default useChartData;
