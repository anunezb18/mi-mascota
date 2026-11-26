import type { Fundacion, Notificacion, Solicitud } from "@/types";

import { objectId } from "../utils";
import type { UsuarioMock } from "./usuarios";

const DIA = 86_400_000;

/**
 * Historial coherente con el resto de la semilla: cada solicitud, resolución y
 * validación de fundación genera la notificación que habría emitido el backend.
 * Las de los últimos dos días quedan sin leer.
 */
export function seedNotificaciones(
  usuarios: UsuarioMock[],
  fundaciones: Fundacion[],
  solicitudes: Solicitud[],
): Notificacion[] {
  const lista: Notificacion[] = [];
  const agregar = (n: Omit<Notificacion, "_id" | "leida">) =>
    lista.push({ ...n, _id: objectId(), leida: Date.now() - new Date(n.fecha).getTime() > 2 * DIA });

  for (const s of solicitudes) {
    const cuentaFundacion = usuarios.find((u) => u.fundacion_id === s.fundacion_id);
    if (cuentaFundacion) {
      agregar({
        usuario_id: cuentaFundacion._id,
        tipo: "solicitud_recibida",
        titulo: "Nueva solicitud de adopción",
        mensaje: `${s.adoptante.nombre} quiere adoptar a ${s.mascota.nombre}.`,
        enlace: "/fundacion/solicitudes",
        fecha: s.fecha_creacion,
      });
    }
    const resolucion = s.historial_estados.find((h) => h.estado !== "pendiente");
    if (resolucion) {
      const aprobada = resolucion.estado === "aprobada";
      agregar({
        usuario_id: s.adoptante_id,
        tipo: aprobada ? "solicitud_aprobada" : "solicitud_rechazada",
        titulo: aprobada ? "¡Su solicitud fue aprobada!" : "Solicitud no aprobada",
        mensaje: aprobada
          ? `${s.fundacion.nombre} aprobó su solicitud para adoptar a ${s.mascota.nombre}.`
          : `${s.fundacion.nombre} revisó su solicitud para ${s.mascota.nombre}. Consulte el motivo en sus solicitudes.`,
        enlace: "/adoptante/solicitudes",
        fecha: resolucion.fecha,
      });
    }
  }

  const administradores = usuarios.filter((u) => u.rol === "administrador");
  for (const f of fundaciones) {
    for (const admin of administradores) {
      agregar({
        usuario_id: admin._id,
        tipo: "fundacion_pendiente",
        titulo: "Fundación pendiente de validación",
        mensaje: `${f.nombre} (NIT ${f.nit}) se registró y espera la verificación de sus datos.`,
        enlace: "/admin/fundaciones",
        fecha: f.fecha_registro,
      });
    }
    if (f.estado_validacion !== "pendiente" && f.fecha_validacion) {
      const aprobada = f.estado_validacion === "aprobada";
      agregar({
        usuario_id: f.usuario_id,
        tipo: aprobada ? "fundacion_aprobada" : "fundacion_rechazada",
        titulo: aprobada ? "¡Su fundación fue aprobada!" : "Registro de fundación rechazado",
        mensaje: aprobada
          ? `${f.nombre} ya puede publicar mascotas y gestionar solicitudes de adopción.`
          : `El administrador no aprobó el registro de ${f.nombre}. Consulte el motivo en su panel.`,
        enlace: "/fundacion",
        fecha: f.fecha_validacion,
      });
    }
  }

  return lista.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
