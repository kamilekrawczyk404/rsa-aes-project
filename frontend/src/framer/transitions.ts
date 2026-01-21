import { stagger, type Transition, type Variants } from "framer-motion";

export const defaultTransition = (
  delayOnStart: boolean = false,
): Transition => ({
  delay: delayOnStart ? 0.4 : 0,
  type: "spring",
  stiffness: 70,
  damping: 15,
  mass: 1,
});

export const appearingVariants = (
  direction: "down-down" | "up-up" | "down-up" | "up-down" = "down-down",
  isDelayed: boolean = false,
): Variants => {
  const yOffset = 5;

  return {
    initial: {
      opacity: 0,
      translateY: direction.startsWith("down") ? -yOffset : yOffset,
    },
    animate: {
      opacity: 1,
      translateY: 0,
      transition: {
        ...defaultTransition(isDelayed),
      },
    },
    exit: {
      opacity: 0,
      translateY: direction.startsWith("up") ? yOffset : -yOffset,
    },
  };
};

export const staggeredVariants = (
  direction: "up" | "down" = "up",
  staggerDuration = 0.2,
): { parent: Variants; children: Variants } => {
  const yOffset = 5;

  return {
    parent: {
      initial: {
        opacity: 0,
      },
      animate: {
        transition: {
          when: "beforeChildren",
          delayChildren: stagger(staggerDuration),
        },
        opacity: 1,
      },
      exit: {
        opacity: 0,
      },
    },
    children: {
      initial: {
        opacity: 0,
        translateY: direction === "up" ? yOffset : -yOffset,
      },
      animate: {
        opacity: 1,
        translateY: 0,
      },
      exit: {
        opacity: 0,
        translateY: direction === "up" ? -yOffset : yOffset,
      },
    },
  };
};
