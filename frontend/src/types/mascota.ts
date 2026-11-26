import type { GeoPoint, ISODate, ObjectId } from "./common";

export type Especie = "perro" | "gato" | "conejo";
export type Sexo = "macho" | "hembra";
export type Tamano = "pequeno" | "mediano" | "grande";
export type EstadoMascota = "disponible" | "en_proceso" | "adoptada";
export type EtapaVida = "cachorro" | "joven" | "adulto" | "senior";
export type NivelEnergia = "bajo" | "medio" | "alto";

export type Temperamento =
  | "tranquilo"
  | "jugueton"
  | "sociable"
  | "carinoso"
  | "timido"
  | "independiente"
  | "activo"
  | "protector";

export type TipoRegistroMedico =
  | "vacuna"
  | "desparasitacion"
  | "esterilizacion"
  | "consulta"
  | "cirugia"
  | "tratamiento";

/** Subdocumento del arreglo embebido `historial_medico`. */
export interface RegistroMedico {
  _id: ObjectId;
  fecha: ISODate;
  tipo: TipoRegistroMedico;
  descripcion: string;
  veterinario?: string;
}

/* Atributos variables según la especie (subdocumento `atributos_especie`). */
export interface AtributosPerro {
  nivel_energia: NivelEnergia;
  necesita_patio: boolean;
  apto_con_ninos: boolean;
  apto_con_gatos: boolean;
  entrenado: boolean;
}

export interface AtributosGato {
  usa_arenero: boolean;
  apto_con_perros: boolean;
  apto_con_ninos: boolean;
  solo_interior: boolean;
}

export interface AtributosConejo {
  usa_arenero: boolean;
  tipo_pelaje: "corto" | "largo";
  apto_con_ninos: boolean;
  requiere_jaula_amplia: boolean;
}

export type AtributosEspecie = AtributosPerro | AtributosGato | AtributosConejo;

/** Resumen de la fundación desnormalizado dentro de la mascota. */
export interface FundacionResumen {
  _id: ObjectId;
  nombre: string;
  ciudad: string;
  localidad?: string;
  telefono?: string;
  correo?: string;
}

/** Colección `mascotas`. */
export interface Mascota {
  _id: ObjectId;
  nombre: string;
  especie: Especie;
  raza: string;
  sexo: Sexo;
  edad_meses: number;
  tamano: Tamano;
  descripcion: string;
  temperamento: Temperamento[];
  fotos: string[];
  estado: EstadoMascota;
  atributos_especie: AtributosEspecie;
  historial_medico: RegistroMedico[];
  esterilizado: boolean;
  fundacion_id: ObjectId;
  fundacion: FundacionResumen;
  ubicacion: GeoPoint;
  fecha_publicacion: ISODate;
  actualizado_en?: ISODate;
  /** Solo presente en búsquedas por cercanía ($geoNear). */
  distancia_km?: number;
}

export interface FiltrosMascotas {
  especie?: Especie;
  tamano?: Tamano;
  etapa?: EtapaVida;
  temperamento?: Temperamento[];
  /** Búsqueda por cercanía. */
  lat?: number;
  lng?: number;
  radio_km?: number;
  estado?: EstadoMascota;
  /** Texto libre (nombre o raza). */
  q?: string;
  /** Cantidad máxima de resultados. */
  limite?: number;
}

export type RegistroMedicoPayload = Omit<RegistroMedico, "_id">;

export interface MascotaPayload {
  nombre: string;
  especie: Especie;
  raza: string;
  sexo: Sexo;
  edad_meses: number;
  tamano: Tamano;
  descripcion: string;
  temperamento: Temperamento[];
  fotos: string[];
  esterilizado: boolean;
  estado?: EstadoMascota;
  atributos_especie: AtributosEspecie;
  historial_medico?: RegistroMedicoPayload[];
  ubicacion: GeoPoint;
}
