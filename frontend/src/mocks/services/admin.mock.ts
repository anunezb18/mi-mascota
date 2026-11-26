import type { AdminService } from "@/features/admin/services/admin.service";
import type { Fundacion, FundacionAdmin } from "@/types";

import { db, persist } from "../db";
import { notify } from "../realtime";
import { currentUser, publicUser } from "../session";
import { clone, delay, fail } from "../utils";

/** Normaliza para buscar sin tildes ni mayúsculas. */
const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Equivale al $lookup de la fundación con la cuenta de su representante. */
function conRepresentante(f: Fundacion): FundacionAdmin {
  const u = db.usuarios.find((usuario) => usuario._id === f.usuario_id);
  return {
    ...clone(f),
    representante: {
      _id: f.usuario_id,
      nombre: u?.nombre ?? "Cuenta no disponible",
      correo: u?.correo ?? f.correo,
      activo: u?.activo ?? false,
    },
  };
}

export const adminMock: AdminService = {
  async listFundaciones(filtros = {}) {
    await delay();
    currentUser(["administrador"]);
    const q = filtros.q ? normalizar(filtros.q.trim()) : "";
    const digitosQ = q.replace(/\D/g, "");
    return db.fundaciones
      .filter((f) => !filtros.estado || f.estado_validacion === filtros.estado)
      .filter(
        (f) =>
          !q ||
          normalizar(f.nombre).includes(q) ||
          (digitosQ.length > 0 && f.nit.replace(/\D/g, "").includes(digitosQ)),
      )
      .sort((a, b) => b.fecha_registro.localeCompare(a.fecha_registro))
      .map(conRepresentante);
  },

  async validarFundacion(id, { estado_validacion, motivo_rechazo }) {
    await delay(500, 900);
    currentUser(["administrador"]);
    const fundacion = db.fundaciones.find((f) => f._id === id);
    if (!fundacion) fail(404, "La fundación no existe.");
    if (fundacion.estado_validacion !== "pendiente") fail(409, "Esta fundación ya fue validada.");
    if (estado_validacion === "rechazada" && !motivo_rechazo?.trim()) {
      fail(422, "Indique el motivo del rechazo.");
    }

    fundacion.estado_validacion = estado_validacion;
    fundacion.fecha_validacion = new Date().toISOString();
    fundacion.motivo_rechazo = estado_validacion === "rechazada" ? motivo_rechazo!.trim() : undefined;
    persist();

    if (estado_validacion === "aprobada") {
      notify(
        fundacion.usuario_id,
        "fundacion_aprobada",
        "¡Su fundación fue aprobada!",
        `${fundacion.nombre} ya puede publicar mascotas y gestionar solicitudes de adopción.`,
        "/fundacion",
      );
    } else {
      notify(
        fundacion.usuario_id,
        "fundacion_rechazada",
        "Registro de fundación rechazado",
        `El administrador no aprobó el registro de ${fundacion.nombre}. Consulte el motivo en su panel.`,
        "/fundacion",
      );
    }
    return conRepresentante(fundacion);
  },

  async listUsuarios(filtros = {}) {
    await delay();
    currentUser(["administrador"]);
    const q = filtros.q ? normalizar(filtros.q.trim()) : "";
    return db.usuarios
      .filter((u) => !filtros.rol || u.rol === filtros.rol)
      .filter((u) => filtros.activo === undefined || u.activo === filtros.activo)
      .filter((u) => !q || normalizar(u.nombre).includes(q) || u.correo.toLowerCase().includes(q))
      .sort((a, b) => b.fecha_registro.localeCompare(a.fecha_registro))
      .map(publicUser);
  },

  async cambiarEstadoUsuario(id, { activo }) {
    await delay(400, 800);
    const admin = currentUser(["administrador"]);
    if (id === admin._id) fail(409, "No puede desactivar su propia cuenta.");
    const usuario = db.usuarios.find((u) => u._id === id);
    if (!usuario) fail(404, "El usuario no existe.");
    usuario.activo = activo;
    persist();
    return publicUser(usuario);
  },
};
