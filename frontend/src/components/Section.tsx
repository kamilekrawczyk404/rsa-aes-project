import { type ComponentProps, type ReactNode } from "react";
import { motion } from "framer-motion";
import { appearingVariants } from "../framer/transitions.ts";

const variants = appearingVariants();

type SectionProps = ComponentProps<"section"> & {
  title: string;
  description?: string | null;
  action?: ReactNode;
};

const Section = ({
  title,
  className,
  children,
  description = null,
  action,
}: SectionProps) => {
  return (
    <section
      className={`flex flex-col bg-slate-50 flex-1 lg:gap-8 gap-4 rounded-lg overflow-y-scroll sm:p-8 p-4 ${className}`}
    >
      <motion.div
        variants={variants}
        initial={"initial"}
        animate={"animate"}
        exit={"exit"}
        className={"space-y-1 z-10 bg-slate-50 block w-full max-w-6xl mx-auto"}
      >
        <h2 className={"text-2xl"}>{title}</h2>
        {description && (
          <p className={"text-slate-600 max-w-prose leading-6"}>
            {description}
          </p>
        )}
      </motion.div>

      <motion.div
        variants={variants}
        initial={"initial"}
        animate={"animate"}
        exit={"exit"}
        className={
          "flex flex-col lg:gap-8 gap-4 basis-full max-w-6xl w-full mx-auto"
        }
      >
        {children}
      </motion.div>

      {action && <div className={"flex max-w-7xl"}>{action}</div>}
    </section>
  );
};

export default Section;
