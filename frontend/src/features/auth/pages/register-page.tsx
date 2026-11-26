import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Clock, HeartHandshake } from "lucide-react";
import * as React from "react";
import { type Control, Controller, type FieldValues, type Path, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { getErrorMessage } from "@/lib/api-client";
import { LOCALIDADES_NOMBRES } from "@/lib/bogota";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";

import { AuthShell } from "../components/auth-shell";
import {
  type RegistroAdoptanteValues,
  type RegistroFundacionValues,
  registroAdoptanteSchema,
  registroFundacionSchema,
} from "../schemas";

type RolRegistro = "adoptante" | "fundacion";

export default function RegisterPage() {
  useDocumentTitle("Crear cuenta");
  const [params, setParams] = useSearchParams();
  const rol: RolRegistro = params.get("rol") === "fundacion" ? "fundacion" : "adoptante";

  const setRol = (value: string) => setParams({ rol: value }, { replace: true });

  return (
    <AuthShell
      wide
      title="Crear cuenta"
      description="Seleccione el tipo de cuenta. Los campos marcados con * son obligatorios."
    >
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Tipo de cuenta</legend>
        <RadioGroup value={rol} onValueChange={setRol} className="grid-cols-1 sm:grid-cols-2">
          <RoleOption
            value="adoptante"
            icon={HeartHandshake}
            title="Adoptante"
            text="Busco una mascota para adoptar."
            selected={rol === "adoptante"}
          />
          <RoleOption
            value="fundacion"
            icon={Building2}
            title="Fundación"
            text="Publico mascotas y gestiono adopciones."
            selected={rol === "fundacion"}
          />
        </RadioGroup>
      </fieldset>

      <Separator className="my-8" />

      {rol === "adoptante" ? <AdoptanteForm key="adoptante" /> : <FundacionForm key="fundacion" />}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tiene una cuenta?{" "}
        <Link to={paths.ingresar} className="font-semibold text-primary underline-offset-4 hover:underline">
          Inicie sesión
        </Link>
      </p>
    </AuthShell>
  );
}

function RoleOption({
  value,
  icon: Icon,
  title,
  text,
  selected,
}: {
  value: string;
  icon: typeof Building2;
  title: string;
  text: string;
  selected: boolean;
}) {
  return (
    <RadioCard value={value} className="flex-row items-center gap-4">
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
    </RadioCard>
  );
}

/** Tras registrarse, GuestOnly redirige al destino indicado en el estado de la ruta. */
function useSetRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  return (to: string) => navigate(location.pathname + location.search, { replace: true, state: { from: to } });
}

/* ------------------------------------------------------------------ */

function AdoptanteForm() {
  const { register: registrar } = useAuth();
  const setRedirect = useSetRedirect();
  const form = useForm<RegistroAdoptanteValues>({
    resolver: zodResolver(registroAdoptanteSchema),
    defaultValues: { nombre: "", correo: "", telefono: "", ciudad: "Bogotá", contrasena: "", confirmacion: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      setRedirect(paths.adoptante.perfil);
      await registrar({
        rol: "adoptante",
        nombre: v.nombre,
        correo: v.correo,
        contrasena: v.contrasena,
        telefono: v.telefono || undefined,
        ciudad: v.ciudad,
      });
      toast.success("Cuenta creada", { description: "Ahora cuéntenos sobre su hogar para recomendarle mascotas." });
    } catch (error) {
      form.setError("root", { message: getErrorMessage(error) });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {errors.root && <Alert variant="destructive">{errors.root.message}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Nombre completo" error={errors.nombre?.message} required className="sm:col-span-2">
          <Input autoComplete="name" {...form.register("nombre")} />
        </FormField>
        <FormField label="Correo electrónico" error={errors.correo?.message} required>
          <Input type="email" autoComplete="email" {...form.register("correo")} />
        </FormField>
        <FormField label="Teléfono celular" error={errors.telefono?.message} hint="Opcional. Lo verá la fundación.">
          <Input type="tel" inputMode="numeric" autoComplete="tel" placeholder="3001234567" {...form.register("telefono")} />
        </FormField>
        <FormField label="Ciudad de residencia" error={errors.ciudad?.message} required className="sm:col-span-2">
          <Input autoComplete="address-level2" {...form.register("ciudad")} />
        </FormField>
        <PasswordFields form={form} errors={errors} />
      </div>
      <DataConsent control={form.control} name="acepta_datos" error={errors.acepta_datos?.message} />
      <Button type="submit" size="lg" loading={isSubmitting}>
        Crear cuenta de adoptante
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function FundacionForm() {
  const { register: registrar } = useAuth();
  const setRedirect = useSetRedirect();
  const form = useForm<RegistroFundacionValues>({
    resolver: zodResolver(registroFundacionSchema),
    defaultValues: {
      nombre: "",
      correo: "",
      telefono: "",
      contrasena: "",
      confirmacion: "",
      fundacion_nombre: "",
      nit: "",
      direccion: "",
      ciudad: "Bogotá",
      localidad: "",
      descripcion: "",
      sitio_web: "",
    },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      setRedirect(paths.fundacion.panel);
      await registrar({
        rol: "fundacion",
        nombre: v.nombre,
        correo: v.correo,
        contrasena: v.contrasena,
        telefono: v.telefono,
        fundacion: {
          nombre: v.fundacion_nombre,
          nit: v.nit,
          descripcion: v.descripcion,
          direccion: v.direccion,
          ciudad: v.ciudad,
          localidad: v.localidad || undefined,
          sitio_web: v.sitio_web || undefined,
        },
      });
      toast.success("Registro enviado", {
        description: "Su fundación quedó pendiente de validación. Le notificaremos cuando sea revisada.",
        duration: 8000,
      });
    } catch (error) {
      form.setError("root", { message: getErrorMessage(error) });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Alert variant="warning" title="Su registro quedará pendiente de validación">
        El equipo administrador verificará el NIT y los datos de la fundación antes de habilitar la publicación de
        mascotas. Recibirá una notificación con el resultado.
      </Alert>
      {errors.root && <Alert variant="destructive">{errors.root.message}</Alert>}

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-display text-lg font-semibold">Datos de la fundación</legend>
        <FormField label="Nombre de la fundación" error={errors.fundacion_nombre?.message} required className="sm:col-span-2">
          <Input autoComplete="organization" {...form.register("fundacion_nombre")} />
        </FormField>
        <FormField label="NIT" error={errors.nit?.message} hint="Con dígito de verificación." required>
          <Input placeholder="901.234.567-1" {...form.register("nit")} />
        </FormField>
        <FormField label="Teléfono de contacto" error={errors.telefono?.message} required>
          <Input type="tel" inputMode="numeric" autoComplete="tel" placeholder="6011234567" {...form.register("telefono")} />
        </FormField>
        <FormField label="Dirección de la sede" error={errors.direccion?.message} required className="sm:col-span-2">
          <Input autoComplete="street-address" placeholder="Calle 00 # 00-00" {...form.register("direccion")} />
        </FormField>
        <FormField label="Ciudad" error={errors.ciudad?.message} required>
          <Input autoComplete="address-level2" {...form.register("ciudad")} />
        </FormField>
        <Controller
          control={form.control}
          name="localidad"
          render={({ field }) => (
            <FormField label="Localidad" hint="Solo para sedes en Bogotá.">
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger onBlur={field.onBlur}>
                  <SelectValue placeholder="Seleccione una localidad" />
                </SelectTrigger>
                <SelectContent>
                  {LOCALIDADES_NOMBRES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
        <FormField
          label="Descripción"
          error={errors.descripcion?.message}
          hint="Misión, tipo de animales que atienden y forma de trabajo."
          required
          className="sm:col-span-2"
        >
          <Textarea rows={4} {...form.register("descripcion")} />
        </FormField>
        <FormField label="Sitio web" error={errors.sitio_web?.message} className="sm:col-span-2">
          <Input type="url" placeholder="https://" {...form.register("sitio_web")} />
        </FormField>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-display text-lg font-semibold">Responsable de la cuenta</legend>
        <FormField label="Nombre completo" error={errors.nombre?.message} required>
          <Input autoComplete="name" {...form.register("nombre")} />
        </FormField>
        <FormField label="Correo electrónico" error={errors.correo?.message} required>
          <Input type="email" autoComplete="email" {...form.register("correo")} />
        </FormField>
        <PasswordFields form={form} errors={errors} />
      </fieldset>

      <DataConsent control={form.control} name="acepta_datos" error={errors.acepta_datos?.message} />
      <Button type="submit" size="lg" variant="secondary" loading={isSubmitting}>
        <Clock aria-hidden="true" />
        Enviar registro para validación
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */

type WithPassword = { contrasena: string; confirmacion: string };

function PasswordFields<T extends WithPassword & FieldValues>({
  form,
  errors,
}: {
  form: { register: ReturnType<typeof useForm<T>>["register"] };
  errors: Partial<Record<"contrasena" | "confirmacion", { message?: string }>>;
}) {
  return (
    <>
      <FormField
        label="Contraseña"
        error={errors.contrasena?.message}
        hint="Mínimo 8 caracteres, con letras y números."
        required
      >
        <PasswordInput autoComplete="new-password" {...form.register("contrasena" as Path<T>)} />
      </FormField>
      <FormField label="Confirmar contraseña" error={errors.confirmacion?.message} required>
        <PasswordInput autoComplete="new-password" {...form.register("confirmacion" as Path<T>)} />
      </FormField>
    </>
  );
}

function DataConsent<T extends FieldValues>({
  control,
  name,
  error,
}: {
  control: Control<T>;
  name: Path<T>;
  error?: string;
}) {
  const id = React.useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-3">
            <Checkbox
              id={id}
              checked={field.value === true}
              onCheckedChange={(v) => field.onChange(v === true)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              className="mt-0.5"
            />
            <label htmlFor={id} className="text-sm leading-relaxed text-muted-foreground">
              Autorizo el tratamiento de mis datos personales para la gestión de adopciones, conforme a la Ley 1581
              de 2012 de protección de datos personales.
            </label>
          </div>
          {error && (
            <p id={`${id}-error`} role="alert" className="pl-8 text-xs font-medium text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    />
  );
}
