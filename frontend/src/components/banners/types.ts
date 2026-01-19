import { AlertCircle, CheckCircle2, Info, type LucideIcon } from "lucide-react";

export type BannerType = "success" | "error" | "info" | "warning";

export const iconMap: Record<BannerType, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};

export interface PopupStyleConfig {
  border: string;
  background: string;
  shadow: string;
  gradientFrom: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  mutedColor: string;
}
