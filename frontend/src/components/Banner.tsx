import { type ReactNode } from "react";
import { Bug } from "lucide-react";
import { motion } from "framer-motion";
import { appearingVariants } from "../framer/transitions.ts";

type BannerProps = {
  title: string;
  description: string;
};

const BannerSkeleton = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  const variants = appearingVariants();
  return (
    <motion.div
      variants={variants}
      initial={"initial"}
      animate={"animate"}
      exit={"exit"}
      className={`border-[1px] p-4 rounded-md ${className}`}
    >
      <div
        className={
          "flex flex-col gap-2 items-center max-w-md mx-auto text-center"
        }
      >
        {children}
      </div>
    </motion.div>
  );
};

const ErrorBanner = ({ title, description }: BannerProps) => {
  return (
    <BannerSkeleton className={"border-red-200 bg-red-100 text-red-600"}>
      <div
        className={
          "w-12 aspect-square bg-red-200 rounded-full flex items-center justify-center"
        }
      >
        <Bug />
      </div>
      <div className={"text-red-600 font-semibold"}>{title}</div>
      <div className={"text-red-500"}>{description}</div>
    </BannerSkeleton>
  );
};

const Banner = {
  Info: ({ title, description }: BannerProps) => {
    return (
      <BannerSkeleton>
        <div className={"text-blue-600 font-semibold"}>{title}</div>
        <div className={"text-blue-500"}>{description}</div>
      </BannerSkeleton>
    );
  },
  Error: ErrorBanner,
};

export default Banner;
