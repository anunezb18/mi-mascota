import type { ISODate, ObjectId } from "./common";
import type { Especie } from "./mascota";
import type { PerfilEstiloVida } from "./usuario";

export type EstadoSolicitud = "pendiente" | "aprobada" | "rechazada";

/** Entrada del arreglo embebido `historial_estados`. */
export interface CambioEstadoSolicitud {
  estado: EstadoSolicitud;
  fecha: ISODate;
  nota?: string;
}

/** Colección `solicitudes`. Guarda copias resumidas de mascota, fundación y adoptante. */
export interface Solicitud {
  _id: ObjectId;
  mascota_id: ObjectId;
  adoptante_id: ObjectId;
  fundacion_id: ObjectId;
  estado: EstadoSolicitud;
  mensaje: string;
  mascota: {
    nombre: string;
    especie: Especie;
    foto?: string;
  };
  fundacion: {
    nombre: string;
  };
  adoptante: {
    nombre: string;
    correo: string;
    telefono?: string;
    ciudad?: string;
    perfil_estilo_vida?: PerfilEstiloVida;
  };
  historial_estados: CambioEstadoSolicitud[];
  fecha_creacion: ISODate;
  fecha_actualizacion: ISODate;
}

export interface CrearSolicitudPayload {
  mascota_id: ObjectId;
  mensaje: string;
}

export interface ResolverSolicitudPayload {
  estado: Exclude<EstadoSolicitud, "pendiente">;
  nota?: string;
}
