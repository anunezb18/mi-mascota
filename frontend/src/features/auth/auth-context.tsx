import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";

import { SESSION_EXPIRED_EVENT } from "@/lib/api-client";
import { tokenStorage } from "@/lib/token-storage";
import type { LoginPayload, RegistroPayload, Rol, Usuario } from "@/types";

import { authService } from "./services/auth.service";

export const ME_QUERY_KEY = ["auth", "me"] as const;

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  usuario: Usuario | null;
  status: AuthStatus;
  login(payload: LoginPayload): Promise<Usuario>;
  register(payload: RegistroPayload): Promise<Usuario>;
  logout(): void;
  hasRole(...roles: Rol[]): boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = React.useState(() => tokenStorage.get());

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authService.me,
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const clearSession = React.useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  // El cliente HTTP emite este evento cuando recibe un 401
  React.useEffect(() => {
    const onExpired = () => {
      clearSession();
      toast.warning("Su sesión expiró", { description: "Inicie sesión nuevamente para continuar." });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [clearSession]);

  const startSession = React.useCallback(
    (accessToken: string, usuario: Usuario) => {
      tokenStorage.set(accessToken);
      queryClient.setQueryData(ME_QUERY_KEY, usuario);
      setToken(accessToken);
      return usuario;
    },
    [queryClient],
  );

  const value = React.useMemo<AuthContextValue>(() => {
    const usuario = token ? (meQuery.data ?? null) : null;
    let status: AuthStatus = "anonymous";
    if (token && meQuery.isPending) status = "loading";
    else if (usuario) status = "authenticated";

    return {
      usuario,
      status,
      async login(payload) {
        const res = await authService.login(payload);
        return startSession(res.access_token, res.usuario);
      },
      async register(payload) {
        const res = await authService.register(payload);
        return startSession(res.access_token, res.usuario);
      },
      logout: clearSession,
      hasRole: (...roles) => Boolean(usuario && roles.includes(usuario.rol)),
    };
  }, [token, meQuery.data, meQuery.isPending, startSession, clearSession]);

  // Token inválido al cargar la app (p. ej. vencido): se limpia la sesión
  React.useEffect(() => {
    if (token && meQuery.isError) clearSession();
  }, [token, meQuery.isError, clearSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
