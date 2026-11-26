import type { FundacionService } from "@/features/fundacion/services/fundacion.service";
import type { Mascota, Solicitud } from "@/types";

import { db, persist } from "../db";
import { notify } from "../realtime";
import { currentUser } from "../session";
import { clone, delay, fail, objectId } from "../utils";
import { filtrarMascotas } from "./mascotas.mock";

/** Fundación de la cuenta autenticada. Con `validada`, exige que esté aprobada (escrituras). */
function fundacionActual({ validada = false } = {}) {
  const usuario = currentUser(["fundacion"]);
  const fundacion = db.fundaciones.find((f) => f._id === usuario.fundacion_id);
  if (!fundacion) fail(404, "No se encontró la fundación asociada a esta cuenta.");
  if (validada && fundacion.estado_validacion !== "aprobada") {
    fail(403, "Su fundación aún no ha sido validada por el administrador. No puede publicar ni gestionar mascotas.");
  }
  return fundacion;
}

function mascotaPropia(id: string, fundacionId: string): Mascota {
  const mascota = db.mascotas.find((m) => m._id === id);
  if (!mascota) fail(404, "La mascota no existe.");
  if (mascota.fundacion_id !== fundacionId) fail(403, "Esta mascota pertenece a otra fundación.");
  return mascota;
}

/** Reduce la imagen en el navegador para no saturar el almacenamiento local del modo mock. */
function comprimirImagen(archivo: File, maxLado = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No fue posible leer la imagen."));
    };
    img.src = url;
  });
}

export const fundacionMock: FundacionService = {
  async getMiFundacion() {
    await delay(150, 300);
    return clone(fundacionActual());
  },

  async getIndicadores() {
    await delay();
    const f = fundacionActual();
    const propias = db.mascotas.filter((m) => m.fundacion_id === f._id);
    return {
      mascotas_publicadas: propias.length,
      mascotas_disponibles: propias.filter((m) => m.estado === "disponible").length,
      mascotas_en_proceso: propias.filter((m) => m.estado === "en_proceso").length,
      mascotas_adoptadas: propias.filter((m) => m.estado === "adoptada").length,
      solicitudes_pendientes: db.solicitudes.filter((s) => s.fundacion_id === f._id && s.estado === "pendiente").length,
    };
  },

  async listMascotas(filtros) {
    await delay();
    const f = fundacionActual();
    const propias = db.mascotas.filter((m) => m.fundacion_id === f._id);
    return clone(filtrarMascotas(propias, filtros, { incluirAdoptadas: true }));
  },

  async crearMascota(payload) {
    await delay(500, 900);
    const f = fundacionActual({ validada: true });
    const ahora = new Date().toISOString();
    const mascota: Mascota = {
      ...payload,
      _id: objectId(),
      estado: "disponible",
      historial_medico: (payload.historial_medico ?? [])
        .map((r) => ({ ...r, _id: objectId() }))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
      fundacion_id: f._id,
      fundacion: { _id: f._id, nombre: f.nombre, ciudad: f.ciudad, localidad: f.localidad, telefono: f.telefono, correo: f.correo },
      fecha_publicacion: ahora,
      actualizado_en: ahora,
    };
    db.mascotas.unshift(mascota);
    persist();
    return clone(mascota);
  },

  async actualizarMascota(id, payload) {
    await delay(500, 900);
    const f = fundacionActual({ validada: true });
    const mascota = mascotaPropia(id, f._id);
    const { historial_medico: _ignorado, ...cambios } = payload;
    Object.assign(mascota, cambios, { actualizado_en: new Date().toISOString() });

    // Mantiene coherentes las copias resumidas en las solicitudes
    db.solicitudes
      .filter((s) => s.mascota_id === id)
      .forEach((s) => (s.mascota = { nombre: mascota.nombre, especie: mascota.especie, foto: mascota.fotos[0] }));
    persist();
    return clone(mascota);
  },

  async agregarRegistroMedico(id, registro) {
    await delay(400, 700);
    const f = fundacionActual({ validada: true });
    const mascota = mascotaPropia(id, f._id);
    mascota.historial_medico = [{ ...registro, _id: objectId() }, ...mascota.historial_medico].sort((a, b) =>
      b.fecha.localeCompare(a.fecha),
    );
    mascota.actualizado_en = new Date().toISOString();
    persist();
    return clone(mascota);
  },

  async subirFoto(archivo) {
    fundacionActual({ validada: true });
    if (!archivo.type.startsWith("image/")) fail(422, "El archivo debe ser una imagen (JPG, PNG o WebP).");
    if (archivo.size > 8 * 1024 * 1024) fail(422, "La imagen supera el tamaño máximo de 8 MB.");
    const [url] = await Promise.all([comprimirImagen(archivo), delay(300, 600)]);
    return { url };
  },

  async listSolicitudes() {
    await delay();
    const f = fundacionActual();
    return clone(db.solicitudes.filter((s) => s.fundacion_id === f._id));
  },

  async resolverSolicitud(id, { estado, nota }) {
    await delay(600, 1000);
    const f = fundacionActual({ validada: true });
    if (estado === "rechazada" && !nota?.trim()) fail(422, "Indique el motivo del rechazo.");
    const solicitud = db.solicitudes.find((s) => s._id === id);
    if (!solicitud || solicitud.fundacion_id !== f._id) fail(404, "La solicitud no existe.");
    if (solicitud.estado !== "pendiente") fail(409, "Esta solicitud ya fue resuelta.");

    const mascota = db.mascotas.find((m) => m._id === solicitud.mascota_id);
    const ahora = new Date().toISOString();
    const cerrar = (s: Solicitud, nuevo: Solicitud["estado"], texto?: string) => {
      s.estado = nuevo;
      s.fecha_actualizacion = ahora;
      s.historial_estados.push({ estado: nuevo, fecha: ahora, nota: texto });
    };
    const nombreMascota = solicitud.mascota.nombre;

    if (estado === "aprobada") {
      // Equivale a la transacción del backend: aprobar + rechazar el resto + marcar adoptada
      cerrar(solicitud, "aprobada", nota || "Solicitud aprobada por la fundación.");
      const otras = db.solicitudes.filter(
        (s) => s.mascota_id === solicitud.mascota_id && s._id !== id && s.estado === "pendiente",
      );
      otras.forEach((s) => cerrar(s, "rechazada", "Rechazada automáticamente: se aprobó otra solicitud para esta mascota."));
      if (mascota) mascota.estado = "adoptada";
      persist();

      notify(
        solicitud.adoptante_id,
        "solicitud_aprobada",
        "¡Su solicitud fue aprobada!",
        `${f.nombre} aprobó su solicitud para adoptar a ${nombreMascota}.`,
        "/adoptante/solicitudes",
      );
      otras.forEach((s) =>
        notify(
          s.adoptante_id,
          "solicitud_rechazada",
          "Solicitud no aprobada",
          `${nombreMascota} fue adoptado por otra familia. Le invitamos a conocer otras mascotas.`,
          "/adoptante/solicitudes",
        ),
      );
    } else {
      cerrar(solicitud, "rechazada", nota);
      const quedanPendientes = db.solicitudes.some((s) => s.mascota_id === solicitud.mascota_id && s.estado === "pendiente");
      if (mascota && mascota.estado === "en_proceso" && !quedanPendientes) mascota.estado = "disponible";
      persist();
      notify(
        solicitud.adoptante_id,
        "solicitud_rechazada",
        "Solicitud no aprobada",
        `${f.nombre} revisó su solicitud para ${nombreMascota}. Consulte el motivo en sus solicitudes.`,
        "/adoptante/solicitudes",
      );
    }

    return clone(solicitud);
  },
};
