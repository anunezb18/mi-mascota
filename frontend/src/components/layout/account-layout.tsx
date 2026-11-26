import { useAuth } from "@/features/auth/auth-context";

import { esRolDePanel } from "./nav-config";
import { PanelLayout } from "./panel-layout";
import { SiteLayout } from "./site-layout";

/**
 * Layout de las pantallas comunes (notificaciones y cuenta): la fundación y el
 * administrador las ven dentro de su panel; el adoptante, dentro del sitio.
 */
export function AccountLayout() {
  const { usuario } = useAuth();
  if (usuario && esRolDePanel(usuario.rol)) return <PanelLayout />;
  return <SiteLayout contained />;
}
