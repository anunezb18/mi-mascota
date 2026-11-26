import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface Segmento {
  label: string;
  value: number;
  /** Clase de fondo de la paleta categórica validada (bg-chart-1, ...). */
  colorClass: string;
}

/**
 * Barra segmentada fina (parte de un todo): 8 px, extremos redondeados, 2 px de
 * separación entre partes y leyenda con el valor y la proporción de cada parte.
 * La leyenda actúa también como vista en tabla: ningún dato depende solo del color.
 */
export function StatusBreakdown({ segmentos, total }: { segmentos: Segmento[]; total: number }) {
  const visibles = segmentos.filter((s) => s.value > 0);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  const resumen = segmentos.map((s) => `${s.label}: ${s.value} (${pct(s.value)} %)`).join(", ");

  return (
    <div>
      <div role="img" aria-label={`Distribución de ${total} mascotas. ${resumen}.`} className="flex h-6 items-center gap-0.5">
        {total === 0 ? (
          <div className="h-2 w-full rounded-full bg-arena-200" />
        ) : (
          visibles.map((s) => (
            <Tooltip key={s.label}>
              <TooltipTrigger asChild>
                {/* El área de interacción (24 px) es más alta que la marca (8 px) */}
                <div className="flex h-full cursor-default items-center" style={{ width: `${(s.value / total) * 100}%` }}>
                  <div className={cn("h-2 w-full rounded-full", s.colorClass)} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span className="font-semibold">{s.label}</span>: {formatNumber(s.value)} ({pct(s.value)} %)
              </TooltipContent>
            </Tooltip>
          ))
        )}
      </div>

      <ul className="mt-4 flex flex-col divide-y">
        {segmentos.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 py-2.5">
            <span className={cn("size-2.5 shrink-0 rounded-full", s.colorClass)} aria-hidden="true" />
            <span className="text-sm text-arena-700">{s.label}</span>
            <span className="ml-auto whitespace-nowrap text-sm font-semibold tabular-nums">
              {formatNumber(s.value)}
              <span className="ml-2 inline-block w-12 text-right font-normal text-muted-foreground">{pct(s.value)} %</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
