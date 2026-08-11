import { createContext, useContext, useState, ReactNode } from "react";
import { getToken, getStoredEmail, setSession, clearSession } from "./token";

interface AuthState {
  isLoggedIn: boolean;
  email: string | null;
  login: (token: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 새로고침 시에도 localStorage에서 세션을 복구
  const [token, setToken] = useState<string | null>(() => getToken());
  const [email, setEmail] = useState<string | null>(() => getStoredEmail());

  const login = (newToken: string, newEmail: string) => {
    setSession(newToken, newEmail);
    setToken(newToken);
    setEmail(newEmail);
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setEmail(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!token, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
