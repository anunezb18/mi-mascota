import { type RouteObject, createBrowserRouter } from "react-router-dom";

import { AccountLayout } from "@/components/layout/account-layout";
import { PanelLayout } from "@/components/layout/panel-layout";
import { RootLayout } from "@/components/layout/root-layout";
import { RouteErrorBoundary } from "@/components/layout/route-error-boundary";
import { SiteLayout } from "@/components/layout/site-layout";

import { GuestOnly, RequireAuth } from "./guards";
import { paths } from "./paths";

/** Carga diferida de pantallas: cada una se descarga solo cuando se visita. */
const page = (loader: () => Promise<{ default: React.ComponentType }>) => ({
  lazy: () => loader().then((m) => ({ Component: m.default })),
});

const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <SiteLayout />,
        children: [
          // Públicas
          { path: paths.inicio, ...page(() => import("@/routes/pages/landing-page")) },
          { path: paths.mascotas, ...page(() => import("@/features/mascotas/pages/catalog-page")) },
          { path: "/mascotas/:id", ...page(() => import("@/features/mascotas/pages/pet-detail-page")) },
          {
            element: <GuestOnly />,
            children: [
              { path: paths.ingresar, ...page(() => import("@/features/auth/pages/login-page")) },
              { path: paths.registro, ...page(() => import("@/features/auth/pages/register-page")) },
            ],
          },

          // Adoptante
          {
            element: <RequireAuth roles={["adoptante"]} />,
            children: [
              {
                path: paths.adoptante.perfil,
                ...page(() => import("@/features/recomendaciones/pages/lifestyle-wizard-page")),
              },
              {
                path: paths.adoptante.recomendaciones,
                ...page(() => import("@/features/recomendaciones/pages/recommendations-page")),
              },
              {
                path: paths.adoptante.solicitudes,
                ...page(() => import("@/features/solicitudes/pages/my-requests-page")),
              },
            ],
          },

          { path: paths.accesoDenegado, ...page(() => import("@/routes/pages/forbidden-page")) },
          { path: "*", ...page(() => import("@/routes/pages/not-found-page")) },
        ],
      },

      // Comunes a cualquier usuario autenticado (layout según el rol)
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AccountLayout />,
            children: [
              { path: paths.notificaciones, ...page(() => import("@/features/notificaciones/pages/notifications-page")) },
              { path: paths.cuenta, ...page(() => import("@/features/auth/pages/account-page")) },
            ],
          },
        ],
      },

      // Paneles de gestión con barra lateral
      {
        element: <RequireAuth roles={["fundacion"]} />,
        children: [
          {
            element: <PanelLayout />,
            children: [
              { path: paths.fundacion.panel, ...page(() => import("@/features/fundacion/pages/dashboard-page")) },
              {
                path: paths.fundacion.mascotas,
                ...page(() => import("@/features/fundacion/pages/pets-management-page")),
              },
              { path: paths.fundacion.nuevaMascota, ...page(() => import("@/features/fundacion/pages/pet-form-page")) },
              {
                path: "/fundacion/mascotas/:id/editar",
                ...page(() => import("@/features/fundacion/pages/pet-form-page")),
              },
              {
                path: paths.fundacion.solicitudes,
                ...page(() => import("@/features/fundacion/pages/requests-inbox-page")),
              },
            ],
          },
        ],
      },
      {
        element: <RequireAuth roles={["administrador"]} />,
        children: [
          {
            element: <PanelLayout />,
            children: [
              {
                path: paths.admin.fundaciones,
                ...page(() => import("@/features/admin/pages/foundations-validation-page")),
              },
              { path: paths.admin.usuarios, ...page(() => import("@/features/admin/pages/users-page")) },
            ],
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
