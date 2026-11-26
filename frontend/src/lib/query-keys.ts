import type { FiltrosFundaciones, FiltrosMascotas, FiltrosNotificaciones, FiltrosUsuarios } from "@/types";

/** Claves de TanStack Query centralizadas para invalidar la caché de forma consistente. */
export const queryKeys = {
  mascotas: {
    all: ["mascotas"] as const,
    list: (filtros: FiltrosMascotas) => ["mascotas", "lista", filtros] as const,
    detail: (id: string) => ["mascotas", "detalle", id] as const,
  },
  fundacion: {
    all: ["fundacion"] as const,
    me: ["fundacion", "me"] as const,
    indicadores: ["fundacion", "indicadores"] as const,
    mascotas: (filtros: FiltrosMascotas) => ["fundacion", "mascotas", filtros] as const,
    solicitudes: ["fundacion", "solicitudes"] as const,
  },
  recomendaciones: {
    all: ["recomendaciones"] as const,
  },
  solicitudes: {
    all: ["solicitudes"] as const,
    mias: ["solicitudes", "mias"] as const,
  },
  notificaciones: {
    all: ["notificaciones"] as const,
    list: (filtros: FiltrosNotificaciones) => ["notificaciones", "lista", filtros] as const,
    noLeidas: ["notificaciones", "no-leidas"] as const,
  },
  admin: {
    all: ["admin"] as const,
    fundaciones: (filtros: FiltrosFundaciones) => ["admin", "fundaciones", filtros] as const,
    usuarios: (filtros: FiltrosUsuarios) => ["admin", "usuarios", filtros] as const,
  },
};
