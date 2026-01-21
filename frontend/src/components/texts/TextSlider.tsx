import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { defaultTransition } from "../../framer/transitions.ts";

interface TextSliderProps {
  texts: {
    shown: ReactNode;
    hidden: ReactNode;
  };
  trigger: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const TextSlider = ({
  texts,
  trigger,
  orientation = "vertical",
  className = "",
}: TextSliderProps) => {
  // Definicja wariantów animacji dla czystszego kodu
  const variants = {
    initial: (isActive: boolean) => ({
      opacity: 0,
      y: orientation === "vertical" ? (isActive ? "100%" : "-100%") : 0,
      x: orientation === "horizontal" ? (isActive ? "100%" : "-100%") : 0,
    }),
    animate: {
      opacity: 1,
      y: 0,
      x: 0,
    },
    exit: (isActive: boolean) => ({
      opacity: 0,
      y: orientation === "vertical" ? (isActive ? "-100%" : "100%") : 0,
      x: orientation === "horizontal" ? (isActive ? "-100%" : "100%") : 0,
    }),
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode={"popLayout"} initial={false} custom={trigger}>
        <motion.div
          key={trigger ? "triggered" : "default"}
          custom={trigger}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={defaultTransition()}
          className="block w-full"
        >
          {trigger ? texts.hidden : texts.shown}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TextSlider;
