import type { MascotasService } from "@/features/mascotas/services/mascotas.service";
import { ETAPA_RANGO_MESES } from "@/lib/labels";
import type { FiltrosMascotas, Mascota } from "@/types";

import { db } from "../db";
import { clone, delay, fail, haversineKm } from "../utils";

/** Replica la consulta del backend: filtros + $geoNear cuando hay coordenadas. */
export function filtrarMascotas(
  mascotas: Mascota[],
  f: FiltrosMascotas,
  { incluirAdoptadas = false }: { incluirAdoptadas?: boolean } = {},
): Mascota[] {
  let resultado = mascotas.filter((m) => {
    // El catálogo público oculta las adoptadas; la gestión de la fundación las incluye
    if (f.estado ? m.estado !== f.estado : !incluirAdoptadas && m.estado === "adoptada") return false;
    if (f.especie && m.especie !== f.especie) return false;
    if (f.tamano && m.tamano !== f.tamano) return false;
    if (f.etapa) {
      const [min, max] = ETAPA_RANGO_MESES[f.etapa];
      if (m.edad_meses < min || m.edad_meses >= max) return false;
    }
    if (f.temperamento?.length && !f.temperamento.every((t) => m.temperamento.includes(t))) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      if (!m.nombre.toLowerCase().includes(q) && !m.raza.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (f.lat !== undefined && f.lng !== undefined) {
    const origen: [number, number] = [f.lng, f.lat];
    resultado = resultado
      .map((m) => ({ ...m, distancia_km: Number(haversineKm(origen, m.ubicacion.coordinates).toFixed(2)) }))
      .filter((m) => m.distancia_km <= (f.radio_km ?? 10))
      .sort((a, b) => a.distancia_km - b.distancia_km);
  } else {
    resultado = [...resultado].sort((a, b) => b.fecha_publicacion.localeCompare(a.fecha_publicacion));
  }

  return f.limite ? resultado.slice(0, f.limite) : resultado;
}

export const mascotasMock: MascotasService = {
  async list(filtros) {
    await delay();
    return clone(filtrarMascotas(db.mascotas, filtros));
  },

  async getById(id) {
    await delay();
    const mascota = db.mascotas.find((m) => m._id === id);
    if (!mascota) fail(404, "La mascota no existe o fue retirada de la plataforma.");
    return clone(mascota);
  },
};
