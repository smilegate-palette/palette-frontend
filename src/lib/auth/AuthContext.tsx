import { createContext, useContext, useState, ReactNode } from "react";
import {
  getToken,
  getStoredEmail,
  getStoredUsername,
  getStoredRole,
  getStoredUserId,
  setSession,
  getUsernameFromToken,
  clearSession,
} from "./token";

interface AuthState {
  isLoggedIn: boolean;
  email: string | null;
  username: string | null;
  userId: string | null;
  role: string | null;
  login: (token: string, email: string, userId?: string, role?: string, username?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 새로고침 시에도 localStorage에서 세션을 복구
  const [token, setToken] = useState<string | null>(() => getToken());
  const [email, setEmail] = useState<string | null>(() => getStoredEmail());
  const [username, setUsername] = useState<string | null>(() => getStoredUsername());
  const [userId, setUserId] = useState<string | null>(() => getStoredUserId());
  const [role, setRole] = useState<string | null>(() => getStoredRole());

  const login = (newToken: string, newEmail: string, newUserId?: string, newRole?: string, newUsername?: string) => {
    setSession(newToken, newEmail, newUserId, newRole, newUsername);
    setToken(newToken);
    setEmail(newEmail);
    setUsername(newUsername?.trim() || getUsernameFromToken(newToken));
    setUserId(newUserId ?? null);
    setRole(newRole ?? null);
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setEmail(null);
    setUsername(null);
    setUserId(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!token, email, username, userId, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
