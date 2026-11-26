import type { UsuariosService } from "@/features/auth/services/usuarios.service";

import { db, persist } from "../db";
import { currentUser, publicUser } from "../session";
import { delay, fail } from "../utils";

export const usuariosMock: UsuariosService = {
  async guardarPerfilEstiloVida(perfil) {
    await delay(400, 800);
    const usuario = currentUser(["adoptante"]);
    usuario.perfil_estilo_vida = {
      ...perfil,
      otras_mascotas: perfil.tiene_otras_mascotas ? perfil.otras_mascotas : [],
      actualizado_en: new Date().toISOString(),
    };
    persist();
    return publicUser(usuario);
  },

  async actualizarCuenta({ nombre, telefono, ciudad }) {
    await delay(400, 800);
    const usuario = currentUser();
    if (nombre !== undefined) usuario.nombre = nombre.trim();
    // Cadena vacía = quitar el dato opcional ($unset en MongoDB)
    if (telefono !== undefined) usuario.telefono = telefono.trim() || undefined;
    if (ciudad !== undefined) usuario.ciudad = ciudad.trim() || undefined;

    // El nombre del adoptante está copiado en sus solicitudes (patrón de subconjunto)
    if (usuario.rol === "adoptante") {
      db.solicitudes
        .filter((s) => s.adoptante_id === usuario._id)
        .forEach((s) => {
          s.adoptante.nombre = usuario.nombre;
          s.adoptante.telefono = usuario.telefono;
          s.adoptante.ciudad = usuario.ciudad;
        });
    }
    persist();
    return publicUser(usuario);
  },

  async cambiarContrasena({ contrasena_actual, contrasena_nueva }) {
    await delay(500, 900);
    const usuario = currentUser();
    if (usuario.contrasena !== contrasena_actual) fail(400, "La contraseña actual no es correcta.");
    if (contrasena_actual === contrasena_nueva) fail(400, "La nueva contraseña debe ser diferente de la actual.");
    usuario.contrasena = contrasena_nueva;
    persist();
  },
};
