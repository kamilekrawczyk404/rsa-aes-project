import type { Transition, Variants } from "framer-motion";

export const defaultTransition = (
  delayOnStart: boolean = false,
): Transition => ({
  duration: 0.2,
  delay: delayOnStart ? 0.1 : 0,
  ease: "easeOut",
});

export const appearingVariants = (): Variants => {
  const yOffset = 10;

  return {
    initial: {
      opacity: 0,
      y: -yOffset,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        ease: "easeInOut",
        opacity: {
          delay: 0.1,
        },
      },
    },
    exit: {
      opacity: 0,
      y: yOffset,
    },
  };
};
