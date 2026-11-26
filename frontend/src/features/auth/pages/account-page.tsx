import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CalendarDays, HeartHandshake, KeyRound, LayoutDashboard, Mail, MapPin, Pencil, UserRound } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PasswordInput } from "@/components/ui/password-input";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoValidacionBadge } from "@/components/ui/status-badge";
import { useMiFundacion } from "@/features/fundacion/hooks";
import { LifestyleSummary } from "@/features/recomendaciones/components/lifestyle-summary";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { ROL_LABEL } from "@/lib/labels";
import { initials } from "@/lib/utils";
import { homeForRole, paths } from "@/routes/paths";
import type { Usuario } from "@/types";

import { useAuth } from "../auth-context";
import { useActualizarCuenta, useCambiarContrasena } from "../hooks";
import {
  type CambiarContrasenaValues,
  type CuentaValues,
  cambiarContrasenaSchema,
  cuentaSchema,
} from "../schemas";

export default function AccountPage() {
  useDocumentTitle("Mi cuenta");
  const { usuario } = useAuth();
  if (!usuario) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Cuenta" title="Mi cuenta" description="Consulte y actualice sus datos personales y la seguridad de su cuenta." />

      <div className="flex flex-col gap-6">
        <ProfileSummary usuario={usuario} />
        {usuario.rol === "adoptante" && <LifestyleSection usuario={usuario} />}
        {usuario.rol === "fundacion" && <FoundationSection />}
        <PersonalDataSection usuario={usuario} />
        <PasswordSection />
      </div>
    </div>
  );
}

/** Tarjeta de sección con título a la izquierda (escritorio) y contenido a la derecha. */
function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <section aria-labelledby={id} className="grid gap-6 rounded-2xl border bg-card p-5 shadow-card sm:p-6 lg:grid-cols-[15rem_1fr] lg:gap-10">
      <div>
        <span className="mb-3 grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h2 id={id} className="font-display text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ProfileSummary({ usuario }: { usuario: Usuario }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-card sm:p-6">
      <div aria-hidden="true" className="bg-dots pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-60" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-16 text-lg">
          <AvatarFallback className="bg-primary text-lg text-primary-foreground">{initials(usuario.nombre)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-2xl font-semibold leading-tight">{usuario.nombre}</p>
            <Badge variant="secondary">{ROL_LABEL[usuario.rol]}</Badge>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Mail className="size-4" aria-hidden="true" />
              {usuario.correo}
            </li>
            {usuario.ciudad && (
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" />
                {usuario.ciudad}
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" />
              Miembro desde {formatDate(usuario.fecha_registro)}
            </li>
          </ul>
        </div>
        {usuario.rol !== "adoptante" && (
          <Button asChild variant="outline" className="sm:self-center">
            <Link to={homeForRole(usuario.rol)}>
              <LayoutDashboard aria-hidden="true" />
              Ir a mi panel
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function PersonalDataSection({ usuario }: { usuario: Usuario }) {
  const actualizar = useActualizarCuenta();
  const telefonoObligatorio = usuario.rol === "fundacion";
  const valores = (u: Usuario): CuentaValues => ({ nombre: u.nombre, telefono: u.telefono ?? "", ciudad: u.ciudad ?? "" });
  const form = useForm<CuentaValues>({
    resolver: zodResolver(cuentaSchema(telefonoObligatorio)),
    defaultValues: valores(usuario),
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const actualizado = await actualizar.mutateAsync(values);
      form.reset(valores(actualizado));
      toast.success("Datos actualizados");
    } catch (e) {
      toast.error("No fue posible guardar los cambios", { description: getErrorMessage(e) });
    }
  });

  return (
    <SettingsCard
      icon={UserRound}
      title="Datos personales"
      description={
        usuario.rol === "adoptante"
          ? "La fundación verá su nombre, teléfono y ciudad cuando revise sus solicitudes."
          : "Datos de contacto de la persona responsable de la cuenta."
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
        <FormField label="Nombre completo" error={errors.nombre?.message} required className="sm:col-span-2">
          <Input autoComplete="name" {...form.register("nombre")} />
        </FormField>
        <FormField
          label="Correo electrónico"
          hint="Es su usuario de acceso y no se puede cambiar."
          className="sm:col-span-2"
        >
          <Input type="email" value={usuario.correo} readOnly disabled />
        </FormField>
        <FormField
          label="Teléfono"
          error={errors.telefono?.message}
          required={telefonoObligatorio}
          hint={telefonoObligatorio ? undefined : "Opcional."}
        >
          <Input type="tel" inputMode="numeric" autoComplete="tel" placeholder="3001234567" {...form.register("telefono")} />
        </FormField>
        <FormField label="Ciudad" error={errors.ciudad?.message} hint="Opcional.">
          <Input autoComplete="address-level2" placeholder="Bogotá" {...form.register("ciudad")} />
        </FormField>
        <div className="flex justify-end gap-2 sm:col-span-2">
          {isDirty && (
            <Button type="button" variant="ghost" onClick={() => form.reset(valores(usuario))} disabled={actualizar.isPending}>
              Descartar
            </Button>
          )}
          <Button type="submit" disabled={!isDirty} loading={actualizar.isPending}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </SettingsCard>
  );
}

const CONTRASENA_VACIA: CambiarContrasenaValues = { contrasena_actual: "", contrasena: "", confirmacion: "" };

function PasswordSection() {
  const cambiar = useCambiarContrasena();
  const [error, setError] = React.useState<string | null>(null);
  const form = useForm<CambiarContrasenaValues>({
    resolver: zodResolver(cambiarContrasenaSchema),
    defaultValues: CONTRASENA_VACIA,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async ({ contrasena_actual, contrasena }) => {
    setError(null);
    try {
      await cambiar.mutateAsync({ contrasena_actual, contrasena_nueva: contrasena });
      form.reset(CONTRASENA_VACIA);
      toast.success("Contraseña actualizada", { description: "Úsela la próxima vez que inicie sesión." });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  });

  return (
    <SettingsCard
      icon={KeyRound}
      title="Seguridad"
      description="Use al menos 8 caracteres con letras y números. No la comparta con nadie."
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
        <FormField label="Contraseña actual" error={errors.contrasena_actual?.message} required className="sm:col-span-2">
          <PasswordInput autoComplete="current-password" {...form.register("contrasena_actual")} />
        </FormField>
        <FormField label="Nueva contraseña" error={errors.contrasena?.message} required>
          <PasswordInput autoComplete="new-password" {...form.register("contrasena")} />
        </FormField>
        <FormField label="Confirmar nueva contraseña" error={errors.confirmacion?.message} required>
          <PasswordInput autoComplete="new-password" {...form.register("confirmacion")} />
        </FormField>
        {error && (
          <Alert variant="destructive" className="sm:col-span-2">
            {error}
          </Alert>
        )}
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" loading={cambiar.isPending}>
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </SettingsCard>
  );
}

function LifestyleSection({ usuario }: { usuario: Usuario }) {
  const perfil = usuario.perfil_estilo_vida;
  return (
    <SettingsCard
      icon={HeartHandshake}
      title="Perfil de estilo de vida"
      description={
        perfil?.actualizado_en
          ? `Actualizado el ${formatDate(perfil.actualizado_en)}. Lo usamos para calcular sus recomendaciones.`
          : "Lo usamos para calcular sus recomendaciones y es necesario para enviar solicitudes."
      }
    >
      {perfil ? (
        <div className="flex flex-col gap-5">
          <LifestyleSummary perfil={perfil} />
          <div className="flex justify-end">
            <Button asChild variant="outline">
              <Link to={paths.adoptante.perfil}>
                <Pencil aria-hidden="true" />
                Actualizar perfil
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <Alert variant="info" title="Aún no ha completado su perfil">
          <p>Responda unas preguntas sobre su hogar y su rutina para recibir recomendaciones compatibles.</p>
          <Button asChild size="sm" className="mt-3">
            <Link to={paths.adoptante.perfil}>Completar perfil</Link>
          </Button>
        </Alert>
      )}
    </SettingsCard>
  );
}

function FoundationSection() {
  const { data: f, isPending, isError } = useMiFundacion();
  return (
    <SettingsCard
      icon={Building2}
      title="Fundación"
      description="Datos verificados durante la validación del registro. No se pueden editar desde la cuenta."
    >
      {isPending ? (
        <div className="flex flex-col gap-3" role="status" aria-label="Cargando datos de la fundación">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      ) : isError || !f ? (
        <Alert variant="destructive">No fue posible cargar los datos de la fundación.</Alert>
      ) : (
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Dato etiqueta="Nombre">{f.nombre}</Dato>
          <Dato etiqueta="Estado">
            <EstadoValidacionBadge estado={f.estado_validacion} />
          </Dato>
          <Dato etiqueta="NIT">
            <span className="tabular-nums">{f.nit}</span>
          </Dato>
          <Dato etiqueta="Teléfono">{f.telefono}</Dato>
          <Dato etiqueta="Dirección">
            {f.direccion}
            <span className="block text-muted-foreground">{[f.localidad, f.ciudad].filter(Boolean).join(", ")}</span>
          </Dato>
          {f.sitio_web && (
            <Dato etiqueta="Sitio web">
              <a href={f.sitio_web} target="_blank" rel="noreferrer noopener" className="font-medium text-primary underline-offset-4 hover:underline">
                {f.sitio_web.replace(/^https?:\/\//, "")}
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
            </Dato>
          )}
        </dl>
      )}
    </SettingsCard>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium">{children}</dd>
    </div>
  );
}
