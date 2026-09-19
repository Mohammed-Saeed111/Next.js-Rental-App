"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("rental_token");
    if (stored) {
      setToken(stored);
      fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => { if (u) setUser(u); })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    localStorage.setItem("rental_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, role: string) => {
    setError(null);
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    localStorage.setItem("rental_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("rental_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth gate component (replaces Cognito Authenticator)
const Auth = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const isAuthPage = pathname.match(/^\/(signin|signup)$/);
  const isDashboardPage =
    pathname.startsWith("/manager") || pathname.startsWith("/tenants");

  useEffect(() => {
    if (!isLoading && user && isAuthPage) {
      router.push("/");
    }
    if (!isLoading && !user && isDashboardPage) {
      router.push("/signin");
    }
  }, [user, isLoading, isAuthPage, isDashboardPage, router]);

  if (isLoading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;

  return <>{children}</>;
};

export default Auth;
