import { Bug, ClipboardX, HeartPulse, type LucideIcon, Pill, Scissors, Stethoscope, Syringe } from "lucide-react";

import { formatDate } from "@/lib/format";
import { TIPO_REGISTRO_MEDICO_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { RegistroMedico, TipoRegistroMedico } from "@/types";

const TIPO_STYLE: Record<TipoRegistroMedico, { icon: LucideIcon; className: string }> = {
  vacuna: { icon: Syringe, className: "bg-info-soft text-info" },
  desparasitacion: { icon: Bug, className: "bg-secondary-soft text-secondary" },
  esterilizacion: { icon: Scissors, className: "bg-primary-soft text-primary" },
  consulta: { icon: Stethoscope, className: "bg-muted text-arena-700" },
  cirugia: { icon: HeartPulse, className: "bg-destructive-soft text-destructive" },
  tratamiento: { icon: Pill, className: "bg-warning-soft text-warning" },
};

/** Historial médico (arreglo embebido en el documento) como línea de tiempo, del más reciente al más antiguo. */
export function MedicalTimeline({ registros }: { registros: RegistroMedico[] }) {
  if (registros.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
        <ClipboardX className="size-4" aria-hidden="true" />
        La fundación aún no ha registrado historial médico.
      </p>
    );
  }

  const ordenados = [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <ol className="relative flex flex-col gap-6 before:absolute before:bottom-2 before:left-5 before:top-2 before:w-px before:bg-border">
      {ordenados.map((r) => {
        const { icon: Icon, className } = TIPO_STYLE[r.tipo];
        return (
          <li key={r._id} className="relative flex gap-4">
            <span className={cn("relative z-10 grid size-10 shrink-0 place-items-center rounded-full ring-4 ring-background", className)}>
              <Icon className="size-[1.125rem]" aria-hidden="true" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-semibold">{TIPO_REGISTRO_MEDICO_LABEL[r.tipo]}</span>
                <time dateTime={r.fecha} className="text-xs text-muted-foreground">
                  {formatDate(r.fecha)}
                </time>
              </p>
              <p className="mt-1 text-sm text-arena-700 text-pretty">{r.descripcion}</p>
              {r.veterinario && <p className="mt-1 text-xs text-muted-foreground">{r.veterinario}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
