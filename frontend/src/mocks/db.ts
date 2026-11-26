import type { Fundacion, Mascota, Notificacion, Solicitud } from "@/types";

import { seedFundaciones } from "./seed/fundaciones";
import { seedMascotas } from "./seed/mascotas";
import { seedNotificaciones } from "./seed/notificaciones";
import { seedSolicitudes } from "./seed/solicitudes";
import { type UsuarioMock, seedUsuarios } from "./seed/usuarios";

/**
 * Base de datos simulada para el modo VITE_USE_MOCK=true.
 * Replica las colecciones de MongoDB y se persiste en localStorage para que
 * los cambios (solicitudes, aprobaciones, mascotas nuevas) sobrevivan a recargas.
 */
export interface MockDb {
  usuarios: UsuarioMock[];
  fundaciones: Fundacion[];
  mascotas: Mascota[];
  solicitudes: Solicitud[];
  notificaciones: Notificacion[];
}

/** Cambiar la versión invalida los datos guardados y vuelve a sembrar. */
const STORAGE_KEY = "mimascota.mockdb.v5";

function seed(): MockDb {
  const usuarios = seedUsuarios();
  const fundaciones = seedFundaciones();
  const mascotas = seedMascotas(fundaciones);
  const solicitudes = seedSolicitudes(usuarios, mascotas);
  return {
    usuarios,
    fundaciones,
    mascotas,
    solicitudes,
    notificaciones: seedNotificaciones(usuarios, fundaciones, solicitudes),
  };
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    /* almacenamiento no disponible o datos corruptos: se vuelve a sembrar */
  }
  return seed();
}

export const db: MockDb = load();

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* almacenamiento no disponible: los datos viven solo en memoria */
  }
}

/** Restablece los datos de demostración a su estado inicial. */
export function resetMockDb() {
  Object.assign(db, seed());
  persist();
}
