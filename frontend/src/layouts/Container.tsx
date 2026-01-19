import { type ComponentProps } from "react";
import { motion } from "framer-motion";
import { appearingVariants } from "../framer/transitions.ts";

const Container = ({ children, className = "" }: ComponentProps<"div">) => {
  const variants = appearingVariants("down-up", true);

  return (
    <motion.div
      variants={variants}
      initial={"initial"}
      animate={"animate"}
      exit={"exit"}
      className={`relative border-slate-200 border-[1px] lg:p-6 p-4 rounded-lg bg-white shadow-sm ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Container;
