"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { User } from "@/types";
import { mockUser } from "@/lib/mock-data";
import { isValidEmail, sanitizeString } from "@/lib/sanitize";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const loginAttempts = useRef(0);
  const lockoutUntil = useRef(0);

  const login = useCallback(async (email: string, _password: string): Promise<{ success: boolean; error?: string }> => {
    const now = Date.now();
    if (now < lockoutUntil.current) {
      const remainingSec = Math.ceil((lockoutUntil.current - now) / 1000);
      return { success: false, error: `Zu viele Versuche. Bitte warte ${remainingSec} Sekunden.` };
    }

    const cleanEmail = sanitizeString(email);
    if (!isValidEmail(cleanEmail)) {
      return { success: false, error: "Bitte eine gültige E-Mail-Adresse eingeben." };
    }

    if (!_password || _password.length < 1 || _password.length > 128) {
      return { success: false, error: "Bitte ein gültiges Passwort eingeben." };
    }

    // Mock login — in production this would call an API
    loginAttempts.current += 1;
    if (loginAttempts.current >= MAX_LOGIN_ATTEMPTS) {
      lockoutUntil.current = now + LOCKOUT_DURATION_MS;
      loginAttempts.current = 0;
      return { success: false, error: "Zu viele Fehlversuche. Konto für 60 Sekunden gesperrt." };
    }

    if (cleanEmail && _password) {
      loginAttempts.current = 0;
      setUser({ ...mockUser, email: cleanEmail });
      return { success: true };
    }
    return { success: false, error: "Ungültige Anmeldedaten." };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
