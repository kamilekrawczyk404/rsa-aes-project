import { createContext, type ReactNode, useContext } from "react";
import useChartData from "../hooks/useChartData.ts";
import { useCrypto } from "./CryptoContext.tsx";

type ChartDataContextType = ReturnType<typeof useChartData>;

const ChartDataContext = createContext<ChartDataContextType | null>(null);

export const ChartDataProvider = ({ children }: { children: ReactNode }) => {
  const { currentFile } = useCrypto();

  const chartData = useChartData(currentFile);

  return (
    <ChartDataContext.Provider value={chartData}>
      {children}
    </ChartDataContext.Provider>
  );
};

export const useChartDataContext = () => {
  const context = useContext(ChartDataContext);

  if (!context) {
    throw new Error(
      "useChartDataContext must be used within a ChartDataProvider",
    );
  }

  return context;
};
