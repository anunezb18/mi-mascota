import type { RecomendacionesService } from "@/features/recomendaciones/services/recomendaciones.service";

import { calcularCompatibilidad } from "../compatibilidad";
import { db } from "../db";
import { currentUser } from "../session";
import { clone, delay, fail, haversineKm } from "../utils";

/** Compatibilidad mínima para que una mascota se recomiende. */
const UMBRAL = 60;

export const recomendacionesMock: RecomendacionesService = {
  async list({ limite = 12 } = {}) {
    await delay(500, 900);
    const usuario = currentUser(["adoptante"]);
    const perfil = usuario.perfil_estilo_vida;
    if (!perfil) fail(409, "Complete su perfil de estilo de vida para recibir recomendaciones.");

    const recomendaciones = db.mascotas
      .filter((m) => m.estado !== "adoptada")
      .map((m) => {
        const mascota = usuario.ubicacion
          ? { ...m, distancia_km: Number(haversineKm(usuario.ubicacion.coordinates, m.ubicacion.coordinates).toFixed(2)) }
          : m;
        return calcularCompatibilidad(mascota, perfil);
      })
      .filter((r) => r.compatibilidad >= UMBRAL)
      .sort((a, b) => b.compatibilidad - a.compatibilidad || (a.mascota.distancia_km ?? 0) - (b.mascota.distancia_km ?? 0))
      .slice(0, limite);

    return clone(recomendaciones);
  },
};
