import type { AesMode } from "./crypto.ts";
import type { ReactNode } from "react";
import { Copy, Link, Radio, RefreshCcw, Zap } from "lucide-react";

export type AesDetails = {
  label: string;
  description: string;
  icon: ReactNode;
  isSecure: boolean;
};

export type AesModeDetails = {
  [K in AesMode]: AesDetails;
};

export const AES_MODE_DETAILS: AesModeDetails = {
  ECB: {
    label: "Electronic Codebook",
    description:
      "Najprostszy tryb. Każdy blok szyfrowany jest niezależnie. Niebezpieczny dla obrazów i tekstu, ponieważ identyczne dane wejściowe tworzą identyczny szyfrogram (widać wzorce).",
    icon: <Copy size="1.2em" />,
    isSecure: false,
  },
  CBC: {
    label: "Cipher Block Chaining",
    description:
      "Każdy blok zależy od poprzedniego (tworzy łańcuch). Wymaga wektora inicjującego (IV). Bezpieczny standard, ale nie pozwala na szyfrowanie równoległe (wolniejszy).",
    icon: <Link size={"1.2em"} />,
    isSecure: true,
  },
  CFB: {
    label: "Cipher Feedback",
    description:
      "Zmienia szyfr blokowy w strumieniowy. Dane są szyfrowane przy użyciu sprzężenia zwrotnego z poprzedniego szyfrogramu. Przydatny w transmisji strumieniowej.",
    icon: <RefreshCcw size="1.2em" />,
    isSecure: true,
  },
  OFB: {
    label: "Output Feedback",
    description:
      "Generuje strumień klucza niezależnie od treści wiadomości. Błędy w transmisji nie wpływają na odszyfrowanie reszty pliku (brak propagacji błędów).",
    icon: <Radio size="1.2em" />,
    isSecure: true,
  },
  CTR: {
    label: "Counter",
    description:
      "Wykorzystuje licznik do generowania strumienia klucza. Pozwala na pełną wielowątkowość (szyfrowanie równoległe), dzięki czemu jest bardzo szybki i bezpieczny.",
    icon: <Zap size="1.2em" />,
    isSecure: true,
  },
};
