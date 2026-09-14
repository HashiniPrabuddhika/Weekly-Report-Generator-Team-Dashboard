"use client";

import * as React from "react";
import { apiClient, ApiError } from "@/lib/api-client";
import { getToken, setToken, clearToken } from "@/lib/auth-token";
import type { AuthResult, AuthUser } from "@/types/auth";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // On first load, if a token exists, validate it against the backend
  // rather than trusting stale localStorage data.
  React.useEffect(() => {
    const token = getToken();

    const sessionCheck = token
      ? apiClient
          .get<{ userId: string; email: string; name: string; role: AuthUser["role"] }>(
            "/auth/me",
          )
          .then((me) => {
            setUser({ id: me.userId, email: me.email, role: me.role, name: me.name });
          })
          .catch(() => {
            // Token invalid/expired — clear it silently, user will be routed to login.
            clearToken();
          })
      : Promise.resolve();

    sessionCheck.finally(() => setIsLoading(false));
  }, []);

  const login = React.useCallback(async (input: LoginInput) => {
    const result = await apiClient.post<AuthResult>("/auth/login", input);
    setToken(result.accessToken);
    setUser(result.user);
    return result.user;
  }, []);

  const register = React.useCallback(async (input: RegisterInput) => {
    const result = await apiClient.post<AuthResult>("/auth/register", input);
    setToken(result.accessToken);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = React.useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = React.useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export { ApiError };
