'use client';

/**
 * core/auth/AuthContext.tsx
 * Global Auth State — React Context pattern (Flutter Provider equivalent)
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/core/constants/routes';

export type UserRole = 'ADMIN' | 'STAFF';

export interface UserSession {
  username: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AUTH_KEY = 'inventrix_user_session';

const DEMO_USERS: Record<string, { username: string; name: string; role: UserRole; password: string }> = {
  admin: { username: 'admin', name: 'Administrator', role: 'ADMIN', password: 'admin123' },
  user: { username: 'user', name: 'Warehouse Operator', role: 'STAFF', password: 'user123' },
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  const login = useCallback((username: string, password: string) => {
    const key = username.trim().toLowerCase();
    const found = DEMO_USERS[key];
    if (!found || found.password !== password) {
      return { success: false, error: 'Invalid username or password.' };
    }
    const session: UserSession = { username: found.username, name: found.name, role: found.role };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    setUser(session);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    router.push(ROUTES.LOGIN);
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
