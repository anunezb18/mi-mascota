import { tokenStorage } from "@/lib/token-storage";
import type { Rol, Usuario } from "@/types";

import { db } from "./db";
import type { UsuarioMock } from "./seed/usuarios";
import { fail } from "./utils";

const PREFIX = "mock-token.";

export const mockToken = (userId: string) => `${PREFIX}${userId}`;

/** Quita la contraseña antes de devolver el usuario, como haría la API. */
export function publicUser({ contrasena: _omit, ...usuario }: UsuarioMock): Usuario {
  return structuredClone(usuario);
}

/** Equivalente a la dependencia `get_current_user` del backend. */
export function currentUser(roles?: Rol[]): UsuarioMock {
  const token = tokenStorage.get();
  const id = token?.startsWith(PREFIX) ? token.slice(PREFIX.length) : null;
  const usuario = id ? db.usuarios.find((u) => u._id === id) : undefined;
  if (!usuario || !usuario.activo) fail(401, "Su sesión expiró. Inicie sesión nuevamente.");
  if (roles && !roles.includes(usuario.rol)) fail(403, "No tiene permisos para realizar esta acción.");
  return usuario;
}
