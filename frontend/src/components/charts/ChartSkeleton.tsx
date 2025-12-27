import { type ReactNode } from "react";
import Container from "../../layouts/Container.tsx";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import CustomTooltip from "./CustomTooltip.tsx";

const chartsColorPalette = {
  aes: "#3b82f6",
  rsa: "#f59e0b",
  icon: "text-blue-700 bg-blue-100",
};

type ChartSkeletonProps = {
  icon: ReactNode;
  title: string;
  description: string;
  data: any;
  keys: {
    aes: string;
    rsa: string;
  };
  unit: string;
};

const ChartSkeleton = ({
  icon,
  title,
  description,
  data,
  keys,
  unit,
}: ChartSkeletonProps) => {
  return (
    <Container className="h-full flex flex-col !p-0 max-h-[350px]">
      <div className="flex items-center gap-2 mb-4 border-b-[1px] border-slate-200 p-4">
        <div className={`p-2 rounded-lg ${chartsColorPalette.icon}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-700">{title}</h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <div className="relative flex-1 min-h-[250px] h-full w-full p-4">
        <div className={"absolute inset-0"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAes" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartsColorPalette.aes}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartsColorPalette.aes}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="colorRsa" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartsColorPalette.rsa}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartsColorPalette.rsa}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fontSize: 10, fill: chartsColorPalette.aes }}
                tickFormatter={(val) => `${val}`}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
                width={40}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: chartsColorPalette.rsa }}
                tickFormatter={(val) => `${val}`}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
                width={40}
              />

              <Tooltip content={<CustomTooltip unit={unit} />} />
              <Legend verticalAlign="top" height={24} iconType="plainline" />

              <Area
                yAxisId="left"
                type="monotone"
                dataKey={keys.aes}
                name="AES"
                stroke={chartsColorPalette.aes}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAes)"
                isAnimationActive={false}
              />

              <Area
                yAxisId="right"
                type="monotone"
                dataKey={keys.rsa}
                name="RSA"
                stroke={chartsColorPalette.rsa}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRsa)"
                isAnimationActive={false}
              />

              {/*<Brush*/}
              {/*  dataKey="time"*/}
              {/*  height={30}*/}
              {/*  stroke="#cbd5e1" // Kolor ramki suwaka (szary)*/}
              {/*  fill="#f8fafc" // Tło suwaka*/}
              {/*  tickFormatter={() => ""} // Ukrywamy tekst wewnątrz suwaka dla czystości*/}
              {/*  travellerWidth={10} // Szerokość uchwytów*/}
              {/*/>*/}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Container>
  );
};

export default ChartSkeleton;
