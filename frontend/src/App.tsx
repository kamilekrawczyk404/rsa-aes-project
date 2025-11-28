import "./App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import React from "react";
import { Cog, House } from "lucide-react";
import DashboardLayout from "./layouts/DashboardLayout.tsx";
import Welcome from "./pages/Welcome.tsx";
import Configurator from "./pages/Configurator.tsx";

type MenuItem = {
  label: string;
  link: string;
  icon: React.ReactNode;
  element: React.ReactNode;
};

export const menuItems: { [T in string]: MenuItem } = {
  welcome: {
    link: "/",
    label: "O programie",
    icon: <House />,
    element: <Welcome />,
  },
  configurator: {
    link: "/configurator",
    label: "Konfigurator",
    icon: <Cog />,
    element: <Configurator />,
  },
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={"/"} element={<DashboardLayout />}>
          {Object.entries(menuItems).map(([key, item]) => (
            <Route
              key={key}
              index={key === "welcome"}
              path={item.link.substring(1)}
              element={item.element}
            />
          ))}
          <Route path={"*"} element={<Navigate to={"/"} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
