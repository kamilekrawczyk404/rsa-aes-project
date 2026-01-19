import { useEffect, useState } from "react";
import { Pause, SkipForward } from "lucide-react";
import type { PopupProps } from "./Popup.tsx";
import { bannerStyles } from "./config.ts";

export interface AutoSwitchBodyProps {
  popup: Omit<PopupProps, "id" | "position">;
  onNext: () => void;
  onCancel: () => void;
  seconds?: number;
}

const AutoSwitchBody = ({
  onNext,
  onCancel,
  seconds = 5,
}: AutoSwitchBodyProps) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft === 0) {
      onNext();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onNext]);

  return (
    <div className="flex flex-col gap-2">
      <div className={`text-xs ${bannerStyles.success.mutedColor}`}>
        Automatyczne przejście do następnego pliku nastąpi za
        <span className={"font-semibold"}> {timeLeft}s</span>
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={onCancel}
          className="rounded-md text-white transition-colors bg-neutral-500 inline-flex items-center gap-1 px-2 py-1 text-sm"
          title="Dalej natychmiast"
        >
          <Pause size={"1rem"} />
          Anuluj
        </button>
        <button
          onClick={onNext}
          className={`rounded-md text-white transition-colors inline-flex items-center gap-1 px-2 py-1 text-sm bg-emerald-500`}
          title="Dalej natychmiast"
        >
          <SkipForward size={"1rem"} />
          Następny plik
        </button>
      </div>
    </div>
  );
};

export default AutoSwitchBody;
