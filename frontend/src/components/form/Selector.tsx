import { type ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { appearingVariants } from "../../framer/transitions.ts";
import { ChevronDown } from "lucide-react";

interface SelectorProps<T> {
  items: T[];
  onItemChange: (item: T) => any;
  renderItem: (item: T, withAnnotation: boolean) => ReactNode;
}
const Selector = <T extends unknown>({
  items,
  onItemChange,
  renderItem,
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
    <div ref={selectorRef} className={"relative !z-10"}>
      <SelectorItem
        onClick={() => setIsOpen(!isOpen)}
        isSelected={false}
        displayAs={"selected"}
      >
        {renderItem(items[selectedIndex], false)}
        <span
          className={`inline-block transition-transform duration-200 text-slate-500 ${
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
              "!z-1000 bg-white absolute left-0 top-[calc(100%+.5rem)] flex flex-col gap-1 max-h-72 overflow-y-auto shadow-md rounded-lg p-1"
            }
          >
            {items.map((item, index) => (
              <SelectorItem
                key={index}
                onClick={() => {
                  setSelectedIndex(index);
                  onItemChange(item);
                }}
                isSelected={index === selectedIndex}
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
}: {
  onClick: () => any;
  children: ReactNode;
  isSelected: boolean;
  displayAs?: "dropdown" | "selected";
}) => {
  return (
    <div
      onClick={onClick}
      className={`transition-all p-2 rounded-md select-none ${
        isSelected && displayAs === "dropdown"
          ? "bg-blue-500/15 text-blue-700 font-semibold shadow-sm md:min-w-96 w-full"
          : "bg-white"
      } ${
        displayAs === "dropdown"
          ? "hover:bg-blue-500/15 hover:text-blue-700 "
          : "flex items-center justify-between bg-white shadow-sm rounded-lg w-full"
      }`}
    >
      {children}
    </div>
  );
};
export default Selector;
