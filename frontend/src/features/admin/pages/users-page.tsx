import { Search, SearchX, UserCheck, UserX, Users } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/features/auth/auth-context";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { ROL_LABEL } from "@/lib/labels";
import { cn, initials } from "@/lib/utils";
import type { FiltrosUsuarios, Rol, Usuario } from "@/types";

import { useCambiarEstadoUsuario, useUsuariosAdmin } from "../hooks";

const ROL_VARIANT: Record<Rol, NonNullable<BadgeProps["variant"]>> = {
  adoptante: "secondary",
  fundacion: "soft",
  administrador: "info",
};

type FiltroEstado = "todos" | "activos" | "inactivos";

export default function UsersPage() {
  useDocumentTitle("Gestión de usuarios");
  const { usuario: yo } = useAuth();
  const [q, setQ] = React.useState("");
  const [rol, setRol] = React.useState<Rol | "todos">("todos");
  const [estado, setEstado] = React.useState<FiltroEstado>("todos");
  const qDebounced = useDebouncedValue(q.trim(), 300);
  const [objetivo, setObjetivo] = React.useState<Usuario | null>(null);

  const filtros: FiltrosUsuarios = {
    q: qDebounced || undefined,
    rol: rol === "todos" ? undefined : rol,
    activo: estado === "todos" ? undefined : estado === "activos",
  };
  const query = useUsuariosAdmin(filtros);
  const hayFiltros = Boolean(filtros.q || filtros.rol || filtros.activo !== undefined);
  const inactivos = query.data?.filter((u) => !u.activo).length ?? 0;

  const limpiar = () => {
    setQ("");
    setRol("todos");
    setEstado("todos");
  };

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Gestión de usuarios"
        description="Active o desactive cuentas. La desactivación es un borrado lógico: la información se conserva y la cuenta puede reactivarse."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="buscar-usuario" className="sr-only">
            Buscar por nombre o correo
          </label>
          <Input
            id="buscar-usuario"
            type="search"
            placeholder="Buscar por nombre o correo"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select value={rol} onValueChange={(v) => setRol(v as Rol | "todos")}>
            <SelectTrigger className="sm:w-44" aria-label="Filtrar por rol">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo rol</SelectItem>
              {(Object.keys(ROL_LABEL) as Rol[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {ROL_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={estado} onValueChange={(v) => setEstado(v as FiltroEstado)}>
            <SelectTrigger className="sm:w-40" aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo estado</SelectItem>
              <SelectItem value="activos">Activos</SelectItem>
              <SelectItem value="inactivos">Inactivos</SelectItem>
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
            description="Ningún usuario coincide con la búsqueda o los filtros aplicados."
            action={
              <Button variant="outline" onClick={limpiar}>
                Limpiar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState icon={Users} title="No hay usuarios registrados" />
        )
      ) : (
        <div className={cn("transition-opacity", query.isPlaceholderData && "opacity-60")}>
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {query.data.length} {query.data.length === 1 ? "usuario" : "usuarios"}
            {inactivos > 0 && ` · ${inactivos} ${inactivos === 1 ? "inactivo" : "inactivos"}`}
          </p>

          {/* Escritorio: tabla */}
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="pr-5 text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((u) => (
                  <TableRow key={u._id} className={cn(!u.activo && "bg-muted/40")}>
                    <TableCell>
                      <UserIdentity usuario={u} esYo={u._id === yo?._id} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={ROL_VARIANT[u.rol]}>{ROL_LABEL[u.rol]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.ciudad ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(u.fecha_registro)}</TableCell>
                    <TableCell>
                      <EstadoCuentaBadge activo={u.activo} />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <ToggleButton usuario={u} esYo={u._id === yo?._id} onClick={() => setObjetivo(u)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Móvil: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {query.data.map((u) => (
              <li key={u._id} className={cn("rounded-2xl border bg-card p-4 shadow-soft", !u.activo && "bg-muted/40")}>
                <UserIdentity usuario={u} esYo={u._id === yo?._id} />
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge variant={ROL_VARIANT[u.rol]}>{ROL_LABEL[u.rol]}</Badge>
                  <EstadoCuentaBadge activo={u.activo} />
                  <span className="text-xs text-muted-foreground">· Desde {formatDate(u.fecha_registro)}</span>
                </div>
                <div className="mt-3 border-t pt-3">
                  <ToggleButton usuario={u} esYo={u._id === yo?._id} onClick={() => setObjetivo(u)} className="w-full" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmEstadoDialog usuario={objetivo} onClose={() => setObjetivo(null)} />
    </>
  );
}

function UserIdentity({ usuario, esYo }: { usuario: Usuario; esYo: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-10">
        <AvatarFallback className={cn("text-xs", !usuario.activo && "bg-arena-200 text-arena-600")}>
          {initials(usuario.nombre)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className={cn("truncate font-semibold", !usuario.activo && "text-arena-700")}>
          {usuario.nombre}
          {esYo && <span className="ml-1.5 text-xs font-medium text-muted-foreground">(usted)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">{usuario.correo}</p>
      </div>
    </div>
  );
}

function EstadoCuentaBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <Badge variant="success">
      <UserCheck aria-hidden="true" />
      Activo
    </Badge>
  ) : (
    <Badge variant="muted">
      <UserX aria-hidden="true" />
      Inactivo
    </Badge>
  );
}

function ToggleButton({
  usuario,
  esYo,
  onClick,
  className,
}: {
  usuario: Usuario;
  esYo: boolean;
  onClick: () => void;
  className?: string;
}) {
  if (esYo) {
    return <span className={cn("text-xs text-muted-foreground", className && "block text-center")}>Su cuenta</span>;
  }
  return usuario.activo ? (
    <Button
      variant="outline"
      size="sm"
      className={cn("text-destructive hover:text-destructive", className)}
      onClick={onClick}
      aria-label={`Desactivar la cuenta de ${usuario.nombre}`}
    >
      <UserX aria-hidden="true" />
      Desactivar
    </Button>
  ) : (
    <Button variant="outline" size="sm" className={className} onClick={onClick} aria-label={`Activar la cuenta de ${usuario.nombre}`}>
      <UserCheck aria-hidden="true" />
      Activar
    </Button>
  );
}

function ConfirmEstadoDialog({ usuario, onClose }: { usuario: Usuario | null; onClose: () => void }) {
  const cambiar = useCambiarEstadoUsuario();
  const [error, setError] = React.useState<string | null>(null);
  // Conserva el contenido durante la animación de cierre
  const [ultimo, setUltimo] = React.useState(usuario);
  if (usuario && usuario !== ultimo) {
    setUltimo(usuario);
    setError(null);
  }
  const u = usuario ?? ultimo;
  if (!u) return null;
  const desactivar = u.activo;

  const confirmar = async () => {
    setError(null);
    try {
      await cambiar.mutateAsync({ id: u._id, activo: !desactivar });
      onClose();
      toast.success(desactivar ? "Cuenta desactivada" : "Cuenta activada", {
        description: desactivar
          ? `${u.nombre} ya no puede iniciar sesión.`
          : `${u.nombre} puede volver a iniciar sesión.`,
      });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <AlertDialog open={Boolean(usuario)} onOpenChange={(o) => !o && !cambiar.isPending && onClose()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <span
            className={cn(
              "mb-1 grid size-11 place-items-center rounded-xl",
              desactivar ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success",
            )}
          >
            {desactivar ? <UserX className="size-5" aria-hidden="true" /> : <UserCheck className="size-5" aria-hidden="true" />}
          </span>
          <AlertDialogTitle>
            {desactivar ? `¿Desactivar la cuenta de ${u.nombre}?` : `¿Activar la cuenta de ${u.nombre}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {desactivar
              ? "La cuenta no se elimina: sus datos, solicitudes e historial se conservan. Mientras esté desactivada no podrá iniciar sesión y su sesión actual se cerrará. Puede reactivarla en cualquier momento."
              : "La persona podrá volver a iniciar sesión con sus credenciales y recuperará el acceso a toda su información."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="rounded-xl bg-muted px-4 py-3 text-sm">
          <span className="font-semibold">{u.correo}</span>
          <span className="text-muted-foreground"> · {ROL_LABEL[u.rol]}</span>
        </p>
        {error && <Alert variant="destructive">{error}</Alert>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cambiar.isPending}>Cancelar</AlertDialogCancel>
          <Button variant={desactivar ? "destructive" : "success"} onClick={confirmar} loading={cambiar.isPending}>
            {desactivar ? "Desactivar cuenta" : "Activar cuenta"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TableSkeleton() {
  return (
    <div role="status" aria-label="Cargando usuarios" className="rounded-2xl border bg-card p-4 shadow-card">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b py-3 last:border-0">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
          <Skeleton className="hidden h-8 w-24 rounded-full md:block" />
        </div>
      ))}
    </div>
  );
}
