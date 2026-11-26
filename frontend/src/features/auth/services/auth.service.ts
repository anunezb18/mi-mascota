import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import { authMock } from "@/mocks/services/auth.mock";
import type { AuthResponse, LoginPayload, RegistroPayload, Usuario } from "@/types";

export interface AuthService {
  login(payload: LoginPayload): Promise<AuthResponse>;
  register(payload: RegistroPayload): Promise<AuthResponse>;
  me(): Promise<Usuario>;
}

const authApi: AuthService = {
  async login(payload) {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
    return data;
  },
  async register(payload) {
    const { data } = await apiClient.post<AuthResponse>("/auth/registro", payload);
    return data;
  },
  async me() {
    const { data } = await apiClient.get<Usuario>("/auth/me");
    return data;
  },
};

export const authService: AuthService = env.useMock ? authMock : authApi;
