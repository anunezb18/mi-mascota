import type { GeoPoint, ISODate, ObjectId } from "./common";

export type EstadoValidacion = "pendiente" | "aprobada" | "rechazada";

/** Colección `fundaciones`. */
export interface Fundacion {
  _id: ObjectId;
  usuario_id: ObjectId;
  nombre: string;
  nit: string;
  descripcion: string;
  direccion: string;
  ciudad: string;
  localidad?: string;
  telefono: string;
  correo: string;
  sitio_web?: string;
  ubicacion?: GeoPoint;
  estado_validacion: EstadoValidacion;
  motivo_rechazo?: string;
  fecha_registro: ISODate;
  fecha_validacion?: ISODate;
}

export interface IndicadoresFundacion {
  mascotas_publicadas: number;
  mascotas_disponibles: number;
  mascotas_en_proceso: number;
  mascotas_adoptadas: number;
  solicitudes_pendientes: number;
}

export interface ValidarFundacionPayload {
  estado_validacion: Exclude<EstadoValidacion, "pendiente">;
  motivo_rechazo?: string;
}

/** Filtros del listado de fundaciones del administrador (GET /admin/fundaciones). */
export interface FiltrosFundaciones {
  estado?: EstadoValidacion;
  /** Búsqueda por nombre o NIT. */
  q?: string;
}

/** Fundación con los datos de la cuenta que la registró (vista del administrador). */
export interface FundacionAdmin extends Fundacion {
  representante: {
    _id: ObjectId;
    nombre: string;
    correo: string;
    activo: boolean;
  };
}
