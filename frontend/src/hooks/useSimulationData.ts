import { useEffect, useRef, useState } from "react";
import type { FileRaceState } from "../types/crypto.ts";

const MAX_SAMPLES_LENGTH = 50;

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

  const statsRef = useRef({
    aes: { throughputSum: 0, cpuSum: 0, count: 0 },
    rsa: { throughputSum: 0, cpuSum: 0, count: 0 },
  });

  const startTimeRef = useRef<number | null>(null);

  // Reset all the fields when file is changed
  useEffect(() => {
    setSimulationData(initialState);

    statsRef.current = {
      aes: { throughputSum: 0, cpuSum: 0, count: 0 },
      rsa: { throughputSum: 0, cpuSum: 0, count: 0 },
    };

    startTimeRef.current = null;
  }, [currentFile?.fileId]);

  useEffect(() => {
    if (!currentFile) return;

    const aesThroughput = Number(currentFile.aes.throughput);
    const rsaThroughput = Number(currentFile.rsa.throughput);
    const aesCpu = Number(currentFile.aes.cpu);
    const rsaCpu = Number(currentFile.rsa.cpu);

    if (
      aesThroughput === 0 &&
      rsaThroughput === 0 &&
      simulationData.samples.length === 0
    )
      return;

    // Start the timer
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    // Calculate time difference
    const now = Date.now();
    const elapsedSeconds = (now - startTimeRef.current) / 1000;

    const timeLabel = `${elapsedSeconds.toFixed(1)}s`;

    const isAesFinished = currentFile.aes.finished;
    const isRsaFinished = currentFile.rsa.finished;
    const stats = statsRef.current;

    if (!isAesFinished) {
      stats.aes.throughputSum += aesThroughput;
      stats.aes.cpuSum += aesCpu;
      stats.aes.count += 1;
    }

    if (!isRsaFinished) {
      stats.rsa.throughputSum += rsaThroughput;
      stats.rsa.cpuSum += rsaCpu;
      stats.rsa.count += 1;
    }

    setSimulationData((prev) => {
      const newAverage: AverageData = {
        aes: {
          throughput:
            stats.aes.count > 0 ? stats.aes.throughputSum / stats.aes.count : 0,
          cpuUsage:
            stats.aes.count > 0 ? stats.aes.cpuSum / stats.aes.count : 0,
        },
        rsa: {
          throughput:
            stats.rsa.count > 0 ? stats.rsa.throughputSum / stats.rsa.count : 0,
          cpuUsage:
            stats.rsa.count > 0 ? stats.rsa.cpuSum / stats.rsa.count : 0,
        },
      };

      let newSamples: SimulationSample[] = [
        ...prev.samples,
        {
          time: timeLabel,
          aes: {
            throughput: isAesFinished ? 0 : aesThroughput,
            cpuUsage: isAesFinished ? 0 : aesCpu,
          },
          rsa: {
            throughput: isRsaFinished ? 0 : rsaThroughput,
            cpuUsage: isRsaFinished ? 0 : rsaCpu,
          },
        },
      ];

      if (newSamples.length > MAX_SAMPLES_LENGTH) {
        newSamples = newSamples.slice(-MAX_SAMPLES_LENGTH);
      }

      return {
        average: newAverage,
        samples: newSamples,
      };
    });
  }, [
    currentFile?.aes?.throughput,
    currentFile?.rsa?.throughput,
    currentFile?.aes?.cpu,
    currentFile?.rsa?.cpu,
    currentFile?.aes?.finished,
    currentFile?.rsa?.finished,
  ]);

  return simulationData;
};

export default useSimulationData;
