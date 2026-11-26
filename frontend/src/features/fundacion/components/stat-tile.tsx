import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: number;
  icon: LucideIcon;
  /** Texto de contexto bajo la cifra. */
  hint?: string;
  /** Si se indica, toda la tarjeta enlaza a esa ruta. */
  to?: string;
  /** Resalta la tarjeta cuando requiere atención (p. ej. solicitudes pendientes). */
  highlight?: boolean;
}

/** Tarjeta de indicador: etiqueta, cifra en sans semibold (cifras proporcionales) y contexto. */
export function StatTile({ label, value, icon: Icon, hint, to, highlight }: StatTileProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <span
          className={cn(
            "grid size-9 place-items-center rounded-xl",
            highlight ? "bg-primary text-primary-foreground" : "bg-muted text-arena-700",
          )}
        >
          <Icon className="size-[1.125rem]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 font-sans text-4xl font-semibold tracking-tight">{formatNumber(value)}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );

  const className = cn(
    "block rounded-2xl border bg-card p-5 shadow-card",
    highlight && "border-primary/40 ring-1 ring-primary/20",
    to && "transition-all duration-200 ease-gentle hover:-translate-y-0.5 hover:shadow-lift",
  );

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function StatTileSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="size-9 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-9 w-16" />
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  );
}
