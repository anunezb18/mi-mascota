import { AlertTriangle, BadgeCheck, ShieldX } from "lucide-react";
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
import type { FundacionAdmin } from "@/types";

import { useValidarFundacion } from "../hooks";

interface DialogProps {
  fundacion: FundacionAdmin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}

export function ApproveFoundationDialog({ fundacion, open, onOpenChange, onDone }: DialogProps) {
  const validar = useValidarFundacion();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const confirmar = async () => {
    setError(null);
    try {
      await validar.mutateAsync({ id: fundacion._id, payload: { estado_validacion: "aprobada" } });
      onOpenChange(false);
      onDone?.();
      toast.success(`${fundacion.nombre} fue aprobada`, {
        description: "La fundación ya puede publicar mascotas y recibió una notificación.",
      });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !validar.isPending && onOpenChange(o)}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <span className="mb-1 grid size-11 place-items-center rounded-xl bg-success-soft text-success">
            <BadgeCheck className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogTitle>¿Aprobar a {fundacion.nombre}?</AlertDialogTitle>
          <AlertDialogDescription>
            Confirme que verificó el NIT {fundacion.nit} y los datos de contacto. Una vez aprobada, la fundación podrá
            publicar mascotas y responder solicitudes de adopción.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <Alert variant="destructive">{error}</Alert>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={validar.isPending}>Cancelar</AlertDialogCancel>
          <Button variant="success" onClick={confirmar} loading={validar.isPending}>
            Aprobar fundación
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const MOTIVO_MIN = 10;

export function RejectFoundationDialog({ fundacion, open, onOpenChange, onDone }: DialogProps) {
  const validar = useValidarFundacion();
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
      await validar.mutateAsync({
        id: fundacion._id,
        payload: { estado_validacion: "rechazada", motivo_rechazo: motivo.trim() },
      });
      onOpenChange(false);
      onDone?.();
      toast.success("Registro rechazado", { description: `${fundacion.nombre} recibirá una notificación con el motivo.` });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !validar.isPending && onOpenChange(o)}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <span className="mb-1 grid size-11 place-items-center rounded-xl bg-destructive-soft text-destructive">
            <ShieldX className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogTitle>Rechazar el registro de {fundacion.nombre}</AlertDialogTitle>
          <AlertDialogDescription>
            Indique el motivo. La fundación lo verá en su panel y no podrá publicar mascotas.
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
            placeholder="Ej. El NIT no coincide con el registro en el RUES. Verifique el número y vuelva a registrarse."
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
          <AlertDialogCancel disabled={validar.isPending}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={confirmar} loading={validar.isPending}>
            Rechazar registro
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
