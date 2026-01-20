import { type ComponentProps } from "react";
import { type HTMLMotionProps, motion } from "framer-motion";
import { X } from "lucide-react";

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
      className={`lg:w-fit flex justify-center items-center transition-colors h-10 px-3 rounded-lg disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
  );
};

const DangerButton = ({
  onClick,
  children,
  disabled = false,
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

const ClosingButton = ({ children, ...props }: ComponentProps<"button">) => {
  return (
    <button
      className={
        "border-inherit text-inherit w-6 h-6 rounded-sm flex items-center justify-center"
      }
      {...props}
    >
      <X size={"1rem"} />
    </button>
  );
};

export const Button = {
  Process: ProcessButton,
  Danger: DangerButton,
  Close: ClosingButton,
  // Download: DownloadButton,
};

export default Button;
