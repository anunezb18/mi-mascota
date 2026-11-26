import type { SolicitudesService } from "@/features/solicitudes/services/solicitudes.service";
import type { Mascota, Solicitud } from "@/types";

import { db, persist } from "../db";
import { notify } from "../realtime";
import type { UsuarioMock } from "../seed/usuarios";
import { currentUser } from "../session";
import { clone, delay, fail, objectId } from "../utils";

/**
 * Inserta la solicitud con sus copias resumidas, pasa la mascota a "en proceso"
 * y notifica a la fundación. La usan el servicio y el simulador de actividad.
 */
export function registrarSolicitud(adoptante: UsuarioMock, mascota: Mascota, mensaje: string): Solicitud {
  const now = new Date().toISOString();
  const solicitud: Solicitud = {
    _id: objectId(),
    mascota_id: mascota._id,
    adoptante_id: adoptante._id,
    fundacion_id: mascota.fundacion_id,
    estado: "pendiente",
    mensaje: mensaje.trim(),
    mascota: { nombre: mascota.nombre, especie: mascota.especie, foto: mascota.fotos[0] },
    fundacion: { nombre: mascota.fundacion.nombre },
    adoptante: {
      nombre: adoptante.nombre,
      correo: adoptante.correo,
      telefono: adoptante.telefono,
      ciudad: adoptante.ciudad,
      perfil_estilo_vida: adoptante.perfil_estilo_vida,
    },
    historial_estados: [{ estado: "pendiente", fecha: now, nota: "Solicitud enviada por el adoptante." }],
    fecha_creacion: now,
    fecha_actualizacion: now,
  };
  db.solicitudes.unshift(solicitud);
  if (mascota.estado === "disponible") mascota.estado = "en_proceso";
  persist();

  const usuarioFundacion = db.usuarios.find((u) => u.fundacion_id === mascota.fundacion_id);
  if (usuarioFundacion) {
    notify(
      usuarioFundacion._id,
      "solicitud_recibida",
      "Nueva solicitud de adopción",
      `${adoptante.nombre} quiere adoptar a ${mascota.nombre}.`,
      "/fundacion/solicitudes",
    );
  }
  return solicitud;
}

export const solicitudesMock: SolicitudesService = {
  async create({ mascota_id, mensaje }) {
    await delay(400, 800);
    const adoptante = currentUser(["adoptante"]);
    if (!adoptante.perfil_estilo_vida) {
      fail(422, "Complete su perfil de estilo de vida antes de enviar una solicitud.");
    }
    const mascota = db.mascotas.find((m) => m._id === mascota_id);
    if (!mascota) fail(404, "La mascota no existe o fue retirada de la plataforma.");
    if (mascota.estado === "adoptada") fail(409, "Esta mascota ya fue adoptada.");

    const duplicada = db.solicitudes.some(
      (s) => s.mascota_id === mascota_id && s.adoptante_id === adoptante._id && s.estado === "pendiente",
    );
    if (duplicada) fail(409, "Ya tiene una solicitud pendiente para esta mascota.");

    return clone(registrarSolicitud(adoptante, mascota, mensaje));
  },

  async listMine() {
    await delay();
    const adoptante = currentUser(["adoptante"]);
    return clone(db.solicitudes.filter((s) => s.adoptante_id === adoptante._id));
  },
};
