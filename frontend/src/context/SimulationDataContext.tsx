import { createContext, type ReactNode, useContext, useMemo } from "react";
import prepareSimulationData, {
  initialFileState,
  type SimulationData,
} from "../hooks/prepareSimulationData.ts";
import { useCrypto } from "./CryptoContext.tsx";

type ChartDataContextType = {
  simulationData: SimulationData[];
  currentFileData: SimulationData;
};

const SimulationDataContext = createContext<ChartDataContextType | null>(null);

export const SimulationDataProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { currentFileIndex } = useCrypto();
  const simulationData = prepareSimulationData();

  const simulationDataValues = useMemo(
    () => ({
      simulationData,
      currentFileData:
        currentFileIndex > -1
          ? simulationData[currentFileIndex]
          : initialFileState,
    }),
    [currentFileIndex, simulationData],
  );

  return (
    <SimulationDataContext.Provider value={simulationDataValues}>
      {children}
    </SimulationDataContext.Provider>
  );
};

export const useSimulationData = () => {
  const context = useContext(SimulationDataContext);

  if (!context) {
    throw new Error(
      "useSimulationDataContext must be used within a SimulationDataProvider",
    );
  }

  return context;
};
