import { CheckCircle2, Clock, Heart, Hourglass, XCircle } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ESTADO_MASCOTA_LABEL, ESTADO_SOLICITUD_LABEL, ESTADO_VALIDACION_LABEL } from "@/lib/labels";
import type { EstadoMascota, EstadoSolicitud, EstadoValidacion } from "@/types";

type Variant = NonNullable<BadgeProps["variant"]>;

const ESTADO_PROCESO: Record<EstadoSolicitud | EstadoValidacion, { variant: Variant; icon: typeof Clock }> = {
  pendiente: { variant: "warning", icon: Clock },
  aprobada: { variant: "success", icon: CheckCircle2 },
  rechazada: { variant: "destructive", icon: XCircle },
};

export function EstadoSolicitudBadge({ estado, className }: { estado: EstadoSolicitud; className?: string }) {
  const { variant, icon: Icon } = ESTADO_PROCESO[estado];
  return (
    <Badge variant={variant} className={className}>
      <Icon aria-hidden="true" />
      {ESTADO_SOLICITUD_LABEL[estado]}
    </Badge>
  );
}

export function EstadoValidacionBadge({ estado, className }: { estado: EstadoValidacion; className?: string }) {
  const { variant, icon: Icon } = ESTADO_PROCESO[estado];
  return (
    <Badge variant={variant} className={className}>
      <Icon aria-hidden="true" />
      {ESTADO_VALIDACION_LABEL[estado]}
    </Badge>
  );
}

const ESTADO_MASCOTA: Record<EstadoMascota, { variant: Variant; icon: typeof Clock }> = {
  disponible: { variant: "secondary", icon: Heart },
  en_proceso: { variant: "warning", icon: Hourglass },
  adoptada: { variant: "muted", icon: CheckCircle2 },
};

export function EstadoMascotaBadge({ estado, className }: { estado: EstadoMascota; className?: string }) {
  const { variant, icon: Icon } = ESTADO_MASCOTA[estado];
  return (
    <Badge variant={variant} className={className}>
      <Icon aria-hidden="true" />
      {ESTADO_MASCOTA_LABEL[estado]}
    </Badge>
  );
}
