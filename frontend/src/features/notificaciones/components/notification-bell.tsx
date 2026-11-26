import { Bell, BellOff, CheckCheck } from "lucide-react";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Notificacion } from "@/types";

import { useMarcarLeida, useMarcarTodasLeidas, useNoLeidas, useNotificaciones } from "../hooks";
import { useEstadoTiempoReal } from "../realtime";
import { ConnectionStatus } from "./connection-status";
import { NotificationContent, UnreadDot } from "./notification-item";

const LIMITE = 6;

/**
 * Campana del navbar: contador de no leídas que se actualiza en tiempo real
 * (WebSocket) y panel desplegable con las más recientes.
 */
export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const { data: noLeidas = 0 } = useNoLeidas();
  const { recibidas } = useEstadoTiempoReal();
  const recientes = useNotificaciones({ limite: LIMITE }, { enabled: open });
  const marcarLeida = useMarcarLeida();
  const marcarTodas = useMarcarTodasLeidas();
  const navigate = useNavigate();

  const abrir = (n: Notificacion) => {
    if (!n.leida) marcarLeida.mutate(n._id);
    setOpen(false);
    if (n.enlace) navigate(n.enlace);
  };

  const ariaLabel = noLeidas === 0 ? "Notificaciones" : `Notificaciones, ${noLeidas} sin leer`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={ariaLabel}>
          {/* La key reinicia la animación con cada notificación recibida */}
          <Bell key={recibidas} className={cn("!size-5", recibidas > 0 && "animate-bell-ring")} aria-hidden="true" />
          {noLeidas > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1 top-1 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-primary px-1 text-[0.6875rem] font-bold leading-none text-primary-foreground ring-2 ring-background animate-in zoom-in-50"
            >
              {noLeidas > 9 ? "9+" : noLeidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[23rem] max-w-[calc(100vw-1.5rem)] p-0">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h2 className="font-display text-lg font-semibold leading-tight">Notificaciones</h2>
            <ConnectionStatus className="mt-0.5" />
          </div>
          {noLeidas > 0 && (
            <Button variant="ghost" size="sm" onClick={() => marcarTodas.mutate()} disabled={marcarTodas.isPending}>
              <CheckCheck aria-hidden="true" />
              Marcar leídas
            </Button>
          )}
        </div>

        <div className="max-h-[min(26rem,60vh)] overflow-y-auto">
          {recientes.isPending ? (
            <div role="status" aria-label="Cargando notificaciones" className="flex flex-col">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex gap-3 px-4 py-3">
                  <Skeleton className="size-9 rounded-xl" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : recientes.isError ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No fue posible cargar las notificaciones.{" "}
              <button
                type="button"
                className="font-semibold text-primary underline-offset-4 hover:underline"
                onClick={() => recientes.refetch()}
              >
                Reintentar
              </button>
            </p>
          ) : recientes.data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
                <BellOff className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold">No tiene notificaciones</p>
              <p className="text-xs text-muted-foreground">Le avisaremos aquí cuando haya novedades.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y">
              {recientes.data.map((n) => (
                <li key={n._id}>
                  <button
                    type="button"
                    onClick={() => abrir(n)}
                    className={cn(
                      "flex w-full items-start gap-2 px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                      !n.leida && "bg-primary-soft/40",
                    )}
                  >
                    <NotificationContent notificacion={n} compact />
                    <UnreadDot leida={n.leida} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t p-2">
          <Button asChild variant="ghost" className="w-full">
            <Link to={paths.notificaciones} onClick={() => setOpen(false)}>
              Ver todo el historial
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
