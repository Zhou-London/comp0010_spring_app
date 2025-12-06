import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE, getStoredToken } from '../api';

export interface AuthUser {
  username: string;
  token: string;
}

type AuthMode = 'login' | 'register';

type AuthAction = (() => void | Promise<void>) | null;

interface AuthContextValue {
  user: AuthUser | null;
  authMode: AuthMode;
  authOpen: boolean;
  setAuthMode: (mode: AuthMode) => void;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  requireAuth: (action: () => void | Promise<void>) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'auth-user';

async function requestToken(path: 'login' | 'register', username: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Unable to authenticate');
  }

  return response.json() as Promise<AuthUser>;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as AuthUser;
      return parsed?.token ? parsed : null;
    } catch (err) {
      console.error('Unable to parse stored user', err);
      return null;
    }
  });
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<AuthAction>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    const token = getStoredToken();
    if (!user && token) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(async (res) => {
          if (!res.ok) return;
          const body = await res.json();
          setUser(body as AuthUser);
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY);
        });
    }
  }, [user]);

  const closeAuth = () => {
    setAuthOpen(false);
    setPendingAction(null);
  };

  const openAuth = (mode: AuthMode = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const completeAuth = (nextUser: AuthUser) => {
    setUser(nextUser);
    setAuthOpen(false);
    setAuthError('');
    const action = pendingAction;
    setPendingAction(null);
    if (action) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      Promise.resolve(action());
    }
  };

  const login = async (username: string, password: string) => {
    const authenticated = await requestToken('login', username, password);
    completeAuth(authenticated);
  };

  const register = async (username: string, password: string) => {
    const registered = await requestToken('register', username, password);
    completeAuth(registered);
  };

  const logout = () => {
    setUser(null);
    setPendingAction(null);
  };

  const requireAuth = (action: () => void | Promise<void>) => {
    if (user) {
      void action();
      return;
    }
    setPendingAction(() => action);
    openAuth('login');
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    authMode,
    authOpen,
    setAuthMode,
    openAuth,
    closeAuth,
    requireAuth,
    login,
    register,
    logout,
  }), [user, authMode, authOpen]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
