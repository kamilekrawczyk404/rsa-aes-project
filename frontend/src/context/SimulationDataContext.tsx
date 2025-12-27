import { createContext, type ReactNode, useContext } from "react";
import useSimulationData from "../hooks/useSimulationData.ts";
import { useCrypto } from "./CryptoContext.tsx";

type ChartDataContextType = ReturnType<typeof useSimulationData>;

const SimulationDataContext = createContext<ChartDataContextType | null>(null);

export const SimulationDataProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { currentFile } = useCrypto();

  const chartData = useSimulationData(currentFile);

  return (
    <SimulationDataContext.Provider value={chartData}>
      {children}
    </SimulationDataContext.Provider>
  );
};

export const useSimulationDataContext = () => {
  const context = useContext(SimulationDataContext);

  if (!context) {
    throw new Error(
      "useSimulationDataContext must be used within a SimulationDataProvider",
    );
  }

  return context;
};
