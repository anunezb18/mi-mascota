import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, HeartHandshake, Info, LogIn, Send, UserRoundPen } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoSolicitudBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { LifestyleSummary } from "@/features/recomendaciones/components/lifestyle-summary";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { paths } from "@/routes/paths";
import type { Mascota } from "@/types";

import { useCrearSolicitud, useMisSolicitudes } from "../hooks";

const schema = z.object({
  mensaje: z
    .string()
    .trim()
    .min(30, "Escriba al menos 30 caracteres para que la fundación lo conozca mejor.")
    .max(1000, "Máximo 1.000 caracteres."),
});
type Values = z.infer<typeof schema>;

/**
 * Llamado a la acción para solicitar la adopción. Cambia según la sesión, el rol,
 * el estado de la mascota y si el adoptante ya tiene una solicitud.
 */
export function AdoptionRequestPanel({ mascota }: { mascota: Mascota }) {
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const misSolicitudes = useMisSolicitudes();
  const [open, setOpen] = React.useState(false);

  if (mascota.estado === "adoptada") {
    return (
      <Alert variant="success" title={`${mascota.nombre} ya encontró un hogar`}>
        Esta mascota fue adoptada. Explore otras mascotas que esperan una familia.
      </Alert>
    );
  }

  if (!usuario) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full"
          onClick={() => navigate(paths.ingresar, { state: { from: location.pathname } })}
        >
          <LogIn aria-hidden="true" />
          Iniciar sesión para solicitar
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          ¿No tiene cuenta?{" "}
          <Link to={`${paths.registro}?rol=adoptante`} className="font-semibold text-primary hover:underline">
            Regístrese como adoptante
          </Link>
        </p>
      </div>
    );
  }

  if (usuario.rol !== "adoptante") {
    return (
      <Alert variant="info">Las solicitudes de adopción solo pueden enviarlas las cuentas de adoptante.</Alert>
    );
  }

  if (misSolicitudes.isPending) return <Skeleton className="h-12 w-full rounded-full" />;

  const existente = misSolicitudes.data?.find(
    (s) => s.mascota_id === mascota._id && (s.estado === "pendiente" || s.estado === "aprobada"),
  );
  if (existente) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border bg-muted/50 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Su solicitud</p>
          <EstadoSolicitudBadge estado={existente.estado} />
        </div>
        <p className="text-sm text-muted-foreground">
          Enviada el {formatDate(existente.fecha_creacion)}. Le notificaremos cuando la fundación la revise.
        </p>
        <Button asChild variant="outline">
          <Link to={paths.adoptante.solicitudes}>
            <ClipboardList aria-hidden="true" />
            Ver mis solicitudes
          </Link>
        </Button>
      </div>
    );
  }

  if (!usuario.perfil_estilo_vida) {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="warning" title="Complete su perfil de estilo de vida">
          La fundación revisa su perfil para evaluar la solicitud. Solo toma un par de minutos.
        </Alert>
        <Button asChild size="lg" className="w-full">
          <Link to={paths.adoptante.perfil} state={{ from: location.pathname }}>
            <UserRoundPen aria-hidden="true" />
            Completar mi perfil
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
        <HeartHandshake aria-hidden="true" />
        Solicitar adopción
      </Button>
      <RequestDialog mascota={mascota} open={open} onOpenChange={setOpen} />
    </>
  );
}

function RequestDialog({
  mascota,
  open,
  onOpenChange,
}: {
  mascota: Mascota;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { usuario } = useAuth();
  const crear = useCrearSolicitud();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { mensaje: "" } });
  const { errors, isSubmitting } = form.formState;
  const mensaje = form.watch("mensaje");

  const onSubmit = form.handleSubmit(async ({ mensaje }) => {
    try {
      await crear.mutateAsync({ mascota_id: mascota._id, mensaje });
      onOpenChange(false);
      form.reset();
      toast.success("Solicitud enviada", {
        description: `${mascota.fundacion.nombre} revisará su solicitud para adoptar a ${mascota.nombre}.`,
      });
    } catch (error) {
      form.setError("root", { message: getErrorMessage(error) });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Solicitar la adopción de {mascota.nombre}</DialogTitle>
          <DialogDescription>
            Su mensaje y su perfil de estilo de vida se enviarán a {mascota.fundacion.nombre}.
          </DialogDescription>
        </DialogHeader>

        <form id="form-solicitud" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {errors.root && <Alert variant="destructive">{errors.root.message}</Alert>}
          <FormField
            label="Mensaje para la fundación"
            error={errors.mensaje?.message}
            hint={`Cuente por qué quiere adoptar a ${mascota.nombre} y cómo sería su rutina. ${mensaje.length}/1000`}
            required
          >
            <Textarea rows={5} maxLength={1000} {...form.register("mensaje")} />
          </FormField>

          {usuario?.perfil_estilo_vida && (
            <details className="group rounded-xl border bg-muted/40 p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Info className="size-4 text-secondary" aria-hidden="true" />
                  Perfil que verá la fundación
                </span>
                <span className="text-xs font-normal text-muted-foreground group-open:hidden">Mostrar</span>
                <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Ocultar</span>
              </summary>
              <div className="mt-4">
                <LifestyleSummary perfil={usuario.perfil_estilo_vida} compact />
              </div>
            </details>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="form-solicitud" loading={isSubmitting}>
            <Send aria-hidden="true" />
            Enviar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
