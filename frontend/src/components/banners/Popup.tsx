import { useEffect, type ReactNode } from "react";
import {
  FADE_OUT_TIMEOUT,
  MAX_DISPLAYED_POPUPS,
  usePopups,
} from "../../context/PopUpContext.tsx";
import Button from "../button/Button.tsx";
import { type BannerType, iconMap } from "./types.ts";
import { X } from "lucide-react";
import { bannerStyles } from "./config.ts";
import { motion } from "framer-motion";

const SCALING_DOWN = 0.05;
const Y_OFFSET = 12;

export interface PopupProps {
  id: string;
  position: number;
  title: string;
  description?: string;
  body?: ReactNode;
  type?: BannerType;
  fadeOut?: boolean;
}

const Popup = ({
  id,
  title,
  description,
  body,
  fadeOut,
  position,
  type = "info",
}: PopupProps) => {
  const { closePopup } = usePopups();

  const styling = bannerStyles[type];
  const IconComponent = iconMap[type];

  useEffect(() => {
    if (fadeOut) {
      const timeout = setTimeout(() => {
        closePopup(id);
      }, FADE_OUT_TIMEOUT);

      return () => clearTimeout(timeout);
    }
  }, [fadeOut, closePopup, id]);

  return (
    <motion.div
      initial={{
        translateY: "100%",
        opacity: 0,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        translateY: 0 - Y_OFFSET * position,
        scale: 1 - SCALING_DOWN * position,
        zIndex: MAX_DISPLAYED_POPUPS - position,
      }}
      exit={{
        opacity: 0,
        translateY: "100%",
        scale: 0.95 - SCALING_DOWN * position,
      }}
      transition={{
        opacity: { delay: 0.1 },
        duration: 0.1,
        type: "tween",
      }}
      style={{
        zIndex: MAX_DISPLAYED_POPUPS - position,
        position: "absolute",
        bottom: 0,
        right: 0,
      }}
      className={`overflow-hidden sm:w-96 w-[calc(100vw-2rem)] rounded-lg border shadow-sm p-3 flex transition-all duration-300 flex-col
        ${styling.border} ${styling.background} ${styling.shadow}
        ${fadeOut ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}
      `}
      role="alert"
    >
      <div
        className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${styling.gradientFrom} to-transparent opacity-60`}
      />

      <div className={"flex gap-3"}>
        <div className="flex-shrink-0 relative">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${styling.iconBg}`}
          >
            <IconComponent className={`h-5 w-5 ${styling.iconColor}`} />
          </div>
        </div>

        {/* Treść */}
        <div className="flex-1 flex flex-col relative min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h6
              className={`font-semibold text-sm leading-tight pt-0.5 ${styling.titleColor}`}
            >
              {title}
            </h6>
            <Button.Close
              onClick={() => closePopup(id)}
              className={`${styling.mutedColor} hover:text-slate-900 transition-colors`}
            >
              <X />
            </Button.Close>
          </div>

          {description && (
            <p className={`text-xs mt-1 ${styling.mutedColor} break-words`}>
              {description}
            </p>
          )}
        </div>

        {/* Custom Body (np. przyciski akcji) */}
      </div>
      {body && <div className="mt-3 w-full">{body}</div>}
    </motion.div>
  );
};

export default Popup;
