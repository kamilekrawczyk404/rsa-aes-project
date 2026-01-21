import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { menuItems } from "../../App.tsx";
import { appearingVariants } from "../../framer/transitions.ts";
import { useNavigate } from "react-router-dom";
import Button from "../../components/button/Button.tsx";

const Hero = () => {
  const navigate = useNavigate();
  const variants = appearingVariants("up-up");
  const buttonsVariants = appearingVariants("up-up", true);

  return (
    <section className="relative bg-white border-b border-slate-200 overflow-hidden rounded-t-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 z-0" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-28 text-center">
        <motion.div
          variants={variants}
          initial={"initial"}
          animate={"animate"}
          exit={"exit"}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-500 text-blue-700 text-xs font-bold uppercase tracking-wide mb-6">
            Projekt - Inżynieria Oprogramowania
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            Aplikacja porównująca{" "}
            <span className="text-blue-700">wydajność</span> <br />
            algorytmów szyfrujących <br />
            <span className="text-blue-700">AES i RSA</span>
          </h1>
          <p className="text-md lg:text-xl text-slate-600 max-w-3xl mx-auto mb-10">
            Kompleksowe narzędzie do analizy, testowania i wizualizacji
            najpopularniejszych algorytmów szyfrujących (AES i RSA). Pomaga
            zrozumieć różnice w wydajności, bezpieczeństwie i zastosowaniu
            dzięki interaktywnym symulacjom.
          </p>
          <motion.div
            variants={buttonsVariants}
            initial={"initial"}
            animate={"animate"}
            exit={"exit"}
            className="flex justify-center sm:flex-row flex-col gap-4"
          >
            <Button.Process
              onClick={() => navigate(menuItems.configurator.link)}
            >
              <Play size={"1rem"} className={"mr-2"} />
              Rozpocznij Symulację
            </Button.Process>
            <Button.SecondaryButton
              onClick={() => {
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Dowiedz się więcej
            </Button.SecondaryButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
