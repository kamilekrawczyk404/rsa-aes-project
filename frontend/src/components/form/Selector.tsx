import { type ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { appearingVariants } from "../../framer/transitions.ts";
import { ChevronDown } from "lucide-react";

interface SelectorProps<T> {
  items: T[];
  onItemChange: (item: T) => any;
  renderItem: (item: T, withAnnotation: boolean) => ReactNode;
  disabled?: boolean;
}
const Selector = <T extends unknown>({
  items,
  onItemChange,
  renderItem,
  disabled = false,
}: SelectorProps<T>) => {
  const selectorRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const variants = appearingVariants("down-up");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectorRef.current &&
        !(selectorRef.current as unknown as HTMLElement).contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectorRef]);

  return (
    <div
      ref={selectorRef}
      className={`relative !z-[100] transition-colors ${
        disabled ? "disabled:opacity-75 cursor-not-allowed" : ""
      }`}
    >
      <SelectorItem
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        isSelected={false}
        displayAs={"selected"}
        disabled={disabled}
      >
        {renderItem(items[selectedIndex], false)}
        <span
          className={`inline-block transition-transform duration-200 text-slate-600 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDown size={"1rem"} />
        </span>
      </SelectorItem>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={variants}
            initial={"initial"}
            animate={"animate"}
            exit={"exit"}
            className={
              "!z-1000 bg-white absolute left-0 top-[calc(100%+.5rem)] flex flex-col max-h-72 overflow-y-auto shadow-md rounded-lg p-2"
            }
          >
            {items.map((item, index) => (
              <SelectorItem
                key={index}
                isSelected={index === selectedIndex}
                disabled={disabled}
                onClick={() => {
                  setSelectedIndex(index);
                  onItemChange(item);
                }}
              >
                {renderItem(item, true)}
              </SelectorItem>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SelectorItem = ({
  onClick,
  isSelected,
  children,
  displayAs = "dropdown",
  disabled = false,
}: {
  onClick: () => any;
  children: ReactNode;
  isSelected: boolean;
  displayAs?: "dropdown" | "selected";
  disabled?: boolean;
}) => {
  return (
    <div
      onClick={onClick}
      className={`transition-all p-2 rounded-md select-none border-[1px] ${
        disabled ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
      } ${
        isSelected && displayAs === "dropdown"
          ? "bg-blue-100 text-blue-700 font-semibold shadow-sm md:min-w-96 w-full border-blue-200"
          : `bg-white border-transparent`
      } ${
        displayAs === "dropdown"
          ? ""
          : `flex items-center justify-between bg-white rounded-lg w-full !border-slate-200`
      }`}
    >
      {children}
    </div>
  );
};
export default Selector;
