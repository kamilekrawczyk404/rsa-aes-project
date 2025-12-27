import { useEffect, useState } from "react";
import type { FileRaceState } from "../types/crypto.ts";

const MAX_SAMPLES_LENGTH = 500;

interface SampleProperties {
  throughput: number;
  cpuUsage: number;
}

export interface SimulationSample {
  time: string;
  aes: SampleProperties;
  rsa: SampleProperties;
}

export type AverageData = Omit<SimulationSample, "time">;

interface SimulationData {
  samples: SimulationSample[];
  average: AverageData;
}

const initialState: SimulationData = {
  samples: [],
  average: {
    aes: {
      throughput: 0,
      cpuUsage: 0,
    },
    rsa: {
      throughput: 0,
      cpuUsage: 0,
    },
  },
};

const useSimulationData = (currentFile: FileRaceState | null) => {
  const [simulationData, setSimulationData] =
    useState<SimulationData>(initialState);

  const [sums, setSums] = useState<Omit<SimulationSample, "time">>({
    aes: { throughput: 0, cpuUsage: 0 },
    rsa: { throughput: 0, cpuUsage: 0 },
  });

  useEffect(() => {
    setSimulationData(initialState);
  }, [currentFile?.fileId]);

  useEffect(() => {
    if (!currentFile) return;

    const aesThroughput = currentFile.aes.throughput;
    const rsaThroughput = currentFile.rsa.throughput;
    const aesCpuUsage = currentFile.aes.cpu;
    const rsaCpuUsage = currentFile.rsa.cpu;

    if (
      aesThroughput === 0 &&
      rsaThroughput === 0 &&
      simulationData.samples.length === 0
    )
      return;

    const timeLabel = (simulationData.samples.length * 0.1).toFixed(1) + "s";

    const isAesFinished = currentFile.aes.finished;
    const isRsaFinished = currentFile.rsa.finished;

    setSums((prev) => ({
      aes: {
        throughput: prev.aes.throughput + (isAesFinished ? 0 : aesThroughput),
        cpuUsage: prev.aes.cpuUsage + (isAesFinished ? 0 : aesCpuUsage),
      },
      rsa: {
        throughput: prev.rsa.throughput + (isRsaFinished ? 0 : rsaThroughput),
        cpuUsage: prev.rsa.cpuUsage + (isRsaFinished ? 0 : rsaCpuUsage),
      },
    }));

    setSimulationData((prev) => {
      const samplesLength = prev.samples.length - 1;

      const average: AverageData = {
        rsa: {
          throughput: isRsaFinished
            ? prev.average.rsa.throughput
            : sums.rsa.throughput / samplesLength,
          cpuUsage: isRsaFinished
            ? prev.average.rsa.cpuUsage
            : sums.rsa.cpuUsage / samplesLength,
        },
        aes: {
          throughput: isAesFinished
            ? prev.average.aes.throughput
            : sums.aes.throughput / samplesLength,
          cpuUsage: isAesFinished
            ? prev.average.aes.cpuUsage
            : sums.aes.cpuUsage / samplesLength,
        },
      };

      const newSamples: SimulationSample[] = [
        ...prev.samples,
        {
          time: timeLabel,
          aes: {
            throughput: isAesFinished ? 0 : aesThroughput,
            cpuUsage: isAesFinished ? 0 : aesCpuUsage,
          },
          rsa: {
            throughput: isRsaFinished ? 0 : rsaThroughput,
            cpuUsage: isRsaFinished ? 0 : rsaCpuUsage,
          },
        },
      ];

      if (newSamples.length >= MAX_SAMPLES_LENGTH) {
        newSamples.slice(newSamples.length - MAX_SAMPLES_LENGTH);
      }

      return {
        average,
        samples: newSamples,
      };
    });
  }, [
    currentFile?.aes?.throughput,
    currentFile?.rsa?.throughput,
    currentFile?.aes?.cpu,
    currentFile?.rsa?.cpu,
  ]);

  return simulationData;
};

export default useSimulationData;
