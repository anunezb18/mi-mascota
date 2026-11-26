import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/format";

import { useMiFundacion } from "../hooks";

/** Indica si la fundación puede publicar y gestionar (solo cuando el administrador la aprobó). */
export function usePuedeGestionar() {
  const { data } = useMiFundacion();
  return data?.estado_validacion === "aprobada";
}

/** Aviso persistente en el panel mientras la fundación no esté aprobada. */
export function FoundationStatusBanner() {
  const { data: fundacion } = useMiFundacion();
  if (!fundacion || fundacion.estado_validacion === "aprobada") return null;

  if (fundacion.estado_validacion === "pendiente") {
    return (
      <Alert variant="warning" title="Su fundación está pendiente de validación" className="mb-8">
        Registrada el {formatDate(fundacion.fecha_registro)}. El administrador está verificando el NIT y los datos de{" "}
        {fundacion.nombre}. Podrá publicar mascotas y gestionar solicitudes cuando sea aprobada; le enviaremos una
        notificación con el resultado.
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" title="El registro de su fundación fue rechazado" className="mb-8">
      {fundacion.motivo_rechazo ?? "El administrador no aprobó el registro."} Mientras tanto no es posible publicar
      mascotas.
    </Alert>
  );
}
