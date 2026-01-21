import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";

interface ModalInstance {
  id: string;
  content: ReactNode;
  options?: ModalOptions;
}

interface ModalOptions {
  closeOnBackdropClick?: boolean;
  onClose?: () => void;
}

interface ModalContextValues {
  modals: ModalInstance[];
  openModal: (content: ReactNode, options?: ModalOptions) => void;
  closeModal: () => void;
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextValues | null>(null);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modals, setModals] = useState<ModalInstance[]>([]);

  const openModal = useCallback(
    (content: ReactNode, options?: ModalOptions) => {
      const defaultOptions = {
        onClose: closeModal,
        closeOnBackdropClick: true,
      };

      const finalOptions = { ...defaultOptions, options };
      const id = crypto.randomUUID();

      setModals((prev) => [...prev, { id, content, options: finalOptions }]);
    },
    [],
  );

  const closeModal = useCallback(() => {
    setModals((prev) => prev.slice(0, -1));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  const modalContextValues = useMemo(
    () => ({
      modals,
      openModal,
      closeModal,
      closeAllModals,
    }),
    [modals, openModal, closeModal, closeAllModals],
  );

  return (
    <ModalContext.Provider value={modalContextValues}>
      {children}
      <ModalRoot />
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }

  return context;
};

const ModalRoot = () => {
  const { modals, closeModal } = useModal();

  return (
    <AnimatePresence>
      {modals.map((modal) => (
        <div
          key={modal.id}
          className={
            "fixed inset-0 z-[100] flex items-center justify-center p-4"
          }
        >
          {/*Overlay*/}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", duration: 0.2 }}
            onClick={() => {
              if (modal.options?.closeOnBackdropClick) {
                modal.options.onClose?.();
                closeModal();
              }
            }}
            className={"absolute inset-0 bg-black/60 backdrop-blur-[2px]"}
          />

          {/*Modal Container*/}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: "tween", duration: 0.2 }}
            className={
              "relative z-10 bg-white rounded-xl shadow-lg max-w-4xl w-full overflow-hidden flex max-h-[90vh]"
            }
          >
            {modal.content}
          </motion.div>
        </div>
      ))}
    </AnimatePresence>
  );
};
