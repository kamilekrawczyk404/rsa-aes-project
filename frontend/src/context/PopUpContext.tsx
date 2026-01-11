import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import Popup, { type PopupProps } from "../components/banners/Popup";
import { AnimatePresence } from "framer-motion";

export const MAX_DISPLAYED_POPUPS = 5;
export const FADE_OUT_TIMEOUT = 3000;

type PopUpContextValues = {
  popups: PopupProps[];
  addNewPopup: (popup: PopupProps) => void;
  closePopup: (id: string) => void;
};

const PopupContext = createContext<PopUpContextValues | null>(null);

export const PopupProvider = ({ children }: { children: ReactNode }) => {
  const [popups, setPopups] = useState<PopupProps[]>([]);

  const addNewPopup = useCallback(
    (popup: Omit<PopupProps, "id" | "position">) => {
      setPopups((prev) => {
        const newPopUp: PopupProps = {
          id: uuidv4(),
          position: 0,
          ...popup,
        };

        // Only n-1 elements
        const sliced = prev.slice(0, MAX_DISPLAYED_POPUPS - 1);

        return [
          newPopUp,
          // Move the older ones lower
          ...sliced.map((popup, index) => ({ ...popup, position: index + 1 })),
        ];
      });
    },
    [],
  );

  const closePopup = useCallback((id: string) => {
    setPopups((prev) =>
      prev
        .filter((p) => p.id !== id)
        // Move the older one top higher
        .map((p, index) => ({ ...p, position: index })),
    );
  }, []);

  return (
    <PopupContext.Provider
      value={{
        popups,
        addNewPopup,
        closePopup,
      }}
    >
      {children}
      <section className={"fixed bottom-4 right-4 !z-[100]"}>
        <div className={"relative"}>
          <AnimatePresence>
            {popups.map((p) => (
              <Popup key={p.id} {...p} />
            ))}
          </AnimatePresence>
        </div>
      </section>
    </PopupContext.Provider>
  );
};

export const usePopups = () => {
  const context = useContext(PopupContext);

  if (!context) {
    throw new Error("usePopups must be used within PopupContextProvider");
  }

  return context;
};
