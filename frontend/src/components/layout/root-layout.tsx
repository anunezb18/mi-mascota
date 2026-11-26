import { Outlet, ScrollRestoration } from "react-router-dom";

import { NotificacionesEnTiempoReal } from "@/features/notificaciones/realtime";

import { NavigationProgress } from "./navigation-progress";

export function RootLayout() {
  return (
    <>
      <a href="#contenido" className="skip-link">
        Saltar al contenido principal
      </a>
      <NavigationProgress />
      <NotificacionesEnTiempoReal />
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
