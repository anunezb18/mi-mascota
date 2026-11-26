import type { AuthService } from "@/features/auth/services/auth.service";
import type { Usuario } from "@/types";

import { db, persist } from "../db";
import { notify } from "../realtime";
import { currentUser, mockToken, publicUser } from "../session";
import { delay, fail, objectId } from "../utils";

export const authMock: AuthService = {
  async login({ correo, contrasena }) {
    await delay();
    const usuario = db.usuarios.find((u) => u.correo.toLowerCase() === correo.trim().toLowerCase());
    if (!usuario || usuario.contrasena !== contrasena) fail(401, "Correo o contraseña incorrectos.");
    if (!usuario.activo) fail(403, "Su cuenta está desactivada. Comuníquese con el administrador.");
    return { access_token: mockToken(usuario._id), token_type: "bearer", usuario: publicUser(usuario) };
  },

  async register(payload) {
    await delay(400, 900);
    const correo = payload.correo.trim().toLowerCase();
    if (db.usuarios.some((u) => u.correo.toLowerCase() === correo)) {
      fail(409, "Ya existe una cuenta registrada con este correo electrónico.");
    }
    const now = new Date().toISOString();
    const usuarioId = objectId();
    const base: Usuario = {
      _id: usuarioId,
      nombre: payload.nombre.trim(),
      correo,
      telefono: payload.telefono,
      rol: payload.rol,
      activo: true,
      ciudad: payload.rol === "adoptante" ? payload.ciudad : payload.fundacion.ciudad,
      fecha_registro: now,
    };

    if (payload.rol === "fundacion") {
      const fundacionId = objectId();
      db.fundaciones.push({
        _id: fundacionId,
        usuario_id: usuarioId,
        ...payload.fundacion,
        telefono: payload.telefono,
        correo,
        estado_validacion: "pendiente",
        fecha_registro: now,
      });
      base.fundacion_id = fundacionId;
    }

    const usuario = { ...base, contrasena: payload.contrasena };
    db.usuarios.push(usuario);
    persist();

    if (payload.rol === "fundacion") {
      db.usuarios
        .filter((u) => u.rol === "administrador" && u.activo)
        .forEach((admin) =>
          notify(
            admin._id,
            "fundacion_pendiente",
            "Fundación pendiente de validación",
            `${payload.fundacion.nombre} (NIT ${payload.fundacion.nit}) se registró y espera la verificación de sus datos.`,
            "/admin/fundaciones",
          ),
        );
    }
    return { access_token: mockToken(usuarioId), token_type: "bearer", usuario: publicUser(usuario) };
  },

  async me() {
    await delay(150, 300);
    return publicUser(currentUser());
  },
};
