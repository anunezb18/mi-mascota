import type { Notificacion, TipoNotificacion } from "@/types";

import { db, persist } from "./db";
import { objectId } from "./utils";

/**
 * Simula el flujo change stream -> WebSocket del backend: cada notificación que
 * se inserta en la colección se publica a los suscriptores en el mismo navegador.
 */
type Listener = (notificacion: Notificacion) => void;
const listeners = new Set<Listener>();

export function subscribeMockNotifications(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notify(
  usuario_id: string,
  tipo: TipoNotificacion,
  titulo: string,
  mensaje: string,
  enlace?: string,
): Notificacion {
  const notificacion: Notificacion = {
    _id: objectId(),
    usuario_id,
    tipo,
    titulo,
    mensaje,
    enlace,
    leida: false,
    fecha: new Date().toISOString(),
  };
  db.notificaciones.unshift(notificacion);
  persist();
  listeners.forEach((listener) => listener(structuredClone(notificacion)));
  return notificacion;
}
