import { type ComponentProps, useRef } from "react";
import { Minus, Plus } from "lucide-react"; // Jeśli nie masz lucide-react, możesz użyć zwykłych SVG (kod poniżej)

type InputProps = ComponentProps<"input"> & {
  label: string; // Zmieniłem inputTitle na label (standard branżowy)
  error?: string;
};

const Input = ({
  label,
  onChange,
  value,
  className,
  disabled,
  onBlur,
  type = "text",
  ...props
}: InputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerChange = (newValue: number) => {
    const input = inputRef.current;
    if (!input) return;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, newValue);
      const event = new Event("input", { bubbles: true });
      input.dispatchEvent(event);
    }
  };

  const handleNumberChange = (direction: "increment" | "decrement") => {
    if (!inputRef.current || disabled) return;

    const input = inputRef.current;
    const step = Number(props.step) || 1;
    const min = props.min !== undefined ? Number(props.min) : -Infinity;
    const max = props.max !== undefined ? Number(props.max) : Infinity;

    let currentValue = Number(input.value) || 0;

    if (direction === "increment") {
      if (currentValue + step <= max) {
        triggerChange(currentValue + step);
      }
    } else {
      if (currentValue - step >= min) {
        triggerChange(currentValue - step);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) onBlur(e);

    if (type !== "number") return;

    const min = props.min !== undefined ? Number(props.min) : -Infinity;
    const max = props.max !== undefined ? Number(props.max) : Infinity;
    let val = Number(e.target.value);

    let fixedValue = val;
    if (val < min) fixedValue = min;
    if (val > max) fixedValue = max;

    if (val !== fixedValue) {
      triggerChange(fixedValue);
    }
  };

  return (
    <div className={`relative group ${className || ""}`}>
      <div
        className={`
        relative flex items-center w-full
        border rounded-lg bg-white
        transition-all duration-200 ease-in-out
        focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500
        ${
          props["aria-invalid"]
            ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
            : "border-slate-200 hover:border-slate-300"
        }
        ${disabled ? "bg-slate-50 opacity-60 cursor-not-allowed" : ""}
      `}
      >
        <input
          ref={inputRef}
          type={type}
          value={value}
          onBlur={handleBlur}
          onChange={onChange}
          disabled={disabled}
          placeholder=" "
          className={`
            peer w-full bg-transparent px-3 pt-3 h-12 
            outline-none font-medium placeholder-transparent
            disabled:cursor-not-allowed
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
          `}
          {...props}
        />

        <label
          className={`
            absolute left-4 top-1/2 -translate-y-1/2 
            text-slate-600 text-sm transition-all duration-200 pointer-events-none
            peer-focus:top-1 peer-focus:left-3 peer-focus:text-[10px] peer-focus:text-blue-500 peer-focus:-translate-y-0
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm
            peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:-translate-y-0
            ${
              props["aria-invalid"]
                ? "peer-focus:text-red-500 text-red-400"
                : ""
            }
          `}
        >
          {label}
        </label>

        {type === "number" && !disabled && (
          <div className="flex items-center pr-2 gap-1">
            <button
              type="button"
              onClick={() => handleNumberChange("decrement")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors active:scale-95"
              tabIndex={-1}
            >
              <Minus size={14} strokeWidth={3} />
            </button>
            <div className="w-[1px] h-4 bg-slate-200" />
            <button
              type="button"
              onClick={() => handleNumberChange("increment")}
              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors active:scale-95"
              tabIndex={-1}
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>

      {props["aria-invalid"] && (
        <p className="text-xs text-red-500 mt-1 ml-1">
          Wartość jest nieprawidłowa
        </p>
      )}
    </div>
  );
};

export default Input;
