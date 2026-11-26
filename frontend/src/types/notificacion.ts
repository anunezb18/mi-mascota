import type { ISODate, ObjectId } from "./common";

export type TipoNotificacion =
  | "solicitud_recibida"
  | "solicitud_aprobada"
  | "solicitud_rechazada"
  | "fundacion_pendiente"
  | "fundacion_aprobada"
  | "fundacion_rechazada";

/** Colección `notificaciones`. Se emiten en tiempo real desde change streams. */
export interface Notificacion {
  _id: ObjectId;
  usuario_id: ObjectId;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  /** Ruta interna del frontend relacionada con la notificación. */
  enlace?: string;
  fecha: ISODate;
}

/** Mensaje que envía el servidor por el WebSocket. */
export interface MensajeWebSocket {
  evento: "notificacion";
  datos: Notificacion;
}

export interface FiltrosNotificaciones {
  solo_no_leidas?: boolean;
  limite?: number;
}
