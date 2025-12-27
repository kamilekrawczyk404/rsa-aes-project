import React from "react";
import type { FileRaceState } from "../../types/crypto.ts";

type CpuUsageChartProps = {
  currentFile: FileRaceState | null;
};

const CpuUsageChart = ({ currentFile }: CpuUsageChartProps) => {
  return <div>CpuUsageChart</div>;
};

export default CpuUsageChart;
