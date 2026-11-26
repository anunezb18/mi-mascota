/** Centro de referencia de Bogotá (Plaza de Bolívar aprox.) en formato [lat, lng] para Leaflet. */
export const BOGOTA_CENTER: [number, number] = [4.6533, -74.0836];

export interface PuntoReferencia {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
}

/**
 * Puntos de referencia por localidad, usados cuando el navegador no comparte
 * la ubicación o el usuario prefiere buscar desde otra zona.
 */
export const LOCALIDADES_BOGOTA: PuntoReferencia[] = [
  { id: "usaquen", nombre: "Usaquén", lat: 4.6949, lng: -74.0307 },
  { id: "chapinero", nombre: "Chapinero", lat: 4.6486, lng: -74.0628 },
  { id: "santa-fe", nombre: "Santa Fe", lat: 4.6097, lng: -74.0705 },
  { id: "san-cristobal", nombre: "San Cristóbal", lat: 4.5724, lng: -74.0838 },
  { id: "usme", nombre: "Usme", lat: 4.4795, lng: -74.1263 },
  { id: "tunjuelito", nombre: "Tunjuelito", lat: 4.5747, lng: -74.1323 },
  { id: "bosa", nombre: "Bosa", lat: 4.6184, lng: -74.1903 },
  { id: "kennedy", nombre: "Kennedy", lat: 4.628, lng: -74.1469 },
  { id: "fontibon", nombre: "Fontibón", lat: 4.678, lng: -74.141 },
  { id: "engativa", nombre: "Engativá", lat: 4.707, lng: -74.111 },
  { id: "suba", nombre: "Suba", lat: 4.7417, lng: -74.0836 },
  { id: "barrios-unidos", nombre: "Barrios Unidos", lat: 4.6672, lng: -74.0738 },
  { id: "teusaquillo", nombre: "Teusaquillo", lat: 4.6375, lng: -74.079 },
  { id: "martires", nombre: "Los Mártires", lat: 4.6047, lng: -74.0905 },
  { id: "puente-aranda", nombre: "Puente Aranda", lat: 4.6146, lng: -74.1153 },
  { id: "candelaria", nombre: "La Candelaria", lat: 4.5967, lng: -74.0727 },
  { id: "rafael-uribe", nombre: "Rafael Uribe Uribe", lat: 4.5747, lng: -74.1157 },
  { id: "ciudad-bolivar", nombre: "Ciudad Bolívar", lat: 4.5089, lng: -74.1548 },
];

export const LOCALIDADES_NOMBRES = LOCALIDADES_BOGOTA.map((l) => l.nombre);
