"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { User, UserRole, USER_ROLES } from "@/types";
import { mockUsers } from "@/lib/mock-data";
import { isValidEmail, sanitizeString } from "@/lib/sanitize";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  allUsers: User[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  toggleUserActive: (userId: string) => void;
  hasRole: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  autor: 2,
  benutzer: 1,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(mockUsers);
  const loginAttempts = useRef(0);
  const lockoutUntil = useRef(0);

  const login = useCallback(async (email: string, _password: string): Promise<{ success: boolean; error?: string }> => {
    const now = Date.now();
    if (now < lockoutUntil.current) {
      const remainingSec = Math.ceil((lockoutUntil.current - now) / 1000);
      return { success: false, error: `Zu viele Versuche. Bitte warte ${remainingSec} Sekunden.` };
    }

    const cleanEmail = sanitizeString(email).toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return { success: false, error: "Bitte eine gültige E-Mail-Adresse eingeben." };
    }

    if (!_password || _password.length < 1 || _password.length > 128) {
      return { success: false, error: "Bitte ein gültiges Passwort eingeben." };
    }

    loginAttempts.current += 1;
    if (loginAttempts.current >= MAX_LOGIN_ATTEMPTS) {
      lockoutUntil.current = now + LOCKOUT_DURATION_MS;
      loginAttempts.current = 0;
      return { success: false, error: "Zu viele Fehlversuche. Konto für 60 Sekunden gesperrt." };
    }

    // Find user by email — in production this would call an API
    const foundUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (foundUser) {
      if (!foundUser.isActive) {
        return { success: false, error: "Dein Konto wurde deaktiviert. Kontaktiere hr@hellbeck.de." };
      }
      loginAttempts.current = 0;
      setUser(foundUser);
      return { success: true };
    }

    return { success: false, error: "Ungültige Anmeldedaten." };
  }, [allUsers]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      setAllUsers((users) => users.map((u) => (u.id === updated.id ? updated : u)));
      return updated;
    });
  }, []);

  const updateUserRole = useCallback((userId: string, role: UserRole) => {
    if (!USER_ROLES.includes(role)) return;
    setAllUsers((users) =>
      users.map((u) => (u.id === userId ? { ...u, role } : u))
    );
  }, []);

  const toggleUserActive = useCallback((userId: string) => {
    setAllUsers((users) =>
      users.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
  }, []);

  const hasRole = useCallback(
    (requiredRole: UserRole | UserRole[]) => {
      if (!user) return false;
      if (Array.isArray(requiredRole)) {
        return requiredRole.some(
          (r) => ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[r]
        );
      }
      return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        allUsers,
        login,
        logout,
        updateUser,
        updateUserRole,
        toggleUserActive,
        hasRole,
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
