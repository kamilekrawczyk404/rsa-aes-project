import { motion } from "framer-motion";
import TextSlider from "../texts/TextSlider.tsx";
import { defaultTransition } from "../../framer/transitions.ts";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: {
    active: string;
    inactive: string;
  };
  disabled?: boolean;
}

const Switch = ({
  checked,
  onChange,
  label,
  description,
  disabled,
}: SwitchProps) => {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      {(label || description) && (
        <div
          className="flex flex-col cursor-pointer relative"
          onClick={() => !disabled && onChange(!checked)}
        >
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <TextSlider
            className={"text-xs text-slate-500"}
            texts={{
              hidden: description.inactive,
              shown: description.active,
            }}
            trigger={!checked}
          />
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
          ${checked ? "bg-blue-600" : "bg-slate-200"}
        `}
      >
        <span className="sr-only">Use setting</span>
        <motion.span
          layout
          transition={{ ...defaultTransition() }}
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 
            transition duration-200 ease-in-out
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
};

export default Switch;
