import {
  type AesMode,
  type Algorithm,
  ALGORITHM_DEFS,
} from "../../types/crypto.ts";
import { GlobeLock, Shield, Zap } from "lucide-react";
import Selector from "../form/Selector.tsx";
import { type ReactNode } from "react";
import type { AesDetails } from "../../types/modes.tsx";
import Container from "../../layouts/Container.tsx";

const getAlgorithmIcon = (type: Algorithm) => {
  switch (type) {
    case "AES":
      return <Zap />;
    case "RSA":
      return <Shield />;
    default:
      return <GlobeLock />;
  }
};

export type AlgorithmCardProps = {
  algorithm: Algorithm;
  keySizes: number[];
  onKeySizeChange: (newSize: number) => void;
  modes?: (AesDetails & { mode: AesMode })[];
  onModeChange?: (newMode: AesDetails & { mode: AesMode }) => any;
  renderSelectorItem?: (
    item: AesDetails & { mode: AesMode },
    withAnnotation: boolean,
  ) => ReactNode;
};

const AlgorithmCard = ({
  algorithm,
  keySizes,
  onKeySizeChange,
  renderSelectorItem,
  onModeChange,
  modes = [],
}: AlgorithmCardProps) => {
  const def = ALGORITHM_DEFS[algorithm];

  const currentKeyIndex = def.keySizes.indexOf(keySizes[0] as never);
  const maxKeyIndex = def.keySizes.length - 1;

  return (
    <Container>
      <div
        className={`absolute left-0 inset-y-2 w-2 bg-blue-700 rounded-r-lg`}
      />

      <div className="space-y-1 lg:ml-0 ml-1">
        <div className={"flex gap-2 flex-1 items-center"}>
          <div>{getAlgorithmIcon(def.id)}</div>
          <h3 className={`text-xl font-bold`}>{def.name}</h3>
        </div>
        <p className="text-sm text-slate-500 mt-1 pr-4">{def.description}</p>
      </div>

      <div className={"lg:ml-0 ml-1"}>
        <span className={"inline-block text-sm mb-2"}>Siła klucza</span>

        <div className="relative w-full flex items-center h-4">
          <div className="absolute w-full h-0.5 rounded-full overflow-hidden bg-slate-200">
            <div
              className={`h-full transition-all bg-blue-700`}
              style={{ width: `${(currentKeyIndex / maxKeyIndex) * 100}%` }}
            />
          </div>

          <input
            type={"range"}
            min={0}
            max={maxKeyIndex}
            step={1}
            value={currentKeyIndex}
            onChange={(e) => {
              const newIndex = parseInt(e.target.value);
              const newValue = def.keySizes[newIndex];
              onKeySizeChange(newValue);
            }}
            className="absolute w-full h-full opacity-0 cursor-pointer"
          />

          <div className="absolute w-full flex justify-between pointer-events-none px-0.5">
            {def.keySizes.map((size, idx) => (
              <div
                key={size}
                className={`w-3 aspect-square rounded-full ring-2 ring-white ${
                  idx <= currentKeyIndex ? "bg-blue-700" : "bg-slate-200"
                } ${idx === currentKeyIndex ? "scale-150" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between mt-2">
          {def.keySizes.map((size) => (
            <span
              key={size}
              className={`text-xs cursor-pointer transition-all ${
                keySizes[currentKeyIndex] === size
                  ? "scale-125 font-semibold text-blue-700"
                  : "text-slate-500"
              }`}
              onClick={() => onKeySizeChange(size)}
            >
              {size}
            </span>
          ))}
        </div>
      </div>

      {modes.length > 0 && (
        <div className={"flex flex-col w-full mt-4"}>
          <span className={"inline-block text-sm mb-1"}>Tryb algorytmu</span>

          <Selector
            items={modes}
            renderItem={renderSelectorItem!}
            onItemChange={onModeChange!}
          />
        </div>
      )}
    </Container>
  );
};

export default AlgorithmCard;
