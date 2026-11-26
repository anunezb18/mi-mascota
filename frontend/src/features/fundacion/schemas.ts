import { z } from "zod";

import type { AtributosConejo, AtributosGato, AtributosPerro, Mascota, MascotaPayload } from "@/types";

/* ---------- Historial médico ---------- */

const hoy = () => new Date().toISOString().slice(0, 10);

export const registroMedicoSchema = z.object({
  fecha: z
    .string()
    .min(1, "Indique la fecha.")
    .refine((d) => d <= hoy(), "La fecha no puede ser posterior a hoy."),
  tipo: z.enum(["vacuna", "desparasitacion", "esterilizacion", "consulta", "cirugia", "tratamiento"], {
    required_error: "Seleccione el tipo de registro.",
  }),
  descripcion: z
    .string()
    .trim()
    .min(5, "Describa el procedimiento (mínimo 5 caracteres).")
    .max(500, "Máximo 500 caracteres."),
  veterinario: z.string().trim().max(120, "Máximo 120 caracteres.").optional(),
});
export type RegistroMedicoValues = z.infer<typeof registroMedicoSchema>;

/* ---------- Atributos por especie ---------- */

const atributosPerro = z.object({
  nivel_energia: z.enum(["bajo", "medio", "alto"]),
  necesita_patio: z.boolean(),
  apto_con_ninos: z.boolean(),
  apto_con_gatos: z.boolean(),
  entrenado: z.boolean(),
});
const atributosGato = z.object({
  usa_arenero: z.boolean(),
  apto_con_perros: z.boolean(),
  apto_con_ninos: z.boolean(),
  solo_interior: z.boolean(),
});
const atributosConejo = z.object({
  usa_arenero: z.boolean(),
  tipo_pelaje: z.enum(["corto", "largo"]),
  apto_con_ninos: z.boolean(),
  requiere_jaula_amplia: z.boolean(),
});

export const ATRIBUTOS_DEFAULT = {
  perro: { nivel_energia: "medio", necesita_patio: false, apto_con_ninos: true, apto_con_gatos: false, entrenado: false } as AtributosPerro,
  gato: { usa_arenero: true, apto_con_perros: false, apto_con_ninos: true, solo_interior: true } as AtributosGato,
  conejo: { usa_arenero: false, tipo_pelaje: "corto", apto_con_ninos: true, requiere_jaula_amplia: true } as AtributosConejo,
};

/* ---------- Mascota ---------- */

const entero = (mensaje: string) => z.number({ invalid_type_error: mensaje, required_error: mensaje }).int(mensaje);

/**
 * El formulario guarda los atributos de las tres especies por separado; al enviar
 * solo se incluye el de la especie seleccionada en `atributos_especie`.
 */
export const mascotaFormSchema = z
  .object({
    nombre: z.string().trim().min(2, "Ingrese el nombre (mínimo 2 caracteres).").max(60, "Máximo 60 caracteres."),
    especie: z.enum(["perro", "gato", "conejo"]),
    raza: z.string().trim().min(2, "Ingrese la raza o «Mestizo».").max(80, "Máximo 80 caracteres."),
    sexo: z.enum(["macho", "hembra"], { required_error: "Seleccione el sexo." }),
    edad_anios: entero("Ingrese los años (0 si es menor de un año).").min(0, "No puede ser negativo.").max(30, "Revise la edad."),
    edad_meses: entero("Ingrese los meses.").min(0, "Entre 0 y 11.").max(11, "Entre 0 y 11."),
    tamano: z.enum(["pequeno", "mediano", "grande"], { required_error: "Seleccione el tamaño." }),
    esterilizado: z.boolean(),
    descripcion: z
      .string()
      .trim()
      .min(40, "Describa a la mascota en al menos 40 caracteres.")
      .max(2000, "Máximo 2.000 caracteres."),
    temperamento: z
      .array(z.enum(["tranquilo", "jugueton", "sociable", "carinoso", "timido", "independiente", "activo", "protector"]))
      .min(1, "Seleccione al menos un rasgo.")
      .max(4, "Seleccione máximo 4 rasgos."),
    fotos: z.array(z.string()).min(1, "Agregue al menos una foto.").max(6, "Máximo 6 fotos."),
    atributos_perro: atributosPerro,
    atributos_gato: atributosGato,
    atributos_conejo: atributosConejo,
    ubicacion: z
      .object({ lat: z.number(), lng: z.number() })
      .nullable()
      // Boolean(v) y no `v !== null`: un predicado de tipo haría que el valor inicial null no fuera asignable
      .refine((v) => Boolean(v), "Indique la ubicación de la mascota en el mapa."),
    historial_medico: z.array(registroMedicoSchema),
  })
  .refine((v) => v.edad_anios * 12 + v.edad_meses >= 1, {
    message: "La edad debe ser de al menos 1 mes.",
    path: ["edad_meses"],
  });

export type MascotaFormValues = z.infer<typeof mascotaFormSchema>;

export function valoresIniciales(mascota?: Mascota, sede?: [number, number]): MascotaFormValues {
  if (!mascota) {
    return {
      nombre: "",
      especie: "perro",
      raza: "",
      sexo: undefined as never,
      edad_anios: 1,
      edad_meses: 0,
      tamano: undefined as never,
      esterilizado: false,
      descripcion: "",
      temperamento: [],
      fotos: [],
      atributos_perro: ATRIBUTOS_DEFAULT.perro,
      atributos_gato: ATRIBUTOS_DEFAULT.gato,
      atributos_conejo: ATRIBUTOS_DEFAULT.conejo,
      ubicacion: sede ? { lng: sede[0], lat: sede[1] } : null,
      historial_medico: [],
    };
  }
  const [lng, lat] = mascota.ubicacion.coordinates;
  return {
    nombre: mascota.nombre,
    especie: mascota.especie,
    raza: mascota.raza,
    sexo: mascota.sexo,
    edad_anios: Math.floor(mascota.edad_meses / 12),
    edad_meses: mascota.edad_meses % 12,
    tamano: mascota.tamano,
    esterilizado: mascota.esterilizado,
    descripcion: mascota.descripcion,
    temperamento: mascota.temperamento,
    fotos: mascota.fotos,
    atributos_perro: mascota.especie === "perro" ? (mascota.atributos_especie as AtributosPerro) : ATRIBUTOS_DEFAULT.perro,
    atributos_gato: mascota.especie === "gato" ? (mascota.atributos_especie as AtributosGato) : ATRIBUTOS_DEFAULT.gato,
    atributos_conejo: mascota.especie === "conejo" ? (mascota.atributos_especie as AtributosConejo) : ATRIBUTOS_DEFAULT.conejo,
    ubicacion: { lat, lng },
    historial_medico: [],
  };
}

export function aPayload(v: MascotaFormValues): MascotaPayload {
  const atributos = { perro: v.atributos_perro, gato: v.atributos_gato, conejo: v.atributos_conejo }[v.especie];
  return {
    nombre: v.nombre.trim(),
    especie: v.especie,
    raza: v.raza.trim(),
    sexo: v.sexo,
    edad_meses: v.edad_anios * 12 + v.edad_meses,
    tamano: v.tamano,
    esterilizado: v.esterilizado,
    descripcion: v.descripcion.trim(),
    temperamento: v.temperamento,
    fotos: v.fotos,
    atributos_especie: atributos,
    ubicacion: { type: "Point", coordinates: [v.ubicacion!.lng, v.ubicacion!.lat] },
    historial_medico: v.historial_medico.map((r) => ({
      fecha: new Date(`${r.fecha}T12:00:00`).toISOString(),
      tipo: r.tipo,
      descripcion: r.descripcion.trim(),
      veterinario: r.veterinario?.trim() || undefined,
    })),
  };
}
