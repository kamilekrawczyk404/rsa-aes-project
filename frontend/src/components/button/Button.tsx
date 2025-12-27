import { type ComponentProps } from "react";
import { type HTMLMotionProps, motion } from "framer-motion";

const SkeletonButton = ({
  className,
  children,
  ...props
}: HTMLMotionProps<"button">) => {
  return (
    <motion.button
      type={"button"}
      whileTap={{
        scale: 0.99,
      }}
      className={`lg:w-fit flex justify-center items-center transition-colors h-10 px-3 rounded-lg ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

const ProcessButton = ({
  onClick,
  children,
  disabled = false,
}: ComponentProps<"button">) => {
  return (
    <SkeletonButton
      className={"bg-blue-700 text-slate-100 disabled:bg-blue-700/50"}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </SkeletonButton>
    // <motion.button
    //   disabled={disabled}
    //   type={"button"}
    //   onClick={onClick}
    //   whileTap={{
    //     scale: 0.99,
    //   }}
    //   className={` transition-colors h-10 px-3 rounded-lg ${className}`}
    // >
    //   {children}
    // </motion.button>
  );
};

const DangerButton = ({
  onClick,
  disabled = false,
  children,
}: ComponentProps<"button">) => {
  return (
    <SkeletonButton
      className={"bg-red-600 text-slate-100 disabled:bg-red-700/50"}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </SkeletonButton>
  );
};

export const Button = {
  Process: ProcessButton,
  Danger: DangerButton,
  // Download: DownloadButton,
};

export default Button;
