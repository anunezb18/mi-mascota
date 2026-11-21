import { apiRequest, tokenStorage } from "./api.js";

export async function login(email, password) {
  // El endpoint usa OAuth2PasswordRequestForm: username = email
  const data = await apiRequest("/auth/login", {
    method: "POST",
    form: true,
    body: { username: email, password },
  });
  tokenStorage.set(data.access_token);
  return data;
}

export function register(user) {
  return apiRequest("/auth/register", { method: "POST", body: user });
}

export function getMe() {
  return apiRequest("/users/me");
}

export function logout() {
  tokenStorage.clear();
}
