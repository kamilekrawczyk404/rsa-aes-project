import { type ReactNode } from "react";
import { Bug, Info, TriangleAlert } from "lucide-react";
import { motion } from "framer-motion";
import { appearingVariants } from "../framer/transitions.ts";

type BannerProps = {
  title: string;
  description: string;
};

type BannerSkeletonProps = BannerProps & {
  icon?: ReactNode;
  className?: string;
  wrapperClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  iconClassName?: string;
};

const BannerSkeleton = ({
  description,
  title,
  icon,
  wrapperClassName = "",
  titleClassName = "",
  descriptionClassName = "",
  iconClassName = "",
}: BannerSkeletonProps) => {
  const variants = appearingVariants();
  return (
    <motion.div
      variants={variants}
      initial={"initial"}
      animate={"animate"}
      exit={"exit"}
      className={`border-[1px] p-4 rounded-md ${wrapperClassName}`}
    >
      <div
        className={
          "flex flex-col gap-2 items-center max-w-md mx-auto text-center"
        }
      >
        <div
          className={`w-12 aspect-square rounded-full flex items-center justify-center ${iconClassName}`}
        >
          {icon}
        </div>
        <div className={`font-semibold ${titleClassName}`}>{title}</div>
        <div className={`text-sm ${descriptionClassName}`}>{description}</div>
      </div>
    </motion.div>
  );
};

const InfoBanner = ({ title, description }: BannerProps) => {
  return (
    <BannerSkeleton
      wrapperClassName={"border-blue-200 bg-blue-50 text-blue-700"}
      icon={<Info />}
      title={title}
      description={description}
      titleClassName={"text-blue-700"}
      descriptionClassName={"text-blue-500"}
      iconClassName={"bg-blue-200"}
    />
  );
};

const ErrorBanner = ({ title, description }: BannerProps) => {
  return (
    <BannerSkeleton
      wrapperClassName={"border-red-200 bg-red-100 text-red-600"}
      title={title}
      description={description}
      titleClassName={"text-red-600"}
      descriptionClassName={"text-red-500"}
      icon={<Bug />}
      iconClassName={"bg-red-200"}
    />
  );
};

const BannerWarning = ({ title, description }: BannerProps) => {
  return (
    <BannerSkeleton
      wrapperClassName={"border-amber-200 bg-amber-50 text-amber-700"}
      title={title}
      description={description}
      titleClassName={"text-amber-700"}
      descriptionClassName={"text-amber-600"}
      icon={<TriangleAlert />}
      iconClassName={"bg-amber-200"}
    />
  );
};

const Banner = {
  Info: InfoBanner,
  Error: ErrorBanner,
  Warning: BannerWarning,
};

export default Banner;
