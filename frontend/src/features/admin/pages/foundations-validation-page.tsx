import {
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Search,
  SearchX,
  ShieldX,
  UserRound,
} from "lucide-react";
import * as React from "react";
import { useSearchParams } from "react-router-dom";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoValidacionBadge } from "@/components/ui/status-badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EstadoValidacion, FundacionAdmin } from "@/types";

import { ApproveFoundationDialog, RejectFoundationDialog } from "../components/validation-dialogs";
import { useFundacionesAdmin } from "../hooks";

type Filtro = EstadoValidacion | "todas";

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
  { value: "todas", label: "Todas" },
];

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export default function FoundationsValidationPage() {
  useDocumentTitle("Validación de fundaciones");
  const query = useFundacionesAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const filtro = (searchParams.get("estado") as Filtro | null) ?? "pendiente";
  const seleccionadaId = searchParams.get("id");
  const [q, setQ] = React.useState("");

  const actualizarParams = (cambios: Record<string, string | null>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(cambios).forEach(([k, v]) => (v === null ? next.delete(k) : next.set(k, v)));
        return next;
      },
      { replace: true },
    );

  const conteo = React.useMemo(() => {
    const c: Record<Filtro, number> = { pendiente: 0, aprobada: 0, rechazada: 0, todas: 0 };
    query.data?.forEach((f) => {
      c[f.estado_validacion]++;
      c.todas++;
    });
    return c;
  }, [query.data]);

  const visibles = React.useMemo(() => {
    const termino = normalizar(q.trim());
    const digitos = termino.replace(/\D/g, "");
    return (query.data ?? [])
      .filter((f) => filtro === "todas" || f.estado_validacion === filtro)
      .filter(
        (f) =>
          !termino ||
          normalizar(f.nombre).includes(termino) ||
          (digitos.length > 0 && f.nit.replace(/\D/g, "").includes(digitos)),
      )
      // Las pendientes más antiguas primero: llevan más tiempo esperando
      .sort((a, b) =>
        filtro === "pendiente"
          ? a.fecha_registro.localeCompare(b.fecha_registro)
          : b.fecha_registro.localeCompare(a.fecha_registro),
      );
  }, [query.data, filtro, q]);

  const seleccionada = query.data?.find((f) => f._id === seleccionadaId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Validación de fundaciones"
        description="Verifique el NIT y los datos de cada fundación registrada antes de habilitarla para publicar mascotas."
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ToggleGroup
          type="single"
          value={filtro}
          onValueChange={(v) => v && actualizarParams({ estado: v === "pendiente" ? null : v })}
          aria-label="Filtrar por estado de validación"
          className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto"
        >
          {FILTROS.map((f) => (
            <ToggleGroupItem key={f.value} value={f.value}>
              {f.label}
              {query.data && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[0.6875rem] font-bold leading-none tabular-nums",
                    f.value === "pendiente" && conteo.pendiente > 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-arena-200 text-arena-800",
                  )}
                >
                  {conteo[f.value]}
                </span>
              )}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="buscar-fundacion" className="sr-only">
            Buscar por nombre o NIT
          </label>
          <Input
            id="buscar-fundacion"
            type="search"
            placeholder="Buscar por nombre o NIT"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {query.isPending ? (
        <CardsSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : visibles.length === 0 ? (
        q.trim() ? (
          <EmptyState
            icon={SearchX}
            title="Sin resultados"
            description="Ninguna fundación coincide con la búsqueda en este estado."
            action={
              <Button variant="outline" onClick={() => setQ("")}>
                Limpiar búsqueda
              </Button>
            }
          />
        ) : filtro === "pendiente" ? (
          <EmptyState
            icon={BadgeCheck}
            tone="secondary"
            title="No hay fundaciones por validar"
            description="Todas las solicitudes de registro están resueltas. Le avisaremos cuando llegue una nueva."
          />
        ) : (
          <EmptyState icon={Building2} title="No hay fundaciones en este estado" />
        )
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {visibles.length} {visibles.length === 1 ? "fundación" : "fundaciones"}
          </p>
          <ul className="grid gap-4 lg:grid-cols-2">
            {visibles.map((f) => (
              <li key={f._id}>
                <FoundationCard fundacion={f} onOpen={() => actualizarParams({ id: f._id })} />
              </li>
            ))}
          </ul>
        </>
      )}

      <FoundationSheet
        fundacion={seleccionada}
        onOpenChange={(open) => !open && actualizarParams({ id: null })}
      />
    </>
  );
}

function FoundationCard({ fundacion: f, onOpen }: { fundacion: FundacionAdmin; onOpen: () => void }) {
  const pendiente = f.estado_validacion === "pendiente";
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex h-full w-full flex-col gap-4 rounded-2xl border bg-card p-5 text-left shadow-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0",
        pendiente && "border-warning/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary-soft text-secondary">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="line-clamp-2 font-semibold leading-snug">{f.nombre}</p>
            <p className="text-sm tabular-nums text-muted-foreground">NIT {f.nit}</p>
          </div>
        </div>
        <EstadoValidacionBadge estado={f.estado_validacion} className="shrink-0" />
      </div>

      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-arena-700">
          <dt className="sr-only">Representante</dt>
          <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <dd className="truncate">{f.representante.nombre}</dd>
        </div>
        <div className="flex items-center gap-2 text-arena-700">
          <dt className="sr-only">Ubicación</dt>
          <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <dd className="truncate">{[f.localidad, f.ciudad].filter(Boolean).join(", ")}</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-muted-foreground">
          Registrada <time dateTime={f.fecha_registro}>{formatRelative(f.fecha_registro)}</time>
        </span>
        <span className={cn("inline-flex items-center gap-1 font-semibold", pendiente ? "text-primary" : "text-arena-700")}>
          {pendiente ? "Revisar" : "Ver detalle"}
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}

function FoundationSheet({
  fundacion,
  onOpenChange,
}: {
  fundacion: FundacionAdmin | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [dialogo, setDialogo] = React.useState<"aprobar" | "rechazar" | null>(null);
  // Conserva el último contenido mientras el panel se cierra con animación
  const [ultima, setUltima] = React.useState(fundacion);
  if (fundacion && fundacion !== ultima) setUltima(fundacion);
  const f = fundacion ?? ultima;

  return (
    <Sheet open={Boolean(fundacion)} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
        // El foco inicia en el panel (no en "Rechazar") para leer los datos antes de decidir
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).focus();
        }}
      >
        {f && (
          <>
            <SheetHeader className="border-b pb-5 pr-14">
              <EstadoValidacionBadge estado={f.estado_validacion} className="mb-2 w-fit" />
              <SheetTitle className="text-2xl leading-tight">{f.nombre}</SheetTitle>
              <SheetDescription className="tabular-nums">NIT {f.nit}</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {f.estado_validacion === "rechazada" && f.motivo_rechazo && (
                <Alert variant="destructive" title="Motivo del rechazo" className="mb-6">
                  {f.motivo_rechazo}
                </Alert>
              )}

              <Section titulo="Descripción">
                <p className="text-sm leading-relaxed text-arena-800">{f.descripcion}</p>
              </Section>

              <Section titulo="Registro">
                <Dato icon={CalendarDays} etiqueta="Fecha de registro">
                  {formatDate(f.fecha_registro)}
                </Dato>
                {f.fecha_validacion && (
                  <Dato icon={BadgeCheck} etiqueta="Fecha de validación">
                    {formatDate(f.fecha_validacion)}
                  </Dato>
                )}
              </Section>

              <Section titulo="Representante y contacto">
                <Dato icon={UserRound} etiqueta="Representante">
                  {f.representante.nombre}
                  {!f.representante.activo && <span className="ml-2 text-xs text-muted-foreground">(cuenta desactivada)</span>}
                </Dato>
                <Dato icon={Mail} etiqueta="Correo">
                  <a href={`mailto:${f.correo}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {f.correo}
                  </a>
                </Dato>
                <Dato icon={Phone} etiqueta="Teléfono">
                  <a href={`tel:${f.telefono}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {f.telefono}
                  </a>
                </Dato>
                {f.sitio_web && (
                  <Dato icon={Globe} etiqueta="Sitio web">
                    <a
                      href={f.sitio_web}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {f.sitio_web.replace(/^https?:\/\//, "")}
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">(se abre en una pestaña nueva)</span>
                    </a>
                  </Dato>
                )}
              </Section>

              <Section titulo="Sede" ultima>
                <Dato icon={MapPin} etiqueta="Dirección">
                  {f.direccion}
                  <span className="block text-muted-foreground">
                    {[f.localidad, f.ciudad].filter(Boolean).join(", ")}
                  </span>
                  {f.ubicacion && (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${f.ubicacion.coordinates[1]}&mlon=${f.ubicacion.coordinates[0]}#map=17/${f.ubicacion.coordinates[1]}/${f.ubicacion.coordinates[0]}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Ver ubicación en el mapa
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">(se abre en una pestaña nueva)</span>
                    </a>
                  )}
                </Dato>
              </Section>
            </div>

            {f.estado_validacion === "pendiente" && (
              <div className="flex flex-col-reverse gap-2 border-t bg-card px-6 py-4 sm:flex-row sm:justify-end">
                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDialogo("rechazar")}>
                  <ShieldX aria-hidden="true" />
                  Rechazar
                </Button>
                <Button variant="success" onClick={() => setDialogo("aprobar")}>
                  <BadgeCheck aria-hidden="true" />
                  Aprobar fundación
                </Button>
              </div>
            )}

            <ApproveFoundationDialog
              fundacion={f}
              open={dialogo === "aprobar"}
              onOpenChange={(o) => setDialogo(o ? "aprobar" : null)}
            />
            <RejectFoundationDialog
              fundacion={f}
              open={dialogo === "rechazar"}
              onOpenChange={(o) => setDialogo(o ? "rechazar" : null)}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ titulo, children, ultima = false }: { titulo: string; children: React.ReactNode; ultima?: boolean }) {
  return (
    <section className={cn(!ultima && "mb-6 border-b pb-6")}>
      <h3 className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{titulo}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Dato({
  icon: Icon,
  etiqueta,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-arena-700">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{etiqueta}</p>
        <div className="break-words">{children}</div>
      </div>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div role="status" aria-label="Cargando fundaciones" className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3.5 w-28" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
