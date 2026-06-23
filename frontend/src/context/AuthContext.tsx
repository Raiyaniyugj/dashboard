import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage (remember me) or sessionStorage (tab session)
    const storedToken =
      localStorage.getItem('wc_auth_token') ||
      sessionStorage.getItem('wc_auth_token');
    const storedUser =
      localStorage.getItem('wc_auth_user') ||
      sessionStorage.getItem('wc_auth_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        // Corrupted storage — clear it
        localStorage.removeItem('wc_auth_token');
        localStorage.removeItem('wc_auth_user');
        sessionStorage.removeItem('wc_auth_token');
        sessionStorage.removeItem('wc_auth_user');
      }
    }
    setLoading(false);
  }, []);

  const saveSession = (newToken: string, newUser: User, remember: boolean) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('wc_auth_token', newToken);
    storage.setItem('wc_auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    saveSession(data.token, data.user, rememberMe);
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google login failed.');
    saveSession(data.token, data.user, true);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');
    saveSession(data.token, data.user, true);
  };

  const logout = () => {
    localStorage.removeItem('wc_auth_token');
    localStorage.removeItem('wc_auth_user');
    sessionStorage.removeItem('wc_auth_token');
    sessionStorage.removeItem('wc_auth_user');
    setToken(null);
    setUser(null);
  };

  const authFetch = useCallback((url: string, options: RequestInit = {}): Promise<Response> => {
    const currentToken =
      token ||
      localStorage.getItem('wc_auth_token') ||
      sessionStorage.getItem('wc_auth_token');

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
      }
    });
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
