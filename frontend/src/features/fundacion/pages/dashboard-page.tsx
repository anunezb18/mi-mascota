import { ArrowRight, CheckCircle2, ClipboardList, Heart, Inbox, PawPrint, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { PetImage } from "@/features/mascotas/components/pet-image";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { formatRelative } from "@/lib/format";
import { paths } from "@/routes/paths";

import { usePuedeGestionar } from "../components/foundation-status-banner";
import { StatTile, StatTileSkeleton } from "../components/stat-tile";
import { StatusBreakdown } from "../components/status-breakdown";
import { useIndicadores, useMiFundacion, useSolicitudesFundacion } from "../hooks";

export default function DashboardPage() {
  useDocumentTitle("Panel de la fundación");
  const fundacion = useMiFundacion();
  const indicadores = useIndicadores();
  const puedeGestionar = usePuedeGestionar();

  return (
    <>
      <PageHeader
        eyebrow="Panel de la fundación"
        title={fundacion.data?.nombre ?? "Mi fundación"}
        description="Resumen de sus mascotas publicadas y de las solicitudes que esperan respuesta."
        actions={
          puedeGestionar && (
            <Button asChild>
              <Link to={paths.fundacion.nuevaMascota}>
                <Plus aria-hidden="true" />
                Publicar mascota
              </Link>
            </Button>
          )
        }
      />

      {indicadores.isError ? (
        <ErrorState error={indicadores.error} onRetry={() => indicadores.refetch()} />
      ) : (
        <div className="flex flex-col gap-6">
          <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {indicadores.isPending ? (
              Array.from({ length: 4 }, (_, i) => <StatTileSkeleton key={i} />)
            ) : (
              <>
                <StatTile
                  label="Mascotas publicadas"
                  value={indicadores.data.mascotas_publicadas}
                  icon={PawPrint}
                  hint="Total histórico en la plataforma"
                  to={paths.fundacion.mascotas}
                />
                <StatTile
                  label="Disponibles"
                  value={indicadores.data.mascotas_disponibles}
                  icon={Heart}
                  hint={`${indicadores.data.mascotas_en_proceso} más en proceso de adopción`}
                />
                <StatTile
                  label="Adoptadas"
                  value={indicadores.data.mascotas_adoptadas}
                  icon={CheckCircle2}
                  hint="Con solicitud aprobada"
                />
                <StatTile
                  label="Solicitudes pendientes"
                  value={indicadores.data.solicitudes_pendientes}
                  icon={Inbox}
                  hint={indicadores.data.solicitudes_pendientes ? "Esperan su revisión" : "Todo al día"}
                  to={paths.fundacion.solicitudes}
                  highlight={indicadores.data.solicitudes_pendientes > 0}
                />
              </>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Estado de las mascotas</CardTitle>
                <CardDescription>Distribución de las mascotas publicadas por la fundación.</CardDescription>
              </CardHeader>
              <CardContent>
                {indicadores.isPending ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <StatusBreakdown
                    total={indicadores.data.mascotas_publicadas}
                    segmentos={[
                      { label: "Disponibles", value: indicadores.data.mascotas_disponibles, colorClass: "bg-chart-1" },
                      { label: "En proceso", value: indicadores.data.mascotas_en_proceso, colorClass: "bg-chart-2" },
                      { label: "Adoptadas", value: indicadores.data.mascotas_adoptadas, colorClass: "bg-chart-3" },
                    ]}
                  />
                )}
              </CardContent>
            </Card>

            <PendingRequests />
          </div>
        </div>
      )}
    </>
  );
}

function PendingRequests() {
  const query = useSolicitudesFundacion();
  const pendientes = (query.data ?? [])
    .filter((s) => s.estado === "pendiente")
    .sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion));

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Solicitudes por revisar</CardTitle>
          <CardDescription>Las más recientes primero.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={paths.fundacion.solicitudes}>
            Ver bandeja
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {query.isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : pendientes.length === 0 ? (
          <p className="flex items-center gap-2 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
            <ClipboardList className="size-4" aria-hidden="true" />
            No hay solicitudes pendientes.
          </p>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {pendientes.slice(0, 5).map((s) => (
              <li key={s._id}>
                <Link
                  to={`${paths.fundacion.solicitudes}?id=${s._id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-accent"
                >
                  <span className="size-11 shrink-0 overflow-hidden rounded-lg">
                    <PetImage src={s.mascota.foto} alt="" especie={s.mascota.especie} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{s.adoptante.nombre}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      Quiere adoptar a {s.mascota.nombre}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(s.fecha_creacion)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
