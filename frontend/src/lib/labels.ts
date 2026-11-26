import type {
  EstadoMascota,
  EstadoSolicitud,
  EstadoValidacion,
  Especie,
  EtapaVida,
  NivelEnergia,
  Rol,
  Sexo,
  Tamano,
  Temperamento,
  TipoRegistroMedico,
  TipoVivienda,
} from "@/types";

/* Etiquetas en español para los valores enumerados que llegan de la API. */

export const ROL_LABEL: Record<Rol, string> = {
  adoptante: "Adoptante",
  fundacion: "Fundación",
  administrador: "Administrador",
};

export const ESPECIE_LABEL: Record<Especie, string> = {
  perro: "Perro",
  gato: "Gato",
  conejo: "Conejo",
};

export const ESPECIE_PLURAL: Record<Especie, string> = {
  perro: "Perros",
  gato: "Gatos",
  conejo: "Conejos",
};

export const SEXO_LABEL: Record<Sexo, string> = {
  macho: "Macho",
  hembra: "Hembra",
};

export const TAMANO_LABEL: Record<Tamano, string> = {
  pequeno: "Pequeño",
  mediano: "Mediano",
  grande: "Grande",
};

export const ETAPA_LABEL: Record<EtapaVida, string> = {
  cachorro: "Cachorro (menos de 1 año)",
  joven: "Joven (1 a 3 años)",
  adulto: "Adulto (3 a 8 años)",
  senior: "Senior (más de 8 años)",
};

/** Rango de edad en meses de cada etapa: [mínimo incluido, máximo excluido]. */
export const ETAPA_RANGO_MESES: Record<EtapaVida, [number, number]> = {
  cachorro: [0, 12],
  joven: [12, 36],
  adulto: [36, 96],
  senior: [96, Number.POSITIVE_INFINITY],
};

export const TEMPERAMENTO_LABEL: Record<Temperamento, string> = {
  tranquilo: "Tranquilo",
  jugueton: "Juguetón",
  sociable: "Sociable",
  carinoso: "Cariñoso",
  timido: "Tímido",
  independiente: "Independiente",
  activo: "Activo",
  protector: "Protector",
};

export const ESTADO_MASCOTA_LABEL: Record<EstadoMascota, string> = {
  disponible: "Disponible",
  en_proceso: "En proceso",
  adoptada: "Adoptada",
};

export const ESTADO_SOLICITUD_LABEL: Record<EstadoSolicitud, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

export const ESTADO_VALIDACION_LABEL: Record<EstadoValidacion, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

export const TIPO_REGISTRO_MEDICO_LABEL: Record<TipoRegistroMedico, string> = {
  vacuna: "Vacuna",
  desparasitacion: "Desparasitación",
  esterilizacion: "Esterilización",
  consulta: "Consulta",
  cirugia: "Cirugía",
  tratamiento: "Tratamiento",
};

export const TIPO_VIVIENDA_LABEL: Record<TipoVivienda, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  finca: "Finca o casa campestre",
};

export const NIVEL_ENERGIA_LABEL: Record<NivelEnergia, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
};

/** Etiquetas de los atributos variables por especie (claves de `atributos_especie`). */
export const ATRIBUTO_ESPECIE_LABEL: Record<string, string> = {
  nivel_energia: "Nivel de energía",
  necesita_patio: "Necesita patio",
  apto_con_ninos: "Convive con niños",
  apto_con_gatos: "Convive con gatos",
  apto_con_perros: "Convive con perros",
  entrenado: "Entrenamiento básico",
  usa_arenero: "Usa arenero",
  solo_interior: "Solo interior",
  tipo_pelaje: "Tipo de pelaje",
  requiere_jaula_amplia: "Requiere jaula amplia",
};
