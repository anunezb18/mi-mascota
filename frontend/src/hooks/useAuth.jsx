import { createContext, useContext, useState } from "react";

import * as authService from "../services/authService.js";
import { tokenStorage } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.get());

  async function login(email, password) {
    const data = await authService.login(email, password);
    setToken(data.access_token);
  }

  function logout() {
    authService.logout();
    setToken(null);
  }

  // TODO: cargar el perfil (authService.getMe) para conocer el rol del usuario.
  const value = { token, isAuthenticated: Boolean(token), login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
