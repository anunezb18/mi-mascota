import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Notificacion } from "@/types";

import { NOTIFICACION_META } from "../notification-meta";

/** Contenido visual de una notificación: ícono por tipo, título, mensaje y fecha. */
export function NotificationContent({ notificacion, compact = false }: { notificacion: Notificacion; compact?: boolean }) {
  const meta = NOTIFICACION_META[notificacion.tipo];
  const Icon = meta.icon;
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <span className={cn("grid shrink-0 place-items-center rounded-xl", meta.tono, compact ? "size-9" : "size-10")}>
        <Icon className={compact ? "size-4" : "size-[1.125rem]"} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug", notificacion.leida ? "font-medium text-arena-800" : "font-bold")}>
          {notificacion.titulo}
        </p>
        <p className={cn("mt-0.5 text-sm text-muted-foreground", compact && "line-clamp-2")}>{notificacion.mensaje}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          <time dateTime={notificacion.fecha} title={formatDateTime(notificacion.fecha)}>
            {formatRelative(notificacion.fecha)}
          </time>
          {!compact && (
            <>
              <span aria-hidden="true"> · </span>
              {meta.etiqueta}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** Punto de no leída (con texto para lectores de pantalla). */
export function UnreadDot({ leida, className }: { leida: boolean; className?: string }) {
  if (leida) return null;
  return (
    <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full bg-primary", className)}>
      <span className="sr-only">Sin leer</span>
    </span>
  );
}
