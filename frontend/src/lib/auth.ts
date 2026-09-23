import { UserSession, UserRole } from './types';

const AUTH_KEY = 'inventrix_user_session';

export const DEMO_USERS: Record<string, { username: string; name: string; role: UserRole; password: string }> = {
  admin: {
    username: 'admin',
    name: 'Administrator',
    role: 'ADMIN',
    password: 'admin123',
  },
  user: {
    username: 'user',
    name: 'Warehouse Operator',
    role: 'STAFF',
    password: 'user123',
  },
};

export function getStoredSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
}

export function loginSimulated(username: string, password: string): { success: boolean; session?: UserSession; error?: string } {
  const cleanUser = username.trim().toLowerCase();
  const user = DEMO_USERS[cleanUser];

  if (!user || user.password !== password) {
    return { success: false, error: 'Invalid username or password. Please verify your credentials.' };
  }

  const session: UserSession = {
    username: user.username,
    name: user.name,
    role: user.role,
  };

  setStoredSession(session);
  return { success: true, session };
}
