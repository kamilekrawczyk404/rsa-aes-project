import MainPageTitleSection from "../../layouts/MainPageTitleSection.tsx";
import {
  Cpu,
  FileKey,
  GlobeLock,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { AES_KEY_SIZES, RSA_KEY_SIZES } from "../../types/crypto.ts";
import { appearingVariants } from "../../framer/transitions.ts";

const AlgorithmsDescription = () => {
  const variants = appearingVariants("up-up", true);

  return (
    <section className="bg-white py-20 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <MainPageTitleSection
          title={"Jak działają algorytmy"}
          description={
            "Przejrzyj krótki wstęp opisujący jak działają dwa fundamenty nowoczesnego bezpieczeństwa sieciowego."
          }
        />

        <div className="space-y-24">
          {/*AES SECTION*/}
          <motion.div
            viewport={{ once: true }}
            variants={variants}
            initial={"initial"}
            whileInView={"animate"}
            exit={"exit"}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 text-blue-700 font-bold mb-4">
                <Cpu size={"1rem"} /> Algorytm Symetryczny
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                AES (Advanced Encryption Standard)
              </h3>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  AES to światowy standard szyfrowania danych. Jest algorytmem{" "}
                  <strong>symetrycznym</strong>, co oznacza, że ten sam klucz
                  służy do szyfrowania i deszyfrowania.
                </p>
                <p>
                  <strong>Zasada działania:</strong> AES dzieli dane na bloki
                  (zazwyczaj 128-bitowe). Następnie w wielu rundach (10, 12 lub
                  14) wykonuje operacje podstawiania, przesuwania wierszy i
                  mieszania kolumn. Dzięki temu jest niezwykle szybki i wydajny
                  procesorowo.
                </p>
                <ul className="list-disc list-inside space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <li>Klucze: {AES_KEY_SIZES.join(", ")} bitów</li>
                  <li>Wysoka wydajność (idealny do dużych plików)</li>
                  <li>Wymaga bezpiecznego przekazania klucza</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-center">
              <AesAnimation />
            </div>
          </motion.div>

          {/* RSA SECTION */}
          <motion.div
            viewport={{ once: true }}
            variants={variants}
            initial={"initial"}
            whileInView={"animate"}
            exit={"exit"}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="flex justify-center sm:order-1 order-2">
              <RsaAnimation />
            </div>
            <div className={"sm:order-2 order-1"}>
              <div className="inline-flex items-center gap-2 text-blue-700 font-bold mb-4">
                <GlobeLock size={20} /> Algorytm Asymetryczny
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                RSA (Rivest–Shamir–Adleman)
              </h3>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  RSA opiera się na trudności matematycznej faktoryzacji dużych
                  liczb pierwszych. Jest algorytmem{" "}
                  <strong>asymetrycznym</strong> – wykorzystuje parę kluczy.
                </p>
                <p>
                  <strong>Klucz Publiczny:</strong> Dostępny dla każdego, służy
                  do szyfrowania wiadomości.
                  <br />
                  <strong>Klucz Prywatny:</strong> Tajny, służy do
                  odszyfrowania.
                </p>
                <p>
                  Ze względu na złożoność obliczeniową, RSA jest znacznie
                  wolniejszy od AES. Zazwyczaj używa się go tylko do bezpiecznej
                  wymiany klucza AES (tzw. koperta cyfrowa).
                </p>
                <ul className="list-disc list-inside space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <li>Klucze: {RSA_KEY_SIZES.join(", ")} bitów</li>
                  <li>Bezpieczna wymiana danych bez uzgadniania hasła</li>
                  <li>Wysokie obciążenie CPU</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const AesAnimation = () => {
  return (
    <div className="relative w-80 h-64 bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center overflow-hidden shadow-inner">
      <div className="absolute top-4 left-4 text-xs font-mono text-slate-400">
        Proces szyfrowania AES
      </div>

      <div className="flex gap-2 mb-12 z-[10]">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-12 h-12 bg-blue-200 rounded-md border border-blue-300 flex items-center justify-center text-xs text-blue-800"
            animate={{
              y: [0, 10, 0],
              backgroundColor: ["#bfdbfe", "#3b82f6", "#bfdbfe"],
              color: ["#1e40af", "#ffffff", "#1e40af"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          >
            BLOK {i}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg shadow-lg z-10"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <KeyRound size={18} />
        <span className="text-sm font-bold">Wspólny Klucz</span>
      </motion.div>

      <svg className="absolute translate-y-[10%] w-full h-full pointer-events-none opacity-20">
        <motion.path
          d="M 160 140 L 100 80 M 160 140 L 160 80 M 160 140 L 220 80"
          stroke="black"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>
    </div>
  );
};

const RsaAnimation = () => {
  return (
    <div className="relative w-80 h-72 bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center justify-between px-8 overflow-hidden shadow-inner">
      <div className="absolute top-4 left-4 text-xs font-mono text-slate-400">
        Proces szyfrowania RSA
      </div>

      <div className="flex flex-col items-center gap-2 z-10">
        <FileKey size={"1.5rem"} className="text-slate-400" />
        <motion.div
          className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg"
          title="Klucz Publiczny"
          animate={{
            scale: [1, 1.2, 1],
            boxShadow: [
              "0px 0px 0px rgba(16, 185, 129, 0)",
              "0px 0px 20px rgba(16, 185, 129, 0.5)",
              "0px 0px 0px rgba(16, 185, 129, 0)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <LockKeyhole size={18} />
        </motion.div>
        <span className="text-xs uppercase font-bold text-slate-600">
          Publiczny
        </span>
      </div>

      <motion.div
        className={`h-1 rounded-full absolute translate-y-[100%] left-20 right-20 bg-blue-200`}
        initial={{ opacity: 0.5 }}
      >
        <motion.div
          className="w-8 h-8 bg-white border-2 border-blue-500 rounded-md absolute -translate-x-1/2 -translate-y-[45%] flex items-center justify-center"
          animate={{ marginLeft: ["0%", "100%", "0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-4 h-1 bg-blue-200 rounded-full" />
        </motion.div>
      </motion.div>

      <div className="flex flex-col items-center gap-2 z-10">
        <ShieldCheck size={"1.5rem"} className="text-slate-400" />
        <motion.div
          className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg"
          title="Klucz Prywatny"
          animate={{
            scale: [1, 1.2, 1],
            boxShadow: [
              "0px 0px 0px rgba(16, 185, 129, 0)",
              "0px 0px 20px rgba(16, 185, 129, 0.5)",
              "0px 0px 0px rgba(16, 185, 129, 0)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <KeyRound size={18} />
        </motion.div>
        <span className="text-xs uppercase font-bold text-slate-600">
          Prywatny
        </span>
      </div>
    </div>
  );
};

export default AlgorithmsDescription;
