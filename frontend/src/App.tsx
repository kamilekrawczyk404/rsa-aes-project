import "./App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import React from "react";
import { Cog, House, LayoutDashboard } from "lucide-react";
import DashboardLayout from "./layouts/DashboardLayout.tsx";
import Welcome from "./pages/Welcome.tsx";
import Configurator from "./pages/Configurator.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./pages/Dashboard.tsx";
import { CryptoProcessProvider } from "./context/CryptoContext.tsx";
import DevToolbar from "./components/DevToolbar.tsx";
import { SimulationDataProvider } from "./context/SimulationDataContext.tsx";
import { PopupProvider } from "./context/PopUpContext.tsx";
import { ModalProvider } from "./context/ModalContext.tsx";
import { DevModalTrigger } from "./components/DevModalTrigger.tsx";

export type View = "welcome" | "configurator" | "dashboard";

type MenuItem = {
  label: string;
  link: string;
  icon: React.ReactNode;
  element: React.ReactNode;
};

export const menuItems: { [T in View]: MenuItem } = {
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
  dashboard: {
    link: "/dashboard",
    label: "Panel główny",
    icon: <LayoutDashboard />,
    element: <Dashboard />,
  },
};

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={client}>
        <CryptoProcessProvider>
          <SimulationDataProvider>
            <PopupProvider>
              <ModalProvider>
                <DevModalTrigger />
                <DevToolbar />
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
              </ModalProvider>
            </PopupProvider>
          </SimulationDataProvider>
        </CryptoProcessProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
