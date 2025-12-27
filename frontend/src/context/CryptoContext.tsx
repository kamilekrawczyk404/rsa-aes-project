import { createContext, type ReactNode, useContext } from "react";
import { useCryptoProcess } from "../hooks/useCryptoProcess.ts";

type CryptoContextType = ReturnType<typeof useCryptoProcess>;

const CryptoContext = createContext<CryptoContextType | null>(null);

// Crypto Process must be available throughout the app
export const CryptoProcessProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const cryptoProcess = useCryptoProcess();

  return (
    <CryptoContext.Provider value={cryptoProcess}>
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => {
  const context = useContext(CryptoContext);

  if (!context) {
    throw new Error("useCrypto must be used within a CryptoProcessProvider");
  }

  return context;
};
