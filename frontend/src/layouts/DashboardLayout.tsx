import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar.tsx";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { defaultTransition } from "../framer/transitions.ts";
import useIsMobile from "../hooks/useIsMobile.ts";
import { useModal } from "../context/ModalContext.tsx";

const DashboardLayout = () => {
  const { closeAllModals } = useModal();
  const isMobile = useIsMobile();

  const location = useLocation();
  const [isWide, setIsWide] = useState(true);

  const shouldBeWide = !isMobile && isWide;

  useEffect(() => {
    closeAllModals();
  }, [closeAllModals, location.pathname]);

  return (
    <div className={"relative min-h-screen tracking-tight !w-screen"}>
      <Sidebar handleWidthState={{ isWide: shouldBeWide, setIsWide }} />

      <motion.main
        initial={false}
        animate={{
          marginLeft: shouldBeWide ? "17rem" : isMobile ? "0" : "4.75rem",
        }}
        transition={defaultTransition(shouldBeWide)}
        className={
          "relative sm:p-3 p-2 h-[calc(100dvh)] min-w-[calc(100vw-18rem)] flex sm:mt-0 mt-16"
        }
      >
        <Outlet />
      </motion.main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neon-aes/5 via-background to-background"></div>
    </div>
  );
};

export default DashboardLayout;
