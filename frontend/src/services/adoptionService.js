import { apiRequest } from "./api.js";

export function createAdoptionRequest(petId, message) {
  return apiRequest("/adoption-requests", { method: "POST", body: { pet_id: petId, message } });
}

export function listMyRequests() {
  return apiRequest("/adoption-requests");
}
