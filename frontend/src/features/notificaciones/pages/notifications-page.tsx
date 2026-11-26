import { ArrowRight, BellOff, Check, CheckCheck, Inbox } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { cn } from "@/lib/utils";
import type { Notificacion } from "@/types";

import { ConnectionStatus } from "../components/connection-status";
import { NotificationContent, UnreadDot } from "../components/notification-item";
import { useMarcarLeida, useMarcarTodasLeidas, useNoLeidas, useNotificaciones } from "../hooks";

type Filtro = "todas" | "no_leidas";

const DIA = 86_400_000;

/** Agrupa por antigüedad para que el historial se pueda recorrer de un vistazo. */
function agrupar(notificaciones: Notificacion[]) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicioHoy = hoy.getTime();
  const grupos: { titulo: string; items: Notificacion[] }[] = [
    { titulo: "Hoy", items: [] },
    { titulo: "Ayer", items: [] },
    { titulo: "Últimos 7 días", items: [] },
    { titulo: "Anteriores", items: [] },
  ];
  for (const n of notificaciones) {
    const t = new Date(n.fecha).getTime();
    if (t >= inicioHoy) grupos[0].items.push(n);
    else if (t >= inicioHoy - DIA) grupos[1].items.push(n);
    else if (t >= inicioHoy - 7 * DIA) grupos[2].items.push(n);
    else grupos[3].items.push(n);
  }
  return grupos.filter((g) => g.items.length > 0);
}

export default function NotificationsPage() {
  useDocumentTitle("Notificaciones");
  const [filtro, setFiltro] = React.useState<Filtro>("todas");
  const query = useNotificaciones(filtro === "no_leidas" ? { solo_no_leidas: true } : {});
  const { data: noLeidas = 0 } = useNoLeidas();
  const marcarLeida = useMarcarLeida();
  const marcarTodas = useMarcarTodasLeidas();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Cuenta"
        title="Notificaciones"
        description="Historial de avisos sobre sus solicitudes y su cuenta. Las nuevas llegan en tiempo real."
        actions={
          noLeidas > 0 && (
            <Button variant="outline" onClick={() => marcarTodas.mutate()} loading={marcarTodas.isPending}>
              <CheckCheck aria-hidden="true" />
              Marcar todas como leídas
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          value={filtro}
          onValueChange={(v) => v && setFiltro(v as Filtro)}
          aria-label="Filtrar notificaciones"
        >
          <ToggleGroupItem value="todas">Todas</ToggleGroupItem>
          <ToggleGroupItem value="no_leidas">
            No leídas
            {noLeidas > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[0.6875rem] font-bold leading-none text-primary-foreground">
                {noLeidas}
              </span>
            )}
          </ToggleGroupItem>
        </ToggleGroup>
        <ConnectionStatus />
      </div>

      {query.isPending ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.length === 0 ? (
        filtro === "no_leidas" ? (
          <EmptyState
            icon={CheckCheck}
            tone="secondary"
            title="Está al día"
            description="No tiene notificaciones pendientes por leer."
            action={
              <Button variant="outline" onClick={() => setFiltro("todas")}>
                Ver todo el historial
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={BellOff}
            title="Aún no tiene notificaciones"
            description="Aquí verá los avisos sobre solicitudes de adopción y el estado de su cuenta."
          />
        )
      ) : (
        <div className="flex flex-col gap-8">
          {agrupar(query.data).map((grupo) => (
            <section key={grupo.titulo} aria-labelledby={`grupo-${grupo.titulo}`}>
              <h2
                id={`grupo-${grupo.titulo}`}
                className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"
              >
                {grupo.titulo}
              </h2>
              <ul className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card">
                {grupo.items.map((n) => (
                  <li
                    key={n._id}
                    className={cn(
                      "flex items-start gap-3 border-b px-4 py-4 last:border-0 sm:px-5",
                      !n.leida && "bg-primary-soft/30",
                    )}
                  >
                    {/* Ranura fija: las leídas y no leídas quedan alineadas */}
                    <span className="flex w-2.5 shrink-0 justify-center">
                      <UnreadDot leida={n.leida} className="mt-4" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start">
                      <NotificationContent notificacion={n} />
                      <div className="flex shrink-0 items-center gap-1 pl-[3.25rem] sm:pl-0">
                        {n.enlace && (
                          <Button asChild variant="ghost" size="sm">
                            <Link to={n.enlace} onClick={() => !n.leida && marcarLeida.mutate(n._id)}>
                              Ver
                              <ArrowRight aria-hidden="true" />
                            </Link>
                          </Button>
                        )}
                        {!n.leida && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Marcar como leída: ${n.titulo}`}
                                onClick={() => marcarLeida.mutate(n._id)}
                              >
                                <Check aria-hidden="true" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Marcar como leída</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Inbox className="size-4" aria-hidden="true" />
            {query.data.length} {query.data.length === 1 ? "notificación" : "notificaciones"}
          </p>
        </div>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div role="status" aria-label="Cargando notificaciones" className="rounded-2xl border bg-card shadow-card">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex gap-3 border-b px-5 py-4 last:border-0">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3.5 w-full max-w-md" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
