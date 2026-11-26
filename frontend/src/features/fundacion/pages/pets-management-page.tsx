import { ExternalLink, MoreHorizontal, PawPrint, Pencil, Plus, Search, SearchX } from "lucide-react";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoMascotaBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PetImage } from "@/features/mascotas/components/pet-image";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { formatAge, formatDate } from "@/lib/format";
import { ESPECIE_LABEL, ESPECIE_PLURAL, ESTADO_MASCOTA_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Especie, EstadoMascota, FiltrosMascotas, Mascota } from "@/types";

import { usePuedeGestionar } from "../components/foundation-status-banner";
import { useMascotasFundacion, useSolicitudesFundacion } from "../hooks";

export default function PetsManagementPage() {
  useDocumentTitle("Gestión de mascotas");
  const puedeGestionar = usePuedeGestionar();
  const [q, setQ] = React.useState("");
  const [estado, setEstado] = React.useState<EstadoMascota | "todos">("todos");
  const [especie, setEspecie] = React.useState<Especie | "todas">("todas");
  const qDebounced = useDebouncedValue(q.trim(), 300);

  const filtros: FiltrosMascotas = {
    q: qDebounced || undefined,
    estado: estado === "todos" ? undefined : estado,
    especie: especie === "todas" ? undefined : especie,
  };
  const query = useMascotasFundacion(filtros);
  const solicitudes = useSolicitudesFundacion();
  const hayFiltros = Boolean(filtros.q || filtros.estado || filtros.especie);

  const pendientesPorMascota = React.useMemo(() => {
    const conteo = new Map<string, number>();
    solicitudes.data
      ?.filter((s) => s.estado === "pendiente")
      .forEach((s) => conteo.set(s.mascota_id, (conteo.get(s.mascota_id) ?? 0) + 1));
    return conteo;
  }, [solicitudes.data]);

  const limpiar = () => {
    setQ("");
    setEstado("todos");
    setEspecie("todas");
  };

  return (
    <>
      <PageHeader
        eyebrow="Panel de la fundación"
        title="Gestión de mascotas"
        description="Publique, edite y consulte el estado de las mascotas de la fundación."
        actions={
          puedeGestionar && (
            <Button asChild>
              <Link to={paths.fundacion.nuevaMascota}>
                <Plus aria-hidden="true" />
                Nueva mascota
              </Link>
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="buscar-mascota" className="sr-only">
            Buscar por nombre o raza
          </label>
          <Input
            id="buscar-mascota"
            type="search"
            placeholder="Buscar por nombre o raza"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select value={estado} onValueChange={(v) => setEstado(v as EstadoMascota | "todos")}>
            <SelectTrigger className="sm:w-44" aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo estado</SelectItem>
              {(Object.keys(ESTADO_MASCOTA_LABEL) as EstadoMascota[]).map((e) => (
                <SelectItem key={e} value={e}>
                  {ESTADO_MASCOTA_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={especie} onValueChange={(v) => setEspecie(v as Especie | "todas")}>
            <SelectTrigger className="sm:w-48" aria-label="Filtrar por especie">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Toda especie</SelectItem>
              {(Object.keys(ESPECIE_PLURAL) as Especie[]).map((e) => (
                <SelectItem key={e} value={e}>
                  {ESPECIE_PLURAL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {query.isPending ? (
        <TableSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.length === 0 ? (
        hayFiltros ? (
          <EmptyState
            icon={SearchX}
            title="Sin resultados"
            description="Ninguna mascota coincide con la búsqueda o los filtros aplicados."
            action={
              <Button variant="outline" onClick={limpiar}>
                Limpiar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={PawPrint}
            title="Aún no ha publicado mascotas"
            description={
              puedeGestionar
                ? "Publique la primera mascota de la fundación con sus fotos, temperamento e historial médico."
                : "Podrá publicar mascotas cuando el administrador valide la fundación."
            }
            action={
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
        )
      ) : (
        <div className={cn("transition-opacity", query.isPlaceholderData && "opacity-60")}>
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {query.data.length} {query.data.length === 1 ? "mascota" : "mascotas"}
          </p>

          {/* Escritorio: tabla */}
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Mascota</TableHead>
                  <TableHead>Especie</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Solicitudes</TableHead>
                  <TableHead>Publicada</TableHead>
                  <TableHead className="w-14">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="size-11 shrink-0 overflow-hidden rounded-lg">
                          <PetImage src={m.fotos[0]} alt="" especie={m.especie} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold">{m.nombre}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.raza}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{ESPECIE_LABEL[m.especie]}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatAge(m.edad_meses)}</TableCell>
                    <TableCell>
                      <EstadoMascotaBadge estado={m.estado} />
                    </TableCell>
                    <TableCell>
                      <PendingCount count={pendientesPorMascota.get(m._id) ?? 0} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(m.fecha_publicacion)}</TableCell>
                    <TableCell>
                      <RowActions mascota={m} puedeGestionar={puedeGestionar} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Móvil: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {query.data.map((m) => (
              <li key={m._id} className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-soft">
                <span className="size-16 shrink-0 overflow-hidden rounded-xl">
                  <PetImage src={m.fotos[0]} alt="" especie={m.especie} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{m.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ESPECIE_LABEL[m.especie]} · {formatAge(m.edad_meses)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <EstadoMascotaBadge estado={m.estado} />
                    <PendingCount count={pendientesPorMascota.get(m._id) ?? 0} compact />
                  </div>
                </div>
                <RowActions mascota={m} puedeGestionar={puedeGestionar} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function PendingCount({ count, compact = false }: { count: number; compact?: boolean }) {
  if (count === 0) return compact ? null : <span className="text-sm text-muted-foreground">—</span>;
  return (
    <Badge variant="soft">
      {count} {count === 1 ? "pendiente" : "pendientes"}
    </Badge>
  );
}

function RowActions({ mascota, puedeGestionar }: { mascota: Mascota; puedeGestionar: boolean }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${mascota.nombre}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {puedeGestionar && (
          <DropdownMenuItem onSelect={() => navigate(paths.fundacion.editarMascota(mascota._id))}>
            <Pencil aria-hidden="true" />
            Editar
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => navigate(paths.mascota(mascota._id))}>
          <ExternalLink aria-hidden="true" />
          Ver publicación
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableSkeleton() {
  return (
    <div role="status" aria-label="Cargando mascotas" className="rounded-2xl border bg-card p-4 shadow-card">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b py-3 last:border-0">
          <Skeleton className="size-11 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
          <Skeleton className="hidden h-4 w-24 md:block" />
        </div>
      ))}
    </div>
  );
}
