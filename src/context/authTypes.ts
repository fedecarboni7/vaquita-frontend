import { createContext } from "react";

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  google_id: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
