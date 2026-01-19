import { type ReactNode, useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
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
  const hiddenTextRef = useRef(null);
  const shownTextRef = useRef(null);

  const containerHeight = useRef(0);

  const options = defaultTransition();

  useLayoutEffect(() => {
    if (hiddenTextRef.current && shownTextRef.current) {
      const hiddenHeight = (hiddenTextRef.current as HTMLDivElement)
        .offsetHeight;
      const shownHeight = (shownTextRef.current as HTMLDivElement).offsetHeight;
      containerHeight.current = Math.max(hiddenHeight, shownHeight);
    }
  }, [texts]);

  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      style={{ height: containerHeight.current + "px" }}
    >
      <motion.div
        ref={hiddenTextRef}
        // key={texts.shown?.toString()}
        initial={{
          ...(orientation === "vertical"
            ? { translateY: "-100%" }
            : { translateX: "-100%" }),
          transition: { duration: 0 },
          opacity: 0,
        }}
        animate={
          trigger
            ? {
                ...(orientation === "vertical"
                  ? { translateY: 0 }
                  : { translateX: 0 }),
                opacity: 1,
              }
            : {}
        }
        // exit={orientation === "vertical" ? { y: "-100%" } : { x: "-100%" }}
        transition={{ type: "spring", ...options }}
        className={"absolute"}
      >
        {texts.hidden}
      </motion.div>
      <motion.div
        ref={shownTextRef}
        // key={texts.hidden?.toString()}
        initial={{
          ...(orientation === "vertical"
            ? { translateY: 0 }
            : { translateX: 0 }),
          transition: { duration: 0 },
          opacity: 1,
        }}
        animate={
          trigger
            ? {
                ...(orientation === "vertical"
                  ? { translateY: "100%" }
                  : { translateX: "100%" }),
                opacity: 0,
              }
            : {}
        }
        // exit={orientation === "vertical" ? { y: 0 } : { x: 0 }}
        transition={{ type: "spring", ...options }}
        className={"absolute"}
      >
        {texts.shown}
      </motion.div>
    </motion.div>
  );
};

export default TextSlider;
