import { motion } from "framer-motion";

interface BlinkerProps {
  trigger: boolean;
}

const Blinker = ({ trigger }: BlinkerProps) => {
  return (
    <motion.div
      animate={{
        boxShadow: trigger
          ? [
              "0 0 4px oklch(59.6% 0.145 163.225)",
              "0 0 8px oklch(50.8% 0.118 165.612)",
            ]
          : "",
        opacity: trigger ? ["100%", "50%"] : "100%",
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        repeatType: "mirror",
      }}
      className={`w-2 h-2 rounded-full ${
        trigger ? "bg-emerald-500" : "bg-amber-500"
      }`}
    />
  );
};

export default Blinker;
