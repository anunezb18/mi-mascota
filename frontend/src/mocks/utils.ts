import { ApiError } from "@/lib/api-client";

/** Simula la latencia de red para que se vean los estados de carga. */
export function delay(min = 250, max = 650) {
  const ms = Math.round(min + Math.random() * (max - min));
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Genera un identificador con el formato de un ObjectId (24 caracteres hexadecimales). */
export function objectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  let random = "";
  for (let i = 0; i < 16; i++) random += Math.floor(Math.random() * 16).toString(16);
  return timestamp + random;
}

/** Fecha ISO relativa a hoy (días negativos = pasado). */
export function daysAgo(days: number, hours = 0) {
  return new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString();
}

export function fail(status: number, message: string): never {
  throw new ApiError(message, status);
}

/** Copia profunda para no exponer referencias internas de la base simulada. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

/** Distancia en km entre dos puntos [lng, lat] (fórmula de Haversine). */
export function haversineKm([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
