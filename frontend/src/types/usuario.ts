import type { GeoPoint, ISODate, ObjectId } from "./common";
import type { Especie, Tamano } from "./mascota";

export type Rol = "adoptante" | "fundacion" | "administrador";

export type TipoVivienda = "apartamento" | "casa" | "finca";

/** Subdocumento embebido en el usuario adoptante. Alimenta las recomendaciones. */
export interface PerfilEstiloVida {
  tipo_vivienda: TipoVivienda;
  tiene_patio: boolean;
  /** Horas al día que el adoptante puede dedicar a la mascota. */
  horas_disponibles: number;
  tiene_ninos: boolean;
  tiene_otras_mascotas: boolean;
  otras_mascotas: Especie[];
  experiencia_previa: boolean;
  especies_preferidas: Especie[];
  tamanos_preferidos: Tamano[];
  actualizado_en?: ISODate;
}

/** Colección `usuarios`. */
export interface Usuario {
  _id: ObjectId;
  nombre: string;
  correo: string;
  telefono?: string;
  rol: Rol;
  /** Borrado lógico: false = cuenta desactivada. */
  activo: boolean;
  ciudad?: string;
  ubicacion?: GeoPoint;
  perfil_estilo_vida?: PerfilEstiloVida;
  /** Solo para rol fundacion: referencia al documento de la fundación. */
  fundacion_id?: ObjectId;
  fecha_registro: ISODate;
}

export interface LoginPayload {
  correo: string;
  contrasena: string;
}

export interface RegistroAdoptantePayload {
  rol: "adoptante";
  nombre: string;
  correo: string;
  contrasena: string;
  telefono?: string;
  ciudad?: string;
}

export interface RegistroFundacionPayload {
  rol: "fundacion";
  nombre: string;
  correo: string;
  contrasena: string;
  telefono: string;
  fundacion: {
    nombre: string;
    nit: string;
    descripcion: string;
    direccion: string;
    ciudad: string;
    localidad?: string;
    sitio_web?: string;
  };
}

export type RegistroPayload = RegistroAdoptantePayload | RegistroFundacionPayload;

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  usuario: Usuario;
}

export interface ActualizarCuentaPayload {
  nombre?: string;
  telefono?: string;
  ciudad?: string;
}

export interface CambiarContrasenaPayload {
  contrasena_actual: string;
  contrasena_nueva: string;
}

/** Filtros del listado de usuarios del administrador (GET /admin/usuarios). */
export interface FiltrosUsuarios {
  /** Búsqueda por nombre o correo. */
  q?: string;
  rol?: Rol;
  activo?: boolean;
}

/** Activa o desactiva una cuenta (borrado lógico: nunca se elimina el documento). */
export interface CambiarEstadoUsuarioPayload {
  activo: boolean;
}
