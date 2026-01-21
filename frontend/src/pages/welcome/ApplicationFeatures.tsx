import React from "react";
import { ArrowRight, Cog, LayoutDashboard, Video } from "lucide-react";
import { menuItems } from "../../App.tsx";
import { useNavigate } from "react-router-dom";
import { type HTMLMotionProps, motion } from "framer-motion";
import { staggeredVariants } from "../../framer/transitions.ts";
import { AES_KEY_SIZES, AES_MODES } from "../../types/crypto.ts";
import MainPageTitleSection from "../../layouts/MainPageTitleSection.tsx";
import Button from "../../components/button/Button.tsx";
import { bannerStyles } from "../../components/banners/config.ts";

const ApplicationFeatures = () => {
  const { parent, children } = staggeredVariants();

  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-12">
      <MainPageTitleSection
        title={"Co oferuje aplikacja?"}
        description={
          "Aplikacja została podzielona na trzy główne moduły, z których każdy pozwala na inny aspekt analizy kryptograficznej."
        }
      />

      <motion.div
        variants={parent}
        initial={"initial"}
        whileInView={"animate"}
        exit={"exit"}
        className="grid md:grid-cols-3 gap-8"
      >
        <FeatureCard
          variants={children}
          title="Konfigurator"
          icon={<Cog size={32} />}
          link={menuItems.configurator.link}
          color="blue"
          description={`Serce naszej aplikacji. W tym miejscu możesz wczytać pliki różnych formatów oraz skonfigurować parametry algorytmów. Wybierz długość klucza (${AES_KEY_SIZES.join(
            "/",
          )} bity dla AES), tryb szyfrowania (${AES_MODES.join(
            ", ",
          )}) oraz wielkość klucza RSA.`}
        />
        <FeatureCard
          variants={children}
          title="Panel Główny"
          icon={<LayoutDashboard size={32} />}
          link={menuItems.dashboard.link}
          color="indigo"
          description="Centrum dowodzenia. To tutaj możesz obserwować w czasie rzeczywistym postęp szyfrowania wielu plików jednocześnie. Dostępne są wykresy przepustowości (MB/s) oraz zużycie procesora."
        />
        <FeatureCard
          variants={children}
          title="Obraz na Żywo"
          icon={<Video size={32} />}
          link={menuItems.encryptedWebcam.link}
          color="emerald"
          description="Interaktywna demonstracja wizualna. Zobacz na własne oczy, dlaczego tryb ECB jest niebezpieczny dla obrazów i jak szum cyfrowy powstaje w trybie CBC. Szyfrowanie strumienia wideo w locie."
        />
      </motion.div>
    </section>
  );
};

const FeatureCard = ({
  title,
  description,
  icon,
  link,
  color,
  ...props
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: "blue" | "indigo" | "emerald";
} & HTMLMotionProps<"div">) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 cursor-pointer flex flex-col h-full transition-[box-shadow]"
      onClick={() => navigate(link)}
      whileHover={{
        scale: 1.005,
        translateY: -5,
        transition: {
          duration: 0.3,
        },
      }}
      {...props}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors text-blue-600 group-hover:bg-blue-600 group-hover:text-white border ${bannerStyles.info.border} ${bannerStyles.info.background} `}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed mb-6 flex-1">
        {description}
      </p>
      <Button.SecondaryButton>
        Przejdź do sekcji <ArrowRight size={16} className="ml-2" />
      </Button.SecondaryButton>
    </motion.div>
  );
};

export default ApplicationFeatures;
