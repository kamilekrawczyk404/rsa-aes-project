import { type ComponentProps } from "react";
import { motion } from "framer-motion";

const ProcessButton = ({
  onClick,
  className,
  children,
  disabled = false,
}: ComponentProps<"button">) => {
  return (
    <motion.button
      disabled={disabled}
      type={"button"}
      onClick={onClick}
      whileTap={{
        scale: 0.99,
      }}
      className={`bg-blue-700 text-slate-100 disabled:bg-blue-700/50 transition-colors h-10 px-3 rounded-lg ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default ProcessButton;
