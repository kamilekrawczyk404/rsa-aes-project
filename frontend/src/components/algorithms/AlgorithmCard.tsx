import {
  type AesMode,
  type Algorithm,
  ALGORITHM_DEFS,
} from "../../types/crypto.ts";
import { GlobeLock, Shield, Zap } from "lucide-react";
import Selector from "../form/Selector.tsx";
import { type ReactNode } from "react";
import type { AesDetails } from "../../types/modes.tsx";

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
  className?: string;
};

const AlgorithmCard = ({
  algorithm,
  keySizes,
  onKeySizeChange,
  renderSelectorItem,
  onModeChange,
  className = "",
  modes = [],
}: AlgorithmCardProps) => {
  const def = ALGORITHM_DEFS[algorithm];

  // const [config, setConfig] = useState<{ size: number; mode: any }>({
  //   size: keySizes[0],
  //   mode: modes[0],
  // });

  const currentKeyIndex = def.keySizes.indexOf(keySizes[0] as never);
  const maxKeyIndex = def.keySizes.length - 1;

  return (
    <article
      className={`relative rounded-lg border-[1px] border-slate-300 lg:p-6 p-4 transition-all flex flex-col gap-3 basis-1/2 ${className}`}
    >
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
          <div className="absolute w-full h-0.5 rounded-full overflow-hidden bg-slate-300">
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
                className={`w-3 aspect-square rounded-full ring-2 ring-slate-100 ${
                  idx <= currentKeyIndex ? "bg-blue-700" : "bg-slate-400"
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
        <div className={"flex flex-col w-full"}>
          <div className={"flex items-center gap-2"}>
            <span className={"inline-block text-sm mb-2"}>Tryb algorytmu</span>
          </div>

          <Selector
            items={modes}
            renderItem={renderSelectorItem!}
            onItemChange={onModeChange!}
          />
        </div>
      )}
    </article>
  );
};

export default AlgorithmCard;
