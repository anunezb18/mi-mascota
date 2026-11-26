import { cn } from "@/lib/utils";

import { useEstadoTiempoReal } from "../realtime";

const TEXTO = {
  conectado: "En tiempo real",
  conectando: "Conectando…",
  desconectado: "Sin conexión en tiempo real",
} as const;

/** Indicador del canal WebSocket de notificaciones. */
export function ConnectionStatus({ className }: { className?: string }) {
  const { conexion } = useEstadoTiempoReal();
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground", className)}>
      <span className="relative flex size-2" aria-hidden="true">
        {conexion === "conectado" && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            conexion === "conectado" ? "bg-success" : conexion === "conectando" ? "bg-warning" : "bg-arena-400",
          )}
        />
      </span>
      {TEXTO[conexion]}
    </span>
  );
}
