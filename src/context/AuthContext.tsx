import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "../api";
import { AuthContext, type User } from "./authTypes";

const SESSION_API_KEY_STORAGE_KEY = "session_llm_api_key";

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

  const login = async (credential: string) => {
    const { access_token } = await apiFetch<{ access_token: string }>(
      "/auth/google",
      {
        method: "POST",
        body: JSON.stringify({ credential }),
      },
    );

    localStorage.setItem("access_token", access_token);

    const me = await apiFetch<User>("/auth/me");
    setUser(me);
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

    localStorage.setItem("access_token", access_token);

    const me = await apiFetch<User>("/auth/me");
    setUser(me);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    sessionStorage.removeItem(SESSION_API_KEY_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginDev, isDevAuthEnabled, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
