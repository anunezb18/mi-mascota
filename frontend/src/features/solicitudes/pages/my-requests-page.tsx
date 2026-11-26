import { ChevronDown, ClipboardList, ExternalLink, Search } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoSolicitudBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PetImage } from "@/features/mascotas/components/pet-image";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { formatDate, formatRelative } from "@/lib/format";
import { ESPECIE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { EstadoSolicitud, Solicitud } from "@/types";

import { StatusHistory } from "../components/status-history";
import { useMisSolicitudes } from "../hooks";

type Filtro = "todas" | EstadoSolicitud;

const TABS: { value: Filtro; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
];

const EMPTY_TEXT: Record<Filtro, string> = {
  todas: "",
  pendiente: "No tiene solicitudes pendientes de revisión.",
  aprobada: "Aún no tiene solicitudes aprobadas.",
  rechazada: "No tiene solicitudes rechazadas.",
};

export default function MyRequestsPage() {
  useDocumentTitle("Mis solicitudes");
  const query = useMisSolicitudes();
  const [filtro, setFiltro] = React.useState<Filtro>("todas");

  const solicitudes = React.useMemo(
    () => [...(query.data ?? [])].sort((a, b) => b.fecha_actualizacion.localeCompare(a.fecha_actualizacion)),
    [query.data],
  );
  const count = (f: Filtro) => (f === "todas" ? solicitudes.length : solicitudes.filter((s) => s.estado === f).length);

  return (
    <div className="page max-w-4xl">
      <PageHeader
        eyebrow="Adoptante"
        title="Mis solicitudes"
        description="Consulte el estado de cada solicitud de adopción y el historial de cambios. Le notificaremos cuando una fundación responda."
      />

      {query.isPending ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : solicitudes.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aún no ha enviado solicitudes"
          description="Cuando encuentre una mascota que encaje con su hogar, envíe su solicitud desde su perfil y aquí podrá seguir su estado."
          action={
            <Button asChild>
              <Link to={paths.mascotas}>
                <Search aria-hidden="true" />
                Explorar mascotas
              </Link>
            </Button>
          }
        />
      ) : (
        <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
          <TabsList aria-label="Filtrar por estado">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                <span className="rounded-full bg-muted px-1.5 text-xs font-bold text-muted-foreground">{count(t.value)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((t) => {
            const items = t.value === "todas" ? solicitudes : solicitudes.filter((s) => s.estado === t.value);
            return (
              <TabsContent key={t.value} value={t.value}>
                {items.length === 0 ? (
                  <p className="rounded-2xl border border-dashed bg-card/60 p-8 text-center text-sm text-muted-foreground">
                    {EMPTY_TEXT[t.value]}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-4">
                    {items.map((s) => (
                      <li key={s._id}>
                        <RequestCard solicitud={s} />
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}

function RequestCard({ solicitud: s }: { solicitud: Solicitud }) {
  const [open, setOpen] = React.useState(false);
  const detailId = React.useId();
  const ultimaNota = [...s.historial_estados].reverse().find((h) => h.estado === s.estado)?.nota;

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4 p-4 sm:p-5">
        <div className="size-20 shrink-0 overflow-hidden rounded-xl sm:size-24">
          <PetImage src={s.mascota.foto} alt={`Foto de ${s.mascota.nombre}`} especie={s.mascota.especie} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold leading-tight">{s.mascota.nombre}</h2>
              <p className="truncate text-sm text-muted-foreground">
                {ESPECIE_LABEL[s.mascota.especie]} · {s.fundacion.nombre}
              </p>
            </div>
            <EstadoSolicitudBadge estado={s.estado} />
          </div>
          <p className="text-xs text-muted-foreground">
            Enviada el {formatDate(s.fecha_creacion)}
            {s.estado !== "pendiente" && ` · respondida ${formatRelative(s.fecha_actualizacion)}`}
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2"
              aria-expanded={open}
              aria-controls={detailId}
              onClick={() => setOpen((o) => !o)}
            >
              <ChevronDown className={cn("transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
              {open ? "Ocultar detalle" : "Ver detalle"}
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to={paths.mascota(s.mascota_id)}>
                <ExternalLink aria-hidden="true" />
                Ver mascota
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {s.estado === "aprobada" && (
        <div className="px-4 pb-4 sm:px-5">
          <Alert variant="success" title="¡Su solicitud fue aprobada!">
            {s.fundacion.nombre} se comunicará con usted para coordinar la entrega. También puede contactarla desde el
            perfil de la mascota.
          </Alert>
        </div>
      )}
      {s.estado === "rechazada" && ultimaNota && !open && (
        <p className="mx-4 mb-4 rounded-xl bg-muted/60 p-3 text-sm text-arena-700 sm:mx-5">
          <span className="font-semibold">Motivo: </span>
          {ultimaNota}
        </p>
      )}

      <div id={detailId} hidden={!open} className="border-t bg-muted/30 p-4 sm:p-5">
        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="text-sm font-semibold">Mensaje enviado</h3>
            <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic text-arena-700">
              {s.mensaje}
            </blockquote>
          </section>
          <section>
            <h3 className="mb-3 text-sm font-semibold">Historial de la solicitud</h3>
            <StatusHistory historial={s.historial_estados} />
          </section>
        </div>
      </div>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <div role="status" aria-label="Cargando solicitudes" className="flex flex-col gap-4">
      <Skeleton className="h-11 w-96 max-w-full rounded-full" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex gap-4 rounded-2xl border bg-card p-5">
          <Skeleton className="size-24 rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
