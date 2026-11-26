import { formatDateTime } from "@/lib/format";
import { ESTADO_SOLICITUD_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { CambioEstadoSolicitud, EstadoSolicitud } from "@/types";

const DOT: Record<EstadoSolicitud, string> = {
  pendiente: "bg-warning",
  aprobada: "bg-success",
  rechazada: "bg-destructive",
};

/** Historial de estados de una solicitud (arreglo embebido `historial_estados`), del más antiguo al más reciente. */
export function StatusHistory({ historial }: { historial: CambioEstadoSolicitud[] }) {
  const ordenado = [...historial].sort((a, b) => a.fecha.localeCompare(b.fecha));
  return (
    <ol className="relative flex flex-col gap-4 before:absolute before:bottom-1.5 before:left-[5px] before:top-1.5 before:w-px before:bg-border">
      {ordenado.map((c, i) => (
        <li key={`${c.estado}-${c.fecha}-${i}`} className="relative flex gap-3">
          <span className={cn("relative z-10 mt-1 size-[11px] shrink-0 rounded-full ring-4 ring-card", DOT[c.estado])} />
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-semibold">{ESTADO_SOLICITUD_LABEL[c.estado]}</span>
              <time dateTime={c.fecha} className="ml-2 text-xs text-muted-foreground">
                {formatDateTime(c.fecha)}
              </time>
            </p>
            {c.nota && <p className="mt-0.5 text-sm text-arena-700 text-pretty">{c.nota}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
