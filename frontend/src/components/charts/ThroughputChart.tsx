import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartDataContext } from "../../context/ChartDataContext.tsx";
import ChartSkeleton from "./ChartSkeleton.tsx";
import Container from "../../layouts/Container.tsx";

const chartsColorPalette = {
  aes: "#3b82f6",
  rsa: "#f59e0b",
};

const ThroughputChart = memo(() => {
  const data = useChartDataContext();

  return (
    <ChartSkeleton
      icon={<Activity size={"1rem"} />}
      title={"Przepustowość"}
      description={"MB/s w czasie rzeczywistym"}
      colorPalette={{
        icon: "text-blue-700 bg-blue-100",
      }}
    >
      <div className="relative flex-1 min-h-[250px] h-full w-full">
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
                domain={[0, (dataMax: number) => Math.round(dataMax * 1.1)]}
                width={40}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: chartsColorPalette.rsa }}
                tickFormatter={(val) => `${val}`}
                tickLine={false}
                axisLine={false}
                domain={[0, (dataMax: number) => dataMax * 1.1]}
                width={40}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={24} iconType="plainline" />

              <Area
                yAxisId="left"
                type="monotone"
                dataKey="aes.throughput"
                name="AES"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAes)"
                isAnimationActive={false}
              />

              <Area
                yAxisId="right"
                type="monotone"
                dataKey="rsa.throughput"
                name="RSA"
                stroke="#f59e0b"
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
    </ChartSkeleton>
  );
});

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Container className={"text-xs !p-3"}>
        <p className="font-bold mb-1">Czas: {label}</p>
        {payload.map((entry: any) => (
          <p
            key={entry.name}
            style={{ color: entry.color }}
            className="font-mono"
          >
            {entry.name}: {entry.value.toFixed(2)} MB/s
          </p>
        ))}
      </Container>
    );
  }
  return null;
};

export default ThroughputChart;
