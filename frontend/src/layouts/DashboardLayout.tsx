import React, { useState } from "react";
import Sidebar from "../components/Sidebar.tsx";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { defaultTransition } from "../framer/transitions.ts";

const DashboardLayout = () => {
  const [isWide, setIsWide] = useState(true);

  return (
    <div className={"min-h-screen tracking-tight bg-slate-300/50 !w-screen"}>
      <Sidebar handleWidthState={{ isWide, setIsWide }} />
      <motion.main
        initial={false}
        animate={{ marginLeft: isWide ? "17rem" : "5rem" }}
        transition={defaultTransition(isWide)}
        className={"p-3 min-h-screen min-w-[calc(100vw-18rem)]"}
      >
        <Outlet />
      </motion.main>
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neon-aes/5 via-background to-background"></div>
    </div>
  );
};

export default DashboardLayout;
