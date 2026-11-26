import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/auth-context";
import { queryKeys } from "@/lib/query-keys";
import type { Notificacion, TipoNotificacion } from "@/types";

import { useInsertarNotificacion } from "./hooks";
import { type EstadoConexion, notificacionesService } from "./services/notificaciones.service";

/* Estado compartido del canal en tiempo real (fuera de React para leerlo desde cualquier componente). */
interface EstadoTiempoReal {
  conexion: EstadoConexion;
  /** Aumenta con cada notificación recibida; la campana lo usa para animarse. */
  recibidas: number;
}
let estado: EstadoTiempoReal = { conexion: "desconectado", recibidas: 0 };
const suscriptores = new Set<() => void>();
function actualizar(parcial: Partial<EstadoTiempoReal>) {
  estado = { ...estado, ...parcial };
  suscriptores.forEach((fn) => fn());
}
function suscribir(fn: () => void) {
  suscriptores.add(fn);
  return () => {
    suscriptores.delete(fn);
  };
}

export function useEstadoTiempoReal() {
  return React.useSyncExternalStore(suscribir, () => estado);
}

/** Datos que cambian en el servidor cuando llega cada tipo de notificación. */
const CONSULTAS_AFECTADAS: Record<TipoNotificacion, readonly (readonly string[])[]> = {
  solicitud_recibida: [queryKeys.fundacion.all],
  solicitud_aprobada: [queryKeys.solicitudes.all, queryKeys.mascotas.all, queryKeys.recomendaciones.all],
  solicitud_rechazada: [queryKeys.solicitudes.all],
  fundacion_pendiente: [queryKeys.admin.all],
  fundacion_aprobada: [queryKeys.fundacion.all],
  fundacion_rechazada: [queryKeys.fundacion.all],
};

/**
 * Mantiene abierto el canal de notificaciones mientras hay sesión. Cada mensaje
 * se agrega a la caché (contador y listas), refresca los datos relacionados y
 * se anuncia con un toast (región viva para lectores de pantalla).
 */
export function NotificacionesEnTiempoReal() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const insertar = useInsertarNotificacion();
  const usuarioId = usuario?._id;

  // Referencias estables para no reabrir la conexión en cada render
  const manejar = React.useRef<(n: Notificacion) => void>(() => undefined);
  manejar.current = (n) => {
    insertar(n);
    CONSULTAS_AFECTADAS[n.tipo].forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    actualizar({ recibidas: estado.recibidas + 1 });
    toast(n.titulo, {
      description: n.mensaje,
      action: n.enlace ? { label: "Ver", onClick: () => navigate(n.enlace!) } : undefined,
    });
  };

  React.useEffect(() => {
    if (!usuarioId) return;
    const cerrar = notificacionesService.conectar({
      onNotificacion: (n) => manejar.current(n),
      onEstado: (conexion) => actualizar({ conexion }),
    });
    return () => {
      cerrar();
      actualizar({ conexion: "desconectado" });
    };
  }, [usuarioId]);

  return null;
}
