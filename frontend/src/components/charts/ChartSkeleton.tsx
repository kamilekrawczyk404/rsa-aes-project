import React, { type ReactNode } from "react";
import Container from "../../layouts/Container.tsx";

type ChartSkeletonProps = {
  children: ReactNode;
  icon: ReactNode;
  title: string;
  description: string;
  colorPalette: {
    icon: string;
  };
};

const ChartSkeleton = ({
  children,
  icon,
  title,
  description,
  colorPalette,
}: ChartSkeletonProps) => {
  return (
    <Container className="h-full flex flex-col !p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${colorPalette.icon}`}>{icon}</div>
        <div>
          <h3 className="font-bold text-slate-700">{title}</h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </Container>
  );
};

export default ChartSkeleton;
