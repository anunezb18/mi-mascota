import { apiRequest } from "./api.js";

// filters: { species, status, lat, lng, radius_km, limit }
export function searchPets(filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "")
  );
  const query = params.toString();
  return apiRequest(`/pets${query ? `?${query}` : ""}`);
}

export function getPet(id) {
  return apiRequest(`/pets/${id}`);
}
