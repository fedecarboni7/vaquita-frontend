import { createContext } from "react";

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  google_id: string | null;
  has_password: boolean;
  email_verified: boolean;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credential: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  loginWithAccessToken: (accessToken: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  loginDev: () => Promise<void>;
  isDevAuthEnabled: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
