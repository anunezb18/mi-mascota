import {
  Bell,
  Building2,
  ClipboardList,
  Home,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  PawPrint,
  Search,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import { paths } from "@/routes/paths";
import type { Rol } from "@/types";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Coincidencia exacta de la ruta para marcarla como activa. */
  end?: boolean;
}

/** Enlaces principales para visitantes sin sesión. */
export const PUBLIC_NAV: NavItem[] = [{ label: "Mascotas en adopción", to: paths.mascotas, icon: Search }];

/** Enlaces principales de cada rol. */
export const ROLE_NAV: Record<Rol, NavItem[]> = {
  adoptante: [
    { label: "Explorar", to: paths.mascotas, icon: Search },
    { label: "Recomendaciones", to: paths.adoptante.recomendaciones, icon: Sparkles },
    { label: "Mis solicitudes", to: paths.adoptante.solicitudes, icon: ClipboardList },
  ],
  fundacion: [
    { label: "Panel", to: paths.fundacion.panel, icon: LayoutDashboard, end: true },
    { label: "Mascotas", to: paths.fundacion.mascotas, icon: PawPrint },
    { label: "Solicitudes", to: paths.fundacion.solicitudes, icon: Inbox },
  ],
  administrador: [
    { label: "Fundaciones", to: paths.admin.fundaciones, icon: Building2 },
    { label: "Usuarios", to: paths.admin.usuarios, icon: Users },
  ],
};

/** Roles cuya navegación principal vive en un panel de gestión con barra lateral. */
export function esRolDePanel(rol: Rol): rol is "fundacion" | "administrador" {
  return rol === "fundacion" || rol === "administrador";
}

/** Pantallas comunes de la cuenta (en los paneles se muestran en la barra lateral). */
export const CUENTA_NAV: NavItem[] = [
  { label: "Notificaciones", to: paths.notificaciones, icon: Bell },
  { label: "Mi cuenta", to: paths.cuenta, icon: UserRound },
];

/** Enlaces al sitio público que se muestran desde los paneles de gestión. */
export const SITIO_PUBLICO_NAV: NavItem[] = [
  { label: "Inicio", to: paths.inicio, icon: Home, end: true },
  { label: "Mascotas en adopción", to: paths.mascotas, icon: Search },
];
