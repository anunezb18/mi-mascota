import { Navigate, Outlet, useLocation } from "react-router-dom";

import { PageLoader } from "@/components/layout/page-loader";
import { useAuth } from "@/features/auth/auth-context";
import type { Rol } from "@/types";

import { homeForRole, paths } from "./paths";

/**
 * Protege un grupo de rutas. Sin sesión redirige al login (recordando el destino);
 * con un rol no permitido redirige a la página de acceso denegado.
 */
export function RequireAuth({ roles }: { roles?: Rol[] }) {
  const { status, usuario } = useAuth();
  const location = useLocation();

  if (status === "loading") return <PageLoader />;

  if (!usuario) {
    return <Navigate to={paths.ingresar} replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to={paths.accesoDenegado} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/** Rutas solo para visitantes (login, registro): con sesión activa redirige al inicio del rol. */
export function GuestOnly() {
  const { status, usuario } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (status === "loading") return <PageLoader />;
  if (usuario) return <Navigate to={from ?? homeForRole(usuario.rol)} replace />;
  return <Outlet />;
}
