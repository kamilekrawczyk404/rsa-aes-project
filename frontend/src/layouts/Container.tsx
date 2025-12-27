import { type ComponentProps } from "react";

const Container = ({ children, className = "" }: ComponentProps<"div">) => {
  return (
    <div
      className={`relative border-slate-200 border-[1px] lg:p-6 p-4 rounded-lg bg-white shadow-sm transition-all ${className}`}
    >
      {children}
    </div>
  );
};

export default Container;
