// Cliente HTTP base. Añade el JWT a cada petición si existe.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
const TOKEN_KEY = "mimascota_token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function apiRequest(path, { method = "GET", body, headers = {}, form = false } = {}) {
  const token = tokenStorage.get();
  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let payload;
  if (body !== undefined) {
    if (form) {
      payload = new URLSearchParams(body);
    } else {
      finalHeaders["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  const response = await fetch(`${API_URL}${path}`, { method, headers: finalHeaders, body: payload });
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.detail ?? `Error ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}
