// styles.ts (lub constants.ts)

import type { BannerType, PopupStyleConfig } from "./types.ts";

export const bannerStyles: Record<BannerType, PopupStyleConfig> = {
  success: {
    border: "border-emerald-200",
    background: "bg-emerald-50",
    shadow: "shadow-emerald-100",
    gradientFrom: "from-emerald-200/50",
    iconBg: "bg-emerald-200/80",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-900",
    mutedColor: "text-emerald-700/80",
  },
  error: {
    border: "border-red-200",
    background: "bg-red-50",
    shadow: "shadow-red-100",
    gradientFrom: "from-red-200/50",
    iconBg: "bg-red-200/80",
    iconColor: "text-red-600",
    titleColor: "text-red-900",
    mutedColor: "text-red-700/80",
  },
  info: {
    border: "border-blue-200",
    background: "bg-blue-50",
    shadow: "shadow-blue-100",
    gradientFrom: "from-blue-200/50",
    iconBg: "bg-blue-200/80",
    iconColor: "text-blue-600",
    titleColor: "text-blue-900",
    mutedColor: "text-blue-700/80",
  },
  warning: {
    border: "border-amber-200",
    background: "bg-amber-50",
    shadow: "shadow-amber-100",
    gradientFrom: "from-amber-200/50",
    iconBg: "bg-amber-200/80",
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
    mutedColor: "text-amber-700/80",
  },
};
