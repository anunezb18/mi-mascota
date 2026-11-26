import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api-client";
import type { Solicitud } from "@/types";

import { useResolverSolicitud } from "../hooks";

interface ApproveDialogProps {
  solicitud: Solicitud;
  /** Otras solicitudes pendientes para la misma mascota (se rechazarán automáticamente). */
  competidoras: Solicitud[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Confirmación de aprobación. Advierte explícitamente que las demás solicitudes
 * pendientes de la mascota se rechazarán de forma automática.
 */
export function ApproveDialog({ solicitud, competidoras, open, onOpenChange }: ApproveDialogProps) {
  const resolver = useResolverSolicitud();
  const [nota, setNota] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const notaId = React.useId();

  React.useEffect(() => {
    if (open) {
      setNota("");
      setError(null);
    }
  }, [open]);

  const confirmar = async () => {
    setError(null);
    try {
      await resolver.mutateAsync({
        id: solicitud._id,
        payload: { estado: "aprobada", nota: nota.trim() || undefined },
      });
      onOpenChange(false);
      toast.success(`Solicitud aprobada: ${solicitud.mascota.nombre} tiene un nuevo hogar`, {
        description:
          competidoras.length > 0
            ? `Se rechazaron automáticamente ${competidoras.length} ${competidoras.length === 1 ? "solicitud" : "solicitudes"} y se notificó a cada adoptante.`
            : `${solicitud.adoptante.nombre} recibirá una notificación.`,
      });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !resolver.isPending && onOpenChange(o)}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <span className="mb-1 grid size-11 place-items-center rounded-xl bg-success-soft text-success">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogTitle>¿Aprobar la solicitud de {solicitud.adoptante.nombre}?</AlertDialogTitle>
          <AlertDialogDescription>
            {solicitud.mascota.nombre} quedará marcado(a) como adoptado(a) y dejará de aparecer en el catálogo. Esta
            acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {competidoras.length > 0 && (
          <Alert
            variant="warning"
            title={`${competidoras.length} ${competidoras.length === 1 ? "solicitud se rechazará" : "solicitudes se rechazarán"} automáticamente`}
          >
            <p>Las demás solicitudes pendientes para {solicitud.mascota.nombre} se rechazarán y se notificará a:</p>
            <ul className="mt-2 list-disc pl-5">
              {competidoras.map((c) => (
                <li key={c._id}>{c.adoptante.nombre}</li>
              ))}
            </ul>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor={notaId}>Mensaje para el adoptante (opcional)</Label>
          <Textarea
            id={notaId}
            rows={3}
            maxLength={500}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej. Lo contactaremos esta semana para coordinar la visita y la entrega."
          />
        </div>

        {error && <Alert variant="destructive">{error}</Alert>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={resolver.isPending}>Cancelar</AlertDialogCancel>
          {/* Botón propio (no AlertDialogAction) para no cerrar el diálogo antes de que termine la petición */}
          <Button variant="success" onClick={confirmar} loading={resolver.isPending}>
            {competidoras.length > 0 ? "Aprobar y rechazar las demás" : "Aprobar solicitud"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const MOTIVO_MIN = 10;

/** Rechazo con motivo obligatorio: el adoptante lo verá en el historial de su solicitud. */
export function RejectDialog({
  solicitud,
  open,
  onOpenChange,
}: {
  solicitud: Solicitud;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const resolver = useResolverSolicitud();
  const [motivo, setMotivo] = React.useState("");
  const [intentado, setIntentado] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const motivoId = React.useId();
  const invalido = motivo.trim().length < MOTIVO_MIN;

  React.useEffect(() => {
    if (open) {
      setMotivo("");
      setIntentado(false);
      setError(null);
    }
  }, [open]);

  const confirmar = async () => {
    setIntentado(true);
    if (invalido) return;
    setError(null);
    try {
      await resolver.mutateAsync({ id: solicitud._id, payload: { estado: "rechazada", nota: motivo.trim() } });
      onOpenChange(false);
      toast.success("Solicitud rechazada", { description: `${solicitud.adoptante.nombre} recibirá una notificación con el motivo.` });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !resolver.isPending && onOpenChange(o)}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <span className="mb-1 grid size-11 place-items-center rounded-xl bg-destructive-soft text-destructive">
            <XCircle className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogTitle>Rechazar la solicitud de {solicitud.adoptante.nombre}</AlertDialogTitle>
          <AlertDialogDescription>
            Indique el motivo. El adoptante lo verá en el historial de su solicitud para {solicitud.mascota.nombre}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor={motivoId}>
            Motivo del rechazo <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Textarea
            id={motivoId}
            rows={4}
            maxLength={500}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            aria-invalid={intentado && invalido ? true : undefined}
            aria-describedby={intentado && invalido ? `${motivoId}-error` : undefined}
            placeholder="Ej. La mascota necesita un hogar con patio y su vivienda es un apartamento."
          />
          {intentado && invalido && (
            <p id={`${motivoId}-error`} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              Escriba un motivo de al menos {MOTIVO_MIN} caracteres.
            </p>
          )}
        </div>

        {error && <Alert variant="destructive">{error}</Alert>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={resolver.isPending}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={confirmar} loading={resolver.isPending}>
            Rechazar solicitud
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
