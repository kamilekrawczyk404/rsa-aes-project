import { type ReactNode } from "react";
import { Bug, Info, TriangleAlert, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { appearingVariants } from "../../framer/transitions.ts";
import type { BannerType } from "./types.ts";
import { bannerStyles } from "./config.ts";

type BannerProps = {
  title: string;
  description: string;
};

type BannerSkeletonProps = BannerProps & {
  icon: ReactNode;
  type: BannerType;
  className?: string;
};

// const bannerStyles: Record<
//     BannerType,
//     {
//       border: string;
//       background: string;
//       gradientFrom: string; // Kolor startowy gradientu
//       iconBg: string;
//       iconColor: string;
//       titleColor: string;
//       descriptionColor: string;
//     }
// > = {
//   info: {
//     border: "border-blue-200",
//     background: "bg-blue-50",
//     gradientFrom: "from-blue-200/50",
//     iconBg: "bg-blue-100",
//     iconColor: "text-blue-600",
//     titleColor: "text-blue-900",
//     descriptionColor: "text-blue-700/80",
//   },
//   error: {
//     border: "border-red-200",
//     background: "bg-red-50",
//     gradientFrom: "from-red-200/50",
//     iconBg: "bg-red-100",
//     iconColor: "text-red-600",
//     titleColor: "text-red-900",
//     descriptionColor: "text-red-700/80",
//   },
//   warning: {
//     border: "border-amber-200",
//     background: "bg-amber-50",
//     gradientFrom: "from-amber-200/50",
//     iconBg: "bg-amber-100",
//     iconColor: "text-amber-600",
//     titleColor: "text-amber-900",
//     descriptionColor: "text-amber-700/80",
//   },
//   success: {
//     border: "border-green-200",
//     background: "bg-green-50",
//     gradientFrom: "from-green-200/50",
//     iconBg: "bg-green-100",
//     iconColor: "text-green-600",
//     titleColor: "text-green-900",
//     descriptionColor: "text-green-700/80",
//   },
// };

// --- 2. Komponent Szkieletu ---

const BannerSkeleton = ({
  description,
  title,
  icon,
  type,
  className = "",
}: BannerSkeletonProps) => {
  const variants = appearingVariants();
  const styling = bannerStyles[type];

  return (
    <motion.div
      variants={variants}
      initial={"initial"}
      animate={"animate"}
      exit={"exit"}
      // Dodajemy relative i overflow-hidden dla gradientu
      className={`
        relative overflow-hidden rounded-xl border p-6 text-center
        ${styling.border} ${styling.background} ${className}
      `}
    >
      {/* Warstwa Gradientu */}
      <div
        className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${styling.gradientFrom} to-transparent opacity-60`}
      />

      {/* Treść (z-10 aby być nad gradientem) */}
      <div className="relative z-10 flex flex-col items-center gap-3 max-w-md mx-auto">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${styling.iconBg} ${styling.iconColor}`}
        >
          {icon}
        </div>

        <div className="flex flex-col gap-1">
          <div
            className={`font-semibold text-lg leading-tight ${styling.titleColor}`}
          >
            {title}
          </div>
          <div className={`text-sm ${styling.mutedColor}`}>{description}</div>
        </div>
      </div>
    </motion.div>
  );
};

const InfoBanner = (props: BannerProps) => (
  <BannerSkeleton {...props} type="info" icon={<Info size={24} />} />
);

const ErrorBanner = (props: BannerProps) => (
  <BannerSkeleton {...props} type="error" icon={<Bug size={24} />} />
);

const WarningBanner = (props: BannerProps) => (
  <BannerSkeleton
    {...props}
    type="warning"
    icon={<TriangleAlert size={24} />}
  />
);

const SuccessBanner = (props: BannerProps) => (
  <BannerSkeleton {...props} type="success" icon={<CheckCircle2 size={24} />} />
);

const Banner = {
  Info: InfoBanner,
  Error: ErrorBanner,
  Warning: WarningBanner,
  Success: SuccessBanner,
};

export default Banner;
