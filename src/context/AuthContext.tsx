import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "../api";
import { AuthContext, type User } from "./authTypes";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDevAuthEnabled = import.meta.env.VITE_DEV_AUTH_UI === "true";

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      queueMicrotask(() => setIsLoading(false));
      return;
    }

    apiFetch<User>("/auth/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("access_token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const loginWithAccessToken = async (accessToken: string) => {
    localStorage.setItem("access_token", accessToken);
    const me = await apiFetch<User>("/auth/me");
    setUser(me);
  };

  const refreshUser = async () => {
    const me = await apiFetch<User>("/auth/me");
    setUser(me);
  };

  const login = async (credential: string) => {
    const { access_token } = await apiFetch<{ access_token: string }>(
      "/auth/google",
      {
        method: "POST",
        body: JSON.stringify({ credential }),
      },
    );

    await loginWithAccessToken(access_token);
  };

  const loginWithPassword = async (email: string, password: string) => {
    const { access_token } = await apiFetch<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuthRedirect: true,
    });

    await loginWithAccessToken(access_token);
  };

  const loginDev = async () => {
    if (!isDevAuthEnabled) {
      throw new Error("Development authentication is disabled");
    }

    const { access_token } = await apiFetch<{ access_token: string }>(
      "/auth/dev-login",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    await loginWithAccessToken(access_token);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithPassword,
        loginWithAccessToken,
        refreshUser,
        loginDev,
        isDevAuthEnabled,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
