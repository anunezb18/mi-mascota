/** Identificador de MongoDB (ObjectId serializado en hexadecimal). */
export type ObjectId = string;

/** Fecha en formato ISO 8601 (así llegan los Date de MongoDB serializados). */
export type ISODate = string;

/** Punto GeoJSON. El orden de coordinates es [longitud, latitud], como exige el índice 2dsphere. */
export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

/** Cuerpo de error devuelto por FastAPI. */
export interface ApiErrorBody {
  detail?: string | { msg: string; loc?: (string | number)[] }[];
}
