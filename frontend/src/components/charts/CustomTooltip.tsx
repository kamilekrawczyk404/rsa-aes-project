import Container from "../../layouts/Container.tsx";
import { formatBytes } from "../../utils/formatters.ts";

const CustomTooltip = ({ active, payload, label, unit }: any) => {
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
            {entry.name}:{" "}
            {unit === "(%)" ? entry.value + "(%)" : formatBytes(entry.value)}
          </p>
        ))}
      </Container>
    );
  }
  return null;
};

export default CustomTooltip;
