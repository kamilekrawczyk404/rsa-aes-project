import "./App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import React from "react";
import { Cog, House, LayoutDashboard, Video } from "lucide-react";
import DashboardLayout from "./layouts/DashboardLayout.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./pages/Dashboard.tsx";
import { CryptoProcessProvider } from "./context/CryptoContext.tsx";
import { SimulationDataProvider } from "./context/SimulationDataContext.tsx";
import { PopupProvider } from "./context/PopUpContext.tsx";
import { ModalProvider } from "./context/ModalContext.tsx";
import LiveCameraView from "./pages/LiveCameraView.tsx";
import Configurator from "./pages/Configurator.tsx";
import { WebSocketProvider } from "./context/WebSocketProvider.tsx";
import { WebcamProvider } from "./context/WebcamContext.tsx";
import Welcome from "./pages/welcome/Welcome.tsx";

export type View = "welcome" | "configurator" | "dashboard" | "encryptedWebcam";

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
  encryptedWebcam: {
    link: "/encrypted-webcam",
    label: "Obraz na żywo",
    icon: <Video />,
    element: <LiveCameraView />,
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
        <WebSocketProvider>
          <CryptoProcessProvider>
            <WebcamProvider>
              <SimulationDataProvider>
                <PopupProvider>
                  <ModalProvider>
                    {/*<DevModalTrigger />*/}
                    {/*<DevToolbar />*/}
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
                        <Route
                          path={"*"}
                          element={<Navigate to={"/"} replace />}
                        />
                      </Route>
                    </Routes>
                  </ModalProvider>
                </PopupProvider>
              </SimulationDataProvider>
            </WebcamProvider>
          </CryptoProcessProvider>
        </WebSocketProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
