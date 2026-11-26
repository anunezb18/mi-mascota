import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Check,
  Clock,
  Heart,
  Home,
  type LucideIcon,
  Save,
  Trees,
  Users,
} from "lucide-react";
import * as React from "react";
import { Controller, type FieldPath, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { ChipToggle, ChipToggleGroup } from "@/components/ui/toggle-group";
import { useAuth } from "@/features/auth/auth-context";
import { ESPECIE_ICON } from "@/features/mascotas/components/pet-image";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { ESPECIE_PLURAL, TAMANO_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Especie, Tamano } from "@/types";

import { LifestyleSummary } from "../components/lifestyle-summary";
import { OptionCard, Question, YesNo } from "../components/wizard-fields";
import { useGuardarPerfil } from "../hooks";
import { type PerfilValues, perfilSchema } from "../schemas";

interface Step {
  title: string;
  short: string;
  description: string;
  icon: LucideIcon;
  fields: FieldPath<PerfilValues>[];
}

const STEPS: Step[] = [
  {
    title: "Su vivienda",
    short: "Vivienda",
    description: "El espacio disponible determina qué tamaño y nivel de energía son adecuados.",
    icon: Home,
    fields: ["tipo_vivienda", "tiene_patio"],
  },
  {
    title: "Su rutina",
    short: "Rutina",
    description: "Cada mascota requiere un tiempo diario de compañía, paseos y juego.",
    icon: Clock,
    fields: ["horas_disponibles", "experiencia_previa"],
  },
  {
    title: "Su hogar",
    short: "Hogar",
    description: "La convivencia con niños y otros animales es clave para una adopción exitosa.",
    icon: Users,
    fields: ["tiene_ninos", "tiene_otras_mascotas", "otras_mascotas"],
  },
  {
    title: "Sus preferencias",
    short: "Preferencias",
    description: "Opcional. Si no selecciona nada, consideraremos todas las opciones.",
    icon: Heart,
    fields: ["especies_preferidas", "tamanos_preferidos"],
  },
  {
    title: "Confirmación",
    short: "Resumen",
    description: "Revise sus respuestas. Las fundaciones verán este perfil al evaluar sus solicitudes.",
    icon: Check,
    fields: [],
  },
];

const ESPECIES = Object.keys(ESPECIE_PLURAL) as Especie[];
const TAMANOS = Object.keys(TAMANO_LABEL) as Tamano[];

function describirHoras(h: number) {
  if (h <= 2) return "Ideal para gatos, conejos o perros de baja energía.";
  if (h <= 4) return "Suficiente para perros de energía media y la mayoría de gatos.";
  return "Permite acompañar incluso a perros muy activos.";
}

export default function LifestyleWizardPage() {
  useDocumentTitle("Perfil de estilo de vida");
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const guardar = useGuardarPerfil();
  const existente = usuario?.perfil_estilo_vida;

  const [step, setStep] = React.useState(0);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const prevStep = React.useRef(step);

  const form = useForm<PerfilValues>({
    resolver: zodResolver(perfilSchema),
    mode: "onTouched",
    defaultValues: existente
      ? {
          tipo_vivienda: existente.tipo_vivienda,
          tiene_patio: existente.tiene_patio,
          horas_disponibles: existente.horas_disponibles,
          experiencia_previa: existente.experiencia_previa,
          tiene_ninos: existente.tiene_ninos,
          tiene_otras_mascotas: existente.tiene_otras_mascotas,
          otras_mascotas: existente.otras_mascotas,
          especies_preferidas: existente.especies_preferidas,
          tamanos_preferidos: existente.tamanos_preferidos,
        }
      : { horas_disponibles: 3, otras_mascotas: [], especies_preferidas: [], tamanos_preferidos: [] },
  });
  const { errors, isSubmitting } = form.formState;
  const values = form.watch();

  // Al cambiar de paso, el foco va al título para lectores de pantalla y teclado
  // (solo cuando el paso cambia de verdad; no en el montaje inicial)
  React.useEffect(() => {
    if (prevStep.current !== step) headingRef.current?.focus();
    prevStep.current = step;
  }, [step]);

  const next = async () => {
    const valid = await form.trigger(STEPS[step].fields, { shouldFocus: true });
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await guardar.mutateAsync({ ...v, otras_mascotas: v.tiene_otras_mascotas ? v.otras_mascotas : [] });
      toast.success(existente ? "Perfil actualizado" : "Perfil guardado", {
        description: "Calculamos de nuevo sus recomendaciones.",
      });
      navigate(from ?? paths.adoptante.recomendaciones);
    } catch (error) {
      form.setError("root", { message: getErrorMessage(error) });
    }
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const StepIcon = current.icon;

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Perfil de estilo de vida</p>
        <h1 className="mt-2 font-display text-display-sm font-semibold md:text-display-md">
          {existente ? "Actualice su perfil" : "Cuéntenos sobre su hogar"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {existente?.actualizado_en
            ? `Última actualización: ${formatDate(existente.actualizado_en)}. `
            : ""}
          Con sus respuestas calculamos la compatibilidad con cada mascota.
        </p>
      </header>

      <Stepper current={step} onSelect={(i) => i < step && setStep(i)} />

      <Card className="mt-6 overflow-hidden">
        <form onSubmit={isLast ? onSubmit : (e) => (e.preventDefault(), void next())} noValidate>
          <div className="flex items-start gap-4 border-b bg-muted/40 p-5 sm:p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <StepIcon className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Paso {step + 1} de {STEPS.length}
              </p>
              <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-semibold focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                {current.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>
            </div>
          </div>

          <div key={step} className="flex animate-fade-up flex-col gap-8 p-5 sm:p-8">
            {step === 0 && (
              <>
                <Controller
                  control={form.control}
                  name="tipo_vivienda"
                  render={({ field }) => (
                    <Question title="¿En qué tipo de vivienda reside?" error={errors.tipo_vivienda?.message}>
                      <RadioGroup value={field.value ?? ""} onValueChange={field.onChange} className="sm:grid-cols-3">
                        <OptionCard value="apartamento" icon={Building} title="Apartamento" description="Espacio interior, sin acceso directo a zona verde." selected={field.value === "apartamento"} />
                        <OptionCard value="casa" icon={Home} title="Casa" description="Más espacio interior; puede tener patio." selected={field.value === "casa"} />
                        <OptionCard value="finca" icon={Trees} title="Finca o casa campestre" description="Amplias zonas exteriores." selected={field.value === "finca"} />
                      </RadioGroup>
                    </Question>
                  )}
                />
                <Controller
                  control={form.control}
                  name="tiene_patio"
                  render={({ field }) => (
                    <Question
                      title="¿Cuenta con patio, terraza o zona verde privada?"
                      hint="Algunos perros grandes o muy activos lo necesitan."
                      error={errors.tiene_patio?.message}
                    >
                      <YesNo value={field.value} onChange={field.onChange} invalid={Boolean(errors.tiene_patio)} />
                    </Question>
                  )}
                />
              </>
            )}

            {step === 1 && (
              <>
                <Controller
                  control={form.control}
                  name="horas_disponibles"
                  render={({ field }) => (
                    <Question
                      title="¿Cuántas horas al día puede dedicarle a su mascota?"
                      hint="Incluya paseos, juego y tiempo de compañía en casa."
                    >
                      <div className="rounded-2xl border bg-card p-5">
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="font-display text-4xl font-semibold text-primary" aria-live="polite">
                            {field.value} <span className="text-lg text-foreground">{field.value === 1 ? "hora" : "horas"}</span>
                          </p>
                          <p className="max-w-[16rem] text-right text-sm text-muted-foreground">{describirHoras(field.value)}</p>
                        </div>
                        <Slider
                          className="mt-4"
                          min={1}
                          max={12}
                          step={1}
                          value={[field.value]}
                          onValueChange={([v]) => field.onChange(v)}
                          thumbLabel="Horas disponibles al día"
                        />
                        <div className="mt-1 flex justify-between text-xs text-muted-foreground" aria-hidden="true">
                          <span>1 h</span>
                          <span>12 h o más</span>
                        </div>
                      </div>
                    </Question>
                  )}
                />
                <Controller
                  control={form.control}
                  name="experiencia_previa"
                  render={({ field }) => (
                    <Question title="¿Ha tenido mascotas anteriormente?" error={errors.experiencia_previa?.message}>
                      <YesNo value={field.value} onChange={field.onChange} invalid={Boolean(errors.experiencia_previa)} />
                    </Question>
                  )}
                />
              </>
            )}

            {step === 2 && (
              <>
                <Controller
                  control={form.control}
                  name="tiene_ninos"
                  render={({ field }) => (
                    <Question title="¿Viven niños menores de 12 años en el hogar?" error={errors.tiene_ninos?.message}>
                      <YesNo value={field.value} onChange={field.onChange} invalid={Boolean(errors.tiene_ninos)} />
                    </Question>
                  )}
                />
                <Controller
                  control={form.control}
                  name="tiene_otras_mascotas"
                  render={({ field }) => (
                    <Question title="¿Convive actualmente con otras mascotas?" error={errors.tiene_otras_mascotas?.message}>
                      <YesNo value={field.value} onChange={field.onChange} invalid={Boolean(errors.tiene_otras_mascotas)} />
                    </Question>
                  )}
                />
                {values.tiene_otras_mascotas && (
                  <Controller
                    control={form.control}
                    name="otras_mascotas"
                    render={({ field }) => (
                      <Question title="¿Cuáles?" hint="Seleccione todas las que apliquen." error={errors.otras_mascotas?.message}>
                        <SpeciesChips value={field.value} onChange={field.onChange} label="Mascotas actuales" />
                      </Question>
                    )}
                  />
                )}
              </>
            )}

            {step === 3 && (
              <>
                <Controller
                  control={form.control}
                  name="especies_preferidas"
                  render={({ field }) => (
                    <Question title="¿Qué especies le interesan?" hint="Puede elegir varias.">
                      <SpeciesChips value={field.value} onChange={field.onChange} label="Especies de interés" />
                    </Question>
                  )}
                />
                <Controller
                  control={form.control}
                  name="tamanos_preferidos"
                  render={({ field }) => (
                    <Question title="¿Qué tamaños prefiere?" hint="Puede elegir varios.">
                      <ChipToggleGroup
                        type="multiple"
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-wrap gap-2"
                        aria-label="Tamaños de interés"
                      >
                        {TAMANOS.map((t) => (
                          <ChipToggle key={t} value={t} className="h-11 px-5">
                            {TAMANO_LABEL[t]}
                          </ChipToggle>
                        ))}
                      </ChipToggleGroup>
                    </Question>
                  )}
                />
              </>
            )}

            {step === 4 && (
              <>
                {errors.root && <Alert variant="destructive">{errors.root.message}</Alert>}
                <LifestyleSummary
                  perfil={{
                    ...form.getValues(),
                    otras_mascotas: values.tiene_otras_mascotas ? values.otras_mascotas : [],
                  }}
                />
                <Alert variant="info">
                  Puede actualizar su perfil en cualquier momento desde el menú de su cuenta. Las solicitudes ya
                  enviadas conservan el perfil vigente al momento de enviarlas.
                </Alert>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t p-5 sm:px-8">
            <Button type="button" variant="ghost" onClick={back} disabled={step === 0} className={cn(step === 0 && "invisible")}>
              <ArrowLeft aria-hidden="true" />
              Atrás
            </Button>
            {isLast ? (
              <Button type="submit" size="lg" loading={isSubmitting}>
                <Save aria-hidden="true" />
                Guardar perfil
              </Button>
            ) : (
              <Button type="submit" size="lg">
                Siguiente
                <ArrowRight aria-hidden="true" />
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

function Stepper({ current, onSelect }: { current: number; onSelect: (index: number) => void }) {
  return (
    <nav aria-label="Progreso del asistente">
      <Progress
        value={((current + 1) / STEPS.length) * 100}
        className="h-1.5 sm:hidden"
        aria-label={`Paso ${current + 1} de ${STEPS.length}`}
      />
      <ol className="hidden items-center sm:flex">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.short} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => onSelect(i)}
                disabled={!done}
                aria-current={active ? "step" : undefined}
                className="flex items-center gap-2 rounded-full py-1 pr-2 text-sm font-semibold disabled:cursor-default"
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full border-2 text-xs transition-colors",
                    done && "border-secondary bg-secondary text-secondary-foreground",
                    active && "border-primary bg-primary text-primary-foreground",
                    !done && !active && "border-arena-300 bg-card text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden="true" /> : i + 1}
                </span>
                <span className={cn(active ? "text-foreground" : "text-muted-foreground")}>{s.short}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className={cn("mx-2 h-0.5 flex-1 rounded-full", done ? "bg-secondary" : "bg-arena-200")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SpeciesChips({
  value,
  onChange,
  label,
}: {
  value: Especie[];
  onChange: (value: Especie[]) => void;
  label: string;
}) {
  return (
    <ChipToggleGroup
      type="multiple"
      value={value}
      onValueChange={(v) => onChange(v as Especie[])}
      className="flex flex-wrap gap-2"
      aria-label={label}
    >
      {ESPECIES.map((e) => {
        const Icon = ESPECIE_ICON[e];
        return (
          <ChipToggle key={e} value={e} className="h-11 px-5">
            <Icon aria-hidden="true" />
            {ESPECIE_PLURAL[e]}
          </ChipToggle>
        );
      })}
    </ChipToggleGroup>
  );
}
