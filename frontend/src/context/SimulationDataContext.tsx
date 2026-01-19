import { createContext, type ReactNode, useContext } from "react";
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

  return (
    <SimulationDataContext.Provider
      value={{
        simulationData,
        currentFileData:
          currentFileIndex > -1
            ? simulationData[currentFileIndex]
            : initialFileState,
      }}
    >
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
