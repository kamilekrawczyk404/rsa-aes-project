import React from "react";
import { Bolt } from "lucide-react";
import Container from "./Container.tsx";

interface ComponentContainerProps {
  title: string;
  description: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}
const ComponentContainer = ({
  title,
  description,
  children,
  icon = <Bolt size={"1rem"} />,
  className = "",
}: ComponentContainerProps) => {
  return (
    <Container className={className}>
      <section className="flex items-center gap-2 border-b-[1px] border-slate-200 p-4">
        <div className={`p-2 rounded-lg bg-blue-100 text-blue-700`}>{icon}</div>
        <div>
          <h3 className="font-bold text-slate-700">{title}</h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </section>
      {children}
    </Container>
  );
};

export default ComponentContainer;
