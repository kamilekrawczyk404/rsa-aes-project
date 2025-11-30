import { type Algorithm, ALGORITHM_DEFS } from "../../types/crypto.ts";
import { GlobeLock, Shield, Zap } from "lucide-react";

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

export type AlgorithmCardProps<T extends number> = {
  algorithm: Algorithm;
  selectedValue: T;
  onChange: (newValue: T) => void;
  className?: string;
};

const AlgorithmCard = <T extends number>({
  algorithm,
  selectedValue,
  onChange,
  className,
}: AlgorithmCardProps<T>) => {
  const def = ALGORITHM_DEFS[algorithm];

  const currentIndex = def.keySizes.indexOf(selectedValue as never);
  const maxIndex = def.keySizes.length - 1;

  return (
    <article
      className={`relative overflow-hidden rounded-lg backdrop-blur-md border-[1px] border-slate-300 lg:p-6 p-4 transition-all flex flex-col gap-3 ${className}`}
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
              style={{ width: `${(currentIndex / maxIndex) * 100}%` }}
            />
          </div>

          <input
            type={"range"}
            min={0}
            max={maxIndex}
            step={1}
            value={currentIndex}
            onChange={(e) => {
              const newIndex = parseInt(e.target.value);
              const newValue = def.keySizes[newIndex];
              onChange(newValue as T);
            }}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          />

          <div className="absolute w-full flex justify-between pointer-events-none px-0.5">
            {def.keySizes.map((size, idx) => (
              <div
                key={size}
                className={`w-3 aspect-square rounded-full ring-2 ring-slate-100 ${
                  idx <= currentIndex ? "bg-blue-700" : "bg-slate-400"
                } ${idx === currentIndex ? "scale-150" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between mt-2">
          {def.keySizes.map((size) => (
            <span
              key={size}
              className={`text-xs cursor-pointer transition-all ${
                selectedValue === size
                  ? "scale-125 font-semibold text-blue-700"
                  : "text-slate-500"
              }`}
              onClick={() => onChange(size as T)}
            >
              {size}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
};

export default AlgorithmCard;
