import { z } from "zod";

/* Validaciones compartidas */
export const correoSchema = z
  .string()
  .trim()
  .min(1, "Ingrese su correo electrónico.")
  .email("Ingrese un correo electrónico válido.");

export const contrasenaSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(128, "La contraseña no puede superar 128 caracteres.")
  .regex(/[A-Za-z]/, "Debe incluir al menos una letra.")
  .regex(/\d/, "Debe incluir al menos un número.");

/** Celular colombiano (10 dígitos, inicia en 3) o fijo nacional (60 + indicativo). */
export const telefonoSchema = z
  .string()
  .trim()
  .regex(/^(3\d{9}|60\d{8})$/, "Ingrese un número de 10 dígitos (celular o fijo con indicativo 60X).");

export const loginSchema = z.object({
  correo: correoSchema,
  contrasena: z.string().min(1, "Ingrese su contraseña."),
});
export type LoginValues = z.infer<typeof loginSchema>;

const cuentaBase = {
  nombre: z.string().trim().min(3, "Ingrese su nombre completo.").max(120, "Máximo 120 caracteres."),
  correo: correoSchema,
  contrasena: contrasenaSchema,
  confirmacion: z.string().min(1, "Confirme su contraseña."),
  acepta_datos: z.literal(true, {
    errorMap: () => ({ message: "Debe autorizar el tratamiento de datos personales para continuar." }),
  }),
};

const coincidenContrasenas = (v: { contrasena: string; confirmacion: string }) => v.contrasena === v.confirmacion;
const errorCoincidencia = { message: "Las contraseñas no coinciden.", path: ["confirmacion"] };

export const registroAdoptanteSchema = z
  .object({
    ...cuentaBase,
    telefono: telefonoSchema.or(z.literal("")).optional(),
    ciudad: z.string().trim().min(2, "Ingrese su ciudad de residencia."),
  })
  .refine(coincidenContrasenas, errorCoincidencia);
export type RegistroAdoptanteValues = z.infer<typeof registroAdoptanteSchema>;

export const registroFundacionSchema = z
  .object({
    ...cuentaBase,
    telefono: telefonoSchema,
    fundacion_nombre: z.string().trim().min(3, "Ingrese el nombre de la fundación.").max(150),
    nit: z
      .string()
      .trim()
      .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d$/, "Ingrese el NIT con dígito de verificación (ej. 901.234.567-1)."),
    direccion: z.string().trim().min(5, "Ingrese la dirección de la sede."),
    ciudad: z.string().trim().min(2, "Ingrese la ciudad."),
    localidad: z.string().trim().optional(),
    descripcion: z
      .string()
      .trim()
      .min(40, "Describa la fundación en al menos 40 caracteres.")
      .max(1000, "Máximo 1.000 caracteres."),
    sitio_web: z.string().trim().url("Ingrese una URL válida (https://...).").or(z.literal("")).optional(),
  })
  .refine(coincidenContrasenas, errorCoincidencia);
export type RegistroFundacionValues = z.infer<typeof registroFundacionSchema>;

/* Cuenta: datos personales y cambio de contraseña */
export const cuentaSchema = (telefonoObligatorio: boolean) =>
  z.object({
    nombre: z.string().trim().min(3, "Ingrese su nombre completo.").max(120, "Máximo 120 caracteres."),
    telefono: telefonoObligatorio ? telefonoSchema : telefonoSchema.or(z.literal("")),
    ciudad: z.string().trim().max(80, "Máximo 80 caracteres."),
  });
export type CuentaValues = z.infer<ReturnType<typeof cuentaSchema>>;

export const cambiarContrasenaSchema = z
  .object({
    contrasena_actual: z.string().min(1, "Ingrese su contraseña actual."),
    contrasena: contrasenaSchema,
    confirmacion: z.string().min(1, "Confirme la nueva contraseña."),
  })
  .refine(coincidenContrasenas, errorCoincidencia)
  .refine((v) => v.contrasena !== v.contrasena_actual, {
    message: "La nueva contraseña debe ser diferente de la actual.",
    path: ["contrasena"],
  });
export type CambiarContrasenaValues = z.infer<typeof cambiarContrasenaSchema>;
