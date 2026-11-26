import { z } from "zod";

const especie = z.enum(["perro", "gato", "conejo"]);
const tamano = z.enum(["pequeno", "mediano", "grande"]);
const respuesta = (mensaje: string) => z.boolean({ required_error: mensaje, invalid_type_error: mensaje });

export const perfilSchema = z
  .object({
    tipo_vivienda: z.enum(["apartamento", "casa", "finca"], {
      required_error: "Seleccione el tipo de vivienda.",
      invalid_type_error: "Seleccione el tipo de vivienda.",
    }),
    tiene_patio: respuesta("Indique si cuenta con patio o zona verde."),
    horas_disponibles: z.number().int().min(1, "Mínimo 1 hora.").max(16, "Máximo 16 horas."),
    experiencia_previa: respuesta("Indique si ha tenido mascotas antes."),
    tiene_ninos: respuesta("Indique si hay niños en el hogar."),
    tiene_otras_mascotas: respuesta("Indique si convive con otras mascotas."),
    otras_mascotas: z.array(especie),
    especies_preferidas: z.array(especie),
    tamanos_preferidos: z.array(tamano),
  })
  .superRefine((v, ctx) => {
    if (v.tiene_otras_mascotas && v.otras_mascotas.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otras_mascotas"],
        message: "Seleccione qué mascotas tiene.",
      });
    }
  });

export type PerfilValues = z.infer<typeof perfilSchema>;
