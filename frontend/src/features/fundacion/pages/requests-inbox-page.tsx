import {
  ArrowLeft,
  Check,
  ExternalLink,
  Inbox,
  Mail,
  MapPin,
  MousePointerClick,
  Phone,
  Search,
  UserRoundX,
  Users,
  X,
} from "lucide-react";
import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Alert } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoSolicitudBadge } from "@/components/ui/status-badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PetImage } from "@/features/mascotas/components/pet-image";
import { LifestyleSummary } from "@/features/recomendaciones/components/lifestyle-summary";
import { StatusHistory } from "@/features/solicitudes/components/status-history";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { formatDateTime, formatRelative } from "@/lib/format";
import { ESPECIE_LABEL } from "@/lib/labels";
import { cn, initials } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { EstadoSolicitud, Solicitud } from "@/types";

import { usePuedeGestionar } from "../components/foundation-status-banner";
import { ApproveDialog, RejectDialog } from "../components/resolve-dialogs";
import { useSolicitudesFundacion } from "../hooks";

type Filtro = EstadoSolicitud | "todas";

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
  { value: "todas", label: "Todas" },
];

export default function RequestsInboxPage() {
  useDocumentTitle("Solicitudes recibidas");
  const query = useSolicitudesFundacion();
  const [params, setParams] = useSearchParams();
  const [filtro, setFiltro] = React.useState<Filtro>("pendiente");
  const [busqueda, setBusqueda] = React.useState("");

  const todas = React.useMemo(
    () => [...(query.data ?? [])].sort((a, b) => b.fecha_actualizacion.localeCompare(a.fecha_actualizacion)),
    [query.data],
  );
  const visibles = todas.filter((s) => {
    if (filtro !== "todas" && s.estado !== filtro) return false;
    const q = busqueda.trim().toLowerCase();
    return !q || s.adoptante.nombre.toLowerCase().includes(q) || s.mascota.nombre.toLowerCase().includes(q);
  });
  const conteo = (f: Filtro) => (f === "todas" ? todas.length : todas.filter((s) => s.estado === f).length);

  const seleccionadaId = params.get("id");
  const seleccionada = todas.find((s) => s._id === seleccionadaId);
  const seleccionar = React.useCallback(
    (id: string | null) => setParams(id ? { id } : {}, { replace: true }),
    [setParams],
  );

  // En escritorio (lista y detalle lado a lado) se abre la primera solicitud visible
  const primeraVisible = visibles[0]?._id;
  React.useEffect(() => {
    const escritorio = window.matchMedia("(min-width: 1024px)").matches;
    if (escritorio && !seleccionadaId && primeraVisible) seleccionar(primeraVisible);
  }, [seleccionadaId, primeraVisible, seleccionar]);

  return (
    <>
      <PageHeader
        eyebrow="Panel de la fundación"
        title="Solicitudes recibidas"
        description="Revise el perfil de cada adoptante antes de aprobar o rechazar. Al aprobar una solicitud, las demás de esa mascota se rechazan automáticamente."
      />

      {query.isPending ? (
        <InboxSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : todas.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Aún no ha recibido solicitudes"
          description="Cuando un adoptante solicite una de sus mascotas, la verá aquí con su perfil de estilo de vida."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
          {/* Lista (en móvil se oculta mientras se ve un detalle) */}
          <section aria-label="Lista de solicitudes" data-lista-solicitudes className={cn("flex min-w-0 flex-col gap-3", seleccionada && "hidden lg:flex")}>
            <ToggleGroup
              type="single"
              value={filtro}
              onValueChange={(v) => v && setFiltro(v as Filtro)}
              aria-label="Filtrar por estado"
              className="grid w-full grid-cols-4"
            >
              {FILTROS.map((f) => (
                <ToggleGroupItem key={f.value} value={f.value} className="gap-1 px-1 text-xs">
                  {f.label}
                  <span className="text-[0.6875rem] font-bold text-muted-foreground">{conteo(f.value)}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <label htmlFor="buscar-solicitud" className="sr-only">
                Buscar por adoptante o mascota
              </label>
              <Input
                id="buscar-solicitud"
                type="search"
                placeholder="Buscar adoptante o mascota"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            {visibles.length === 0 ? (
              <p className="rounded-2xl border border-dashed bg-card/60 p-6 text-center text-sm text-muted-foreground">
                No hay solicitudes en esta vista.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 lg:max-h-[calc(100dvh-20rem)] lg:overflow-y-auto lg:pr-1">
                {visibles.map((s) => (
                  <li key={s._id}>
                    <RequestListItem
                      solicitud={s}
                      activa={s._id === seleccionadaId}
                      competidoras={todas.filter((o) => o.mascota_id === s.mascota_id && o.estado === "pendiente").length}
                      onSelect={() => seleccionar(s._id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Detalle */}
          <section aria-label="Detalle de la solicitud" className={cn("min-w-0", !seleccionada && "hidden lg:block")}>
            {seleccionada ? (
              <RequestDetail solicitud={seleccionada} todas={todas} onBack={() => seleccionar(null)} />
            ) : (
              <EmptyState
                icon={MousePointerClick}
                tone="secondary"
                title="Seleccione una solicitud"
                description="Verá el mensaje del adoptante, su perfil de estilo de vida y las acciones para responder."
                className="h-full"
              />
            )}
          </section>
        </div>
      )}
    </>
  );
}

function RequestListItem({
  solicitud: s,
  activa,
  competidoras,
  onSelect,
}: {
  solicitud: Solicitud;
  activa: boolean;
  competidoras: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={activa || undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all duration-200",
        activa ? "border-primary bg-primary-soft/40 ring-1 ring-primary" : "bg-card hover:border-arena-400 hover:shadow-soft",
      )}
    >
      <span className="size-12 shrink-0 overflow-hidden rounded-xl">
        <PetImage src={s.mascota.foto} alt="" especie={s.mascota.especie} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-semibold">{s.adoptante.nombre}</span>
          <span className="shrink-0 text-[0.6875rem] text-muted-foreground">{formatRelative(s.fecha_actualizacion)}</span>
        </span>
        <span className="block truncate text-xs text-muted-foreground">Para {s.mascota.nombre}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {s.estado !== "pendiente" && <EstadoSolicitudBadge estado={s.estado} />}
          {s.estado === "pendiente" && competidoras > 1 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-warning">
              <Users className="size-3" aria-hidden="true" />
              {competidoras} interesados
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

function RequestDetail({ solicitud: s, todas, onBack }: { solicitud: Solicitud; todas: Solicitud[]; onBack: () => void }) {
  const puedeGestionar = usePuedeGestionar();
  const [aprobar, setAprobar] = React.useState(false);
  const [rechazar, setRechazar] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const competidoras = todas.filter((o) => o.mascota_id === s.mascota_id && o._id !== s._id && o.estado === "pendiente");
  const otras = todas.filter((o) => o.mascota_id === s.mascota_id && o._id !== s._id);

  // Cuando el usuario elige una solicitud en la lista, el foco pasa al detalle (móvil y lector de pantalla).
  // No se mueve si la selección fue automática al cargar la página.
  React.useEffect(() => {
    if (document.activeElement?.closest("[data-lista-solicitudes]")) {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [s._id]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b p-5 sm:p-6">
        <Button variant="ghost" size="sm" className="-ml-2 self-start lg:hidden" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          Todas las solicitudes
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback>{initials(s.adoptante.nombre)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-semibold leading-tight focus:outline-none focus-visible:ring-0">
                {s.adoptante.nombre}
              </h2>
              <p className="text-sm text-muted-foreground">Recibida el {formatDateTime(s.fecha_creacion)}</p>
            </div>
          </div>
          <EstadoSolicitudBadge estado={s.estado} />
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <li>
            <a href={`mailto:${s.adoptante.correo}`} className="inline-flex items-center gap-1.5 hover:text-primary hover:underline">
              <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
              {s.adoptante.correo}
            </a>
          </li>
          {s.adoptante.telefono && (
            <li>
              <a href={`tel:${s.adoptante.telefono}`} className="inline-flex items-center gap-1.5 hover:text-primary hover:underline">
                <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
                {s.adoptante.telefono}
              </a>
            </li>
          )}
          {s.adoptante.ciudad && (
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
              {s.adoptante.ciudad}
            </li>
          )}
        </ul>
      </div>

      <div className="flex flex-col gap-8 p-5 sm:p-6">
        <Link
          to={paths.mascota(s.mascota_id)}
          className="group flex items-center gap-3 self-start rounded-2xl border bg-muted/40 p-2 pr-4 transition-colors hover:bg-accent"
        >
          <span className="size-14 shrink-0 overflow-hidden rounded-xl">
            <PetImage src={s.mascota.foto} alt="" especie={s.mascota.especie} />
          </span>
          <span>
            <span className="block text-xs text-muted-foreground">Solicita adoptar a</span>
            <span className="flex items-center gap-1.5 font-semibold">
              {s.mascota.nombre} · {ESPECIE_LABEL[s.mascota.especie]}
              <ExternalLink className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
            </span>
          </span>
        </Link>

        <section>
          <h3 className="text-sm font-semibold">Mensaje del adoptante</h3>
          <blockquote className="mt-2 rounded-xl border-l-4 border-primary/50 bg-muted/40 p-4 text-sm leading-relaxed text-arena-800">
            {s.mensaje}
          </blockquote>
        </section>

        <section>
          <h3 className="mb-4 text-sm font-semibold">Perfil de estilo de vida</h3>
          {s.adoptante.perfil_estilo_vida ? (
            <LifestyleSummary perfil={s.adoptante.perfil_estilo_vida} />
          ) : (
            <p className="flex items-center gap-2 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              <UserRoundX className="size-4" aria-hidden="true" />
              El adoptante no registró un perfil de estilo de vida.
            </p>
          )}
        </section>

        {otras.length > 0 && (
          <section>
            <h3 className="mb-3 text-sm font-semibold">Otras solicitudes para {s.mascota.nombre}</h3>
            <ul className="flex flex-col gap-2">
              {otras.map((o) => (
                <li key={o._id} className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2 text-sm">
                  <span className="truncate">{o.adoptante.nombre}</span>
                  <EstadoSolicitudBadge estado={o.estado} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="mb-3 text-sm font-semibold">Historial de la solicitud</h3>
          <StatusHistory historial={s.historial_estados} />
        </section>
      </div>

      {s.estado === "pendiente" && (
        <div className="flex flex-col gap-3 border-t bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          {puedeGestionar ? (
            <>
              <p className="text-sm text-muted-foreground">
                {competidoras.length > 0
                  ? `Hay ${competidoras.length} ${competidoras.length === 1 ? "solicitud pendiente más" : "solicitudes pendientes más"} para ${s.mascota.nombre}.`
                  : "Es la única solicitud pendiente para esta mascota."}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-destructive hover:bg-destructive-soft sm:flex-none" onClick={() => setRechazar(true)}>
                  <X aria-hidden="true" />
                  Rechazar
                </Button>
                <Button variant="success" className="flex-1 sm:flex-none" onClick={() => setAprobar(true)}>
                  <Check aria-hidden="true" />
                  Aprobar
                </Button>
              </div>
            </>
          ) : (
            <Alert variant="info" className="w-full">
              Podrá responder solicitudes cuando el administrador valide la fundación.
            </Alert>
          )}
        </div>
      )}

      <ApproveDialog solicitud={s} competidoras={competidoras} open={aprobar} onOpenChange={setAprobar} />
      <RejectDialog solicitud={s} open={rechazar} onOpenChange={setRechazar} />
    </Card>
  );
}

function InboxSkeleton() {
  return (
    <div role="status" aria-label="Cargando solicitudes" className="grid gap-6 lg:grid-cols-[24rem_1fr]">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-11 rounded-full" />
        <Skeleton className="h-11" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="hidden h-[32rem] rounded-2xl lg:block" />
    </div>
  );
}
