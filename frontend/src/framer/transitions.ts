import type { Transition } from "framer-motion";

export const defaultTransition = (
  delayOnStart: boolean = false,
): Transition => ({
  duration: 0.2,
  delay: delayOnStart ? 0.1 : 0,
  ease: "easeOut",
});
