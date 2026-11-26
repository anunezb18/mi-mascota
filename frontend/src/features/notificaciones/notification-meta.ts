import { BadgeCheck, Building2, CheckCircle2, Inbox, type LucideIcon, ShieldX, XCircle } from "lucide-react";

import type { TipoNotificacion } from "@/types";

/** Ícono y tono de cada tipo de notificación (el tono acompaña al texto, nunca lo reemplaza). */
export const NOTIFICACION_META: Record<TipoNotificacion, { icon: LucideIcon; tono: string; etiqueta: string }> = {
  solicitud_recibida: { icon: Inbox, tono: "bg-info-soft text-info", etiqueta: "Solicitud recibida" },
  solicitud_aprobada: { icon: CheckCircle2, tono: "bg-success-soft text-success", etiqueta: "Solicitud aprobada" },
  solicitud_rechazada: { icon: XCircle, tono: "bg-destructive-soft text-destructive", etiqueta: "Solicitud rechazada" },
  fundacion_pendiente: { icon: Building2, tono: "bg-warning-soft text-warning", etiqueta: "Fundación por validar" },
  fundacion_aprobada: { icon: BadgeCheck, tono: "bg-success-soft text-success", etiqueta: "Fundación aprobada" },
  fundacion_rechazada: { icon: ShieldX, tono: "bg-destructive-soft text-destructive", etiqueta: "Fundación rechazada" },
};
