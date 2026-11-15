"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, User } from "./api";

type Ctx = { user: User | null; loading: boolean; login: (token: string, u: User) => void; logout: () => void };
const AuthCtx = createContext<Ctx>({ user: null, loading: true, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    api<User>("/api/auth/me").then(setUser).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback((token: string, u: User) => { setToken(token); setUser(u); }, []);
  const logout = useCallback(() => { setToken(null); setUser(null); }, []);
  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
