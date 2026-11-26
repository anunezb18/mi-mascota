import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ExternalLink, Plus, Save, ShieldX, Trash2 } from "lucide-react";
import * as React from "react";
import { type Control, Controller, useFieldArray, useForm } from "react-hook-form";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoMascotaBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ChipToggle, ChipToggleGroup } from "@/components/ui/toggle-group";
import { useAuth } from "@/features/auth/auth-context";
import { MedicalTimeline } from "@/features/mascotas/components/medical-timeline";
import { ESPECIE_ICON } from "@/features/mascotas/components/pet-image";
import { useMascota } from "@/features/mascotas/hooks";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import {
  ATRIBUTO_ESPECIE_LABEL,
  ESPECIE_LABEL,
  NIVEL_ENERGIA_LABEL,
  SEXO_LABEL,
  TAMANO_LABEL,
  TEMPERAMENTO_LABEL,
  TIPO_REGISTRO_MEDICO_LABEL,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Especie, Mascota, NivelEnergia, Sexo, Tamano, Temperamento } from "@/types";

import { MedicalRecordDialog } from "../components/medical-record-dialog";
import { PhotoUploader } from "../components/photo-uploader";
import { useActualizarMascota, useAgregarRegistroMedico, useCrearMascota, useMiFundacion } from "../hooks";
import { type MascotaFormValues, aPayload, mascotaFormSchema, valoresIniciales } from "../schemas";

const LocationPicker = React.lazy(() => import("../components/location-picker"));

export default function PetFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  useDocumentTitle(editando ? "Editar mascota" : "Nueva mascota");

  const { usuario } = useAuth();
  const fundacion = useMiFundacion();
  const mascota = useMascota(id);

  const cargando = fundacion.isPending || (editando && mascota.isPending);
  if (cargando) return <FormSkeleton />;
  if (fundacion.isError) return <ErrorState error={fundacion.error} onRetry={() => fundacion.refetch()} />;
  if (editando && mascota.isError) return <ErrorState error={mascota.error} onRetry={() => mascota.refetch()} />;

  if (fundacion.data.estado_validacion !== "aprobada") {
    return (
      <EmptyState
        icon={ShieldX}
        tone="secondary"
        title="Publicación no habilitada"
        description="Podrá publicar y editar mascotas cuando el administrador valide la fundación."
        action={
          <Button asChild variant="outline">
            <Link to={paths.fundacion.panel}>Volver al panel</Link>
          </Button>
        }
      />
    );
  }

  if (editando && mascota.data && mascota.data.fundacion_id !== usuario?.fundacion_id) {
    return (
      <EmptyState
        icon={ShieldX}
        tone="secondary"
        title="Esta mascota pertenece a otra fundación"
        description="Solo puede editar las mascotas publicadas por su fundación."
        action={
          <Button asChild variant="outline">
            <Link to={paths.fundacion.mascotas}>Ir a mis mascotas</Link>
          </Button>
        }
      />
    );
  }

  return (
    <PetForm
      key={mascota.data?._id ?? "nueva"}
      mascota={editando ? mascota.data : undefined}
      sede={fundacion.data.ubicacion?.coordinates}
    />
  );
}

/* ------------------------------------------------------------------ */

function PetForm({ mascota, sede }: { mascota?: Mascota; sede?: [number, number] }) {
  const navigate = useNavigate();
  const crear = useCrearMascota();
  const actualizar = useActualizarMascota();
  const agregarRegistro = useAgregarRegistroMedico();
  const [dialogoRegistro, setDialogoRegistro] = React.useState(false);
  const guardado = React.useRef(false);

  const form = useForm<MascotaFormValues>({
    resolver: zodResolver(mascotaFormSchema),
    defaultValues: valoresIniciales(mascota, sede),
  });
  const { errors, isSubmitting, isDirty } = form.formState;
  const especie = form.watch("especie");
  const historial = useFieldArray({ control: form.control, name: "historial_medico" });

  // Aviso al salir con cambios sin guardar
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !guardado.current && currentLocation.pathname !== nextLocation.pathname,
  );

  const onSubmit = form.handleSubmit(
    async (values) => {
      try {
        const payload = aPayload(values);
        if (mascota) {
          const { historial_medico: _sinHistorial, ...cambios } = payload;
          await actualizar.mutateAsync({ id: mascota._id, payload: cambios });
          guardado.current = true;
          toast.success("Cambios guardados", { description: `La publicación de ${values.nombre} está actualizada.` });
        } else {
          const nueva = await crear.mutateAsync(payload);
          guardado.current = true;
          toast.success(`${nueva.nombre} ya está publicada`, {
            description: "Ya aparece en el catálogo y en las recomendaciones compatibles.",
            action: { label: "Ver publicación", onClick: () => navigate(paths.mascota(nueva._id)) },
          });
        }
        navigate(paths.fundacion.mascotas);
      } catch (error) {
        form.setError("root", { message: getErrorMessage(error) });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    () => toast.error("Revise el formulario", { description: "Hay campos con datos faltantes o inválidos." }),
  );

  const guardarRegistro = async (r: Parameters<React.ComponentProps<typeof MedicalRecordDialog>["onSave"]>[0]) => {
    if (mascota) {
      await agregarRegistro.mutateAsync({
        id: mascota._id,
        registro: {
          fecha: new Date(`${r.fecha}T12:00:00`).toISOString(),
          tipo: r.tipo,
          descripcion: r.descripcion.trim(),
          veterinario: r.veterinario?.trim() || undefined,
        },
      });
      toast.success("Registro agregado al historial médico");
    } else {
      historial.append(r);
    }
  };

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-4">
        <Link to={paths.fundacion.mascotas}>
          <ArrowLeft aria-hidden="true" />
          Gestión de mascotas
        </Link>
      </Button>

      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            {mascota ? "Editar publicación" : "Nueva publicación"}
          </p>
          <h1 className="flex flex-wrap items-center gap-3 font-display text-display-sm font-semibold md:text-display-md">
            {mascota ? mascota.nombre : "Publicar una mascota"}
            {mascota && <EstadoMascotaBadge estado={mascota.estado} />}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {mascota
              ? `Publicada el ${formatDate(mascota.fecha_publicacion)}. Los cambios se reflejan de inmediato en el catálogo.`
              : "Los campos marcados con * son obligatorios. La mascota aparecerá en el catálogo como disponible."}
          </p>
        </div>
        {mascota && (
          <Button asChild variant="outline">
            <Link to={paths.mascota(mascota._id)}>
              <ExternalLink aria-hidden="true" />
              Ver publicación
            </Link>
          </Button>
        )}
      </header>

      <form onSubmit={onSubmit} noValidate className="flex max-w-4xl flex-col gap-6">
        {errors.root && <Alert variant="destructive">{errors.root.message}</Alert>}

        {/* 1. Datos básicos */}
        <Section title="Datos básicos" description="Identificación de la mascota.">
          <Controller
            control={form.control}
            name="especie"
            render={({ field }) => (
              <fieldset>
                <legend className="mb-3 text-sm font-semibold">
                  Especie <span className="text-destructive" aria-hidden="true">*</span>
                </legend>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid-cols-3">
                  {(Object.keys(ESPECIE_LABEL) as Especie[]).map((e) => {
                    const Icon = ESPECIE_ICON[e];
                    const activo = field.value === e;
                    return (
                      <RadioCard key={e} value={e} className="items-center gap-2 py-4 text-center">
                        <Icon className={cn("size-6", activo ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                        <span className="text-sm font-semibold">{ESPECIE_LABEL[e]}</span>
                      </RadioCard>
                    );
                  })}
                </RadioGroup>
                {mascota && field.value !== mascota.especie && (
                  <p className="mt-2 text-xs text-warning">
                    Al cambiar la especie se reemplazarán las características específicas guardadas.
                  </p>
                )}
              </fieldset>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Nombre" error={errors.nombre?.message} required>
              <Input {...form.register("nombre")} />
            </FormField>
            <FormField label="Raza" error={errors.raza?.message} hint="Escriba «Mestizo» si no tiene raza definida." required>
              <Input {...form.register("raza")} />
            </FormField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="sexo"
              render={({ field }) => (
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold">
                    Sexo <span className="text-destructive" aria-hidden="true">*</span>
                  </legend>
                  <RadioGroup value={field.value ?? ""} onValueChange={field.onChange} className="grid-cols-2">
                    {(Object.keys(SEXO_LABEL) as Sexo[]).map((s) => (
                      <RadioCard key={s} value={s} className="items-center py-3 text-center text-sm font-semibold">
                        {SEXO_LABEL[s]}
                      </RadioCard>
                    ))}
                  </RadioGroup>
                  {errors.sexo && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{errors.sexo.message}</p>}
                </fieldset>
              )}
            />
            <Controller
              control={form.control}
              name="tamano"
              render={({ field }) => (
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold">
                    Tamaño <span className="text-destructive" aria-hidden="true">*</span>
                  </legend>
                  <RadioGroup value={field.value ?? ""} onValueChange={field.onChange} className="grid-cols-3">
                    {(Object.keys(TAMANO_LABEL) as Tamano[]).map((t) => (
                      <RadioCard key={t} value={t} className="items-center px-2 py-3 text-center text-sm font-semibold">
                        {TAMANO_LABEL[t]}
                      </RadioCard>
                    ))}
                  </RadioGroup>
                  {errors.tamano && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{errors.tamano.message}</p>}
                </fieldset>
              )}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-[1fr_1fr_1.4fr] sm:items-start">
            <FormField label="Edad: años" error={errors.edad_anios?.message} required>
              <Input type="number" inputMode="numeric" min={0} max={30} {...form.register("edad_anios", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Meses adicionales" error={errors.edad_meses?.message} hint="De 0 a 11.">
              <Input type="number" inputMode="numeric" min={0} max={11} {...form.register("edad_meses", { valueAsNumber: true })} />
            </FormField>
            <Controller
              control={form.control}
              name="esterilizado"
              render={({ field }) => (
                <SwitchRow
                  id="esterilizado"
                  label="Esterilizado(a)"
                  description="La esterilización también puede quedar en el historial médico."
                  checked={field.value}
                  onChange={field.onChange}
                  className="sm:mt-7"
                />
              )}
            />
          </div>
        </Section>

        {/* 2. Descripción y temperamento */}
        <Section title="Descripción y temperamento" description="Lo que un adoptante necesita saber para decidir.">
          <FormField
            label="Descripción"
            error={errors.descripcion?.message}
            hint={`Historia, comportamiento, cuidados especiales. ${form.watch("descripcion")?.length ?? 0}/2000`}
            required
          >
            <Textarea rows={5} maxLength={2000} {...form.register("descripcion")} />
          </FormField>
          <Controller
            control={form.control}
            name="temperamento"
            render={({ field }) => (
              <fieldset>
                <legend className="text-sm font-semibold">
                  Temperamento <span className="text-destructive" aria-hidden="true">*</span>
                </legend>
                <p className="mb-3 mt-1 text-xs text-muted-foreground">Seleccione de 1 a 4 rasgos.</p>
                <ChipToggleGroup
                  type="multiple"
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as Temperamento[])}
                  className="flex flex-wrap gap-2"
                  aria-label="Temperamento"
                >
                  {(Object.keys(TEMPERAMENTO_LABEL) as Temperamento[]).map((t) => (
                    <ChipToggle
                      key={t}
                      value={t}
                      disabled={field.value.length >= 4 && !field.value.includes(t)}
                      className="disabled:opacity-40"
                    >
                      {TEMPERAMENTO_LABEL[t]}
                    </ChipToggle>
                  ))}
                </ChipToggleGroup>
                {errors.temperamento && (
                  <p role="alert" className="mt-2 text-xs font-medium text-destructive">
                    {errors.temperamento.message}
                  </p>
                )}
              </fieldset>
            )}
          />
        </Section>

        {/* 3. Fotos */}
        <Section
          title="Fotos"
          description="Hasta 6 fotos en JPG, PNG o WebP. La primera es la portada en el catálogo; use fotos con buena luz donde se vea el rostro."
        >
          <Controller
            control={form.control}
            name="fotos"
            render={({ field }) => (
              <>
                <PhotoUploader
                  value={field.value}
                  onChange={field.onChange}
                  invalid={Boolean(errors.fotos)}
                  describedBy={errors.fotos ? "fotos-error" : undefined}
                />
                {errors.fotos && (
                  <p id="fotos-error" role="alert" className="text-xs font-medium text-destructive">
                    {errors.fotos.message}
                  </p>
                )}
              </>
            )}
          />
        </Section>

        {/* 4. Atributos de la especie */}
        <Section
          title={`Características de ${ESPECIE_LABEL[especie].toLowerCase()}`}
          description="Estos campos cambian según la especie y se usan para calcular la compatibilidad con los adoptantes."
        >
          <SpeciesAttributesFields especie={especie} control={form.control} />
        </Section>

        {/* 5. Ubicación */}
        <Section
          title="Ubicación"
          description="Sede u hogar de paso donde se encuentra la mascota. Se usa en la búsqueda por cercanía y se muestra de forma aproximada."
        >
          <Controller
            control={form.control}
            name="ubicacion"
            render={({ field }) => (
              <>
                <React.Suspense fallback={<Skeleton className="h-72 rounded-xl" />}>
                  <LocationPicker value={field.value} onChange={field.onChange} sede={sede} />
                </React.Suspense>
                {errors.ubicacion && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.ubicacion.message}
                  </p>
                )}
              </>
            )}
          />
        </Section>

        {/* 6. Historial médico */}
        <Section
          title="Historial médico"
          description={
            mascota
              ? "Los registros nuevos se guardan de inmediato en el historial de la mascota."
              : "Opcional. Registre vacunas, desparasitaciones y procedimientos ya realizados."
          }
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => setDialogoRegistro(true)}>
              <Plus aria-hidden="true" />
              Agregar registro
            </Button>
          }
        >
          {mascota ? (
            <MedicalTimeline registros={mascota.historial_medico} />
          ) : historial.fields.length === 0 ? (
            <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">Aún no ha agregado registros.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {historial.fields.map((r, i) => (
                <li key={r.id} className="flex items-start gap-3 rounded-xl border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{TIPO_REGISTRO_MEDICO_LABEL[r.tipo]}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{formatDate(`${r.fecha}T12:00:00`)}</span>
                    </p>
                    <p className="text-sm text-arena-700">{r.descripcion}</p>
                    {r.veterinario && <p className="text-xs text-muted-foreground">{r.veterinario}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => historial.remove(i)}
                    aria-label={`Quitar registro de ${TIPO_REGISTRO_MEDICO_LABEL[r.tipo].toLowerCase()}`}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Barra de acciones: se mantiene visible al pie mientras se recorre el formulario */}
        <div className="sticky bottom-0 z-30 -mx-4 flex items-center justify-end gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-t-2xl lg:border-x lg:px-5">
          <Button type="button" variant="outline" onClick={() => navigate(paths.fundacion.mascotas)}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <Save aria-hidden="true" />
            {mascota ? "Guardar cambios" : "Publicar mascota"}
          </Button>
        </div>
      </form>

      <MedicalRecordDialog
        open={dialogoRegistro}
        onOpenChange={setDialogoRegistro}
        nombreMascota={mascota?.nombre ?? (form.watch("nombre") || undefined)}
        onSave={guardarRegistro}
      />

      <AlertDialog open={blocker.state === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tiene cambios sin guardar en este formulario. Si sale ahora, se perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => blocker.proceed?.()}
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">{children}</CardContent>
    </Card>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onChange,
  className,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3", className)}>
      <div>
        <Label htmlFor={id}>{label}</Label>
        {description && (
          <p id={`${id}-desc`} className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} aria-describedby={description ? `${id}-desc` : undefined} />
    </div>
  );
}

const DESCRIPCION_ATRIBUTO: Record<string, string> = {
  necesita_patio: "Requiere patio o zona verde propia.",
  apto_con_ninos: "Ha convivido sin problemas con niños.",
  apto_con_gatos: "Tolera la presencia de gatos.",
  apto_con_perros: "Tolera la presencia de perros.",
  entrenado: "Conoce órdenes básicas y camina con traílla.",
  usa_arenero: "Hace sus necesidades en el arenero.",
  solo_interior: "Debe vivir sin acceso a la calle.",
  requiere_jaula_amplia: "Necesita un espacio amplio para moverse.",
};

/** Campos variables según la especie (subdocumento `atributos_especie`). */
function SpeciesAttributesFields({ especie, control }: { especie: Especie; control: Control<MascotaFormValues> }) {
  const switches = {
    perro: ["necesita_patio", "apto_con_ninos", "apto_con_gatos", "entrenado"],
    gato: ["usa_arenero", "apto_con_ninos", "apto_con_perros", "solo_interior"],
    conejo: ["usa_arenero", "apto_con_ninos", "requiere_jaula_amplia"],
  }[especie];
  const prefijo = `atributos_${especie}` as const;

  return (
    <div key={especie} className="flex animate-fade-up flex-col gap-5">
      {especie === "perro" && (
        <Controller
          control={control}
          name="atributos_perro.nivel_energia"
          render={({ field }) => (
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">Nivel de energía</legend>
              <ChipToggleGroup
                type="single"
                value={field.value}
                onValueChange={(v) => v && field.onChange(v as NivelEnergia)}
                className="flex flex-wrap gap-2"
                aria-label="Nivel de energía"
              >
                {(Object.keys(NIVEL_ENERGIA_LABEL) as NivelEnergia[]).map((n) => (
                  <ChipToggle key={n} value={n} className="h-10 px-5">
                    {NIVEL_ENERGIA_LABEL[n]}
                  </ChipToggle>
                ))}
              </ChipToggleGroup>
            </fieldset>
          )}
        />
      )}
      {especie === "conejo" && (
        <Controller
          control={control}
          name="atributos_conejo.tipo_pelaje"
          render={({ field }) => (
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">Tipo de pelaje</legend>
              <ChipToggleGroup
                type="single"
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
                className="flex flex-wrap gap-2"
                aria-label="Tipo de pelaje"
              >
                <ChipToggle value="corto" className="h-10 px-5">Corto</ChipToggle>
                <ChipToggle value="largo" className="h-10 px-5">Largo</ChipToggle>
              </ChipToggleGroup>
            </fieldset>
          )}
        />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {switches.map((clave) => (
          <Controller
            key={`${prefijo}.${clave}`}
            control={control}
            // Las claves dependen de la especie; el esquema garantiza su existencia
            name={`${prefijo}.${clave}` as "atributos_perro.necesita_patio"}
            render={({ field }) => (
              <SwitchRow
                id={`${prefijo}-${clave}`}
                label={ATRIBUTO_ESPECIE_LABEL[clave]}
                description={DESCRIPCION_ATRIBUTO[clave]}
                checked={Boolean(field.value)}
                onChange={field.onChange}
              />
            )}
          />
        ))}
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div role="status" aria-label="Cargando formulario" className="flex max-w-4xl flex-col gap-6">
      <Skeleton className="h-10 w-72" />
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
      ))}
    </div>
  );
}
