import React from "react";
import { GlobeLock, PanelRightOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { menuItems } from "../App.tsx";
import { motion } from "framer-motion";
import { defaultTransition } from "../framer/transitions.ts";

type SidebarProps = {
  handleWidthState: {
    isWide: boolean;
    setIsWide: React.Dispatch<React.SetStateAction<boolean>>;
  };
};

const Sidebar = ({ handleWidthState: { isWide, setIsWide } }: SidebarProps) => {
  return (
    <motion.aside
      initial={false}
      animate={{ width: isWide ? "16rem" : "4rem" }}
      transition={{
        duration: 0.3,
        ...defaultTransition(isWide),
      }}
      className={
        "h-[calc(100dvh-1rem)] fixed left-0 top-0 bg-slate-50 flex flex-col z-10 gap-4 m-3 rounded-lg overflow-hidden"
      }
    >
      <div className={"flex gap-4 justify-between items-center w-full p-3"}>
        <div className={"flex items-center gap-3"}>
          <button
            className={
              "bg-blue-700 min-w-10 aspect-square rounded-full place-content-center shadow-xl"
            }
            onClick={() => setIsWide(true)}
          >
            <GlobeLock className={"text-slate-100 mx-auto"} />
          </button>
          <motion.h1
            initial={false}
            animate={{ opacity: isWide ? 1 : 0 }}
            transition={defaultTransition(isWide)}
            className={"font-semibold text-2xl text-nowrap"}
          >
            AES & RSA
          </motion.h1>
        </div>
        <motion.button
          initial={false}
          animate={{ opacity: isWide ? 1 : 0 }}
          transition={defaultTransition(isWide)}
          onClick={() => setIsWide(!isWide)}
        >
          <PanelRightOpen size={"1.25rem"} />
        </motion.button>
      </div>
      <div className={"relative flex flex-col gap-2"}>
        {Object.entries(menuItems).map(([key, item]) => (
          <SideBarLink
            key={key}
            title={item.label}
            icon={item.icon}
            to={item.link}
            isWide={isWide}
          />
        ))}
      </div>
    </motion.aside>
  );
};

type SideBarLinkProps = {
  to: string;
  title: string;
  icon: React.ReactNode;
  isWide: boolean;
};

const SideBarLink = ({ to, title, icon, isWide }: SideBarLinkProps) => {
  const location = useLocation();

  return (
    <Link
      to={to.substring(1)}
      className={`relative group h-10 flex items-center ${
        to === location.pathname ? "" : "text-slate-700"
      }`}
    >
      <motion.span
        initial={false}
        animate={{
          marginLeft: to === location.pathname ? "1rem" : ".5rem",
        }}
        className={`inline-flex font-[500] group-hover:text-blue-700 rounded-md gap-2 h-full text-nowrap items-center transition-colors mr-2 px-2 ${
          to === location.pathname ? "text-blue-700" : ""
        }`}
      >
        {icon}
        <motion.span
          initial={false}
          animate={{
            opacity: isWide ? 1 : 0,
            display: isWide ? "inline" : "none",
          }}
          transition={defaultTransition(isWide)}
        >
          {title}
        </motion.span>
      </motion.span>
      {to === location.pathname && (
        <motion.span
          layoutId={"active-link-indicator"}
          className={
            "bg-blue-700 w-2 rounded-r-md h-full absolute left-0 top-0"
          }
        />
      )}
    </Link>
  );
};

export default Sidebar;
