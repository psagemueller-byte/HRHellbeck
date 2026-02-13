"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { User, UserRole, USER_ROLES, NewsArticle, VacationRequest, ChatMessage, Department } from "@/types";
import { mockUsers, mockNews, mockVacationRequests, mockChatMessages, mockDepartments } from "@/lib/mock-data";
import { isValidEmail, sanitizeString } from "@/lib/sanitize";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  allUsers: User[];
  departments: Department[];
  news: NewsArticle[];
  vacationRequests: VacationRequest[];
  chatMessages: ChatMessage[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  toggleUserActive: (userId: string) => void;
  addUser: (data: Omit<User, "id" | "isActive">) => { success: boolean; error?: string };
  removeUser: (userId: string) => void;
  hasRole: (requiredRole: UserRole | UserRole[]) => boolean;
  toggleNewsLike: (newsId: string) => void;
  addVacationRequest: (req: Omit<VacationRequest, "id" | "createdAt" | "status">) => void;
  approveVacation: (requestId: string) => void;
  rejectVacation: (requestId: string) => void;
  canApproveVacation: (request: VacationRequest) => boolean;
  sendMessage: (receiverId: string, content: string) => void;
  markMessagesRead: (partnerId: string) => void;
  getConversations: () => { partnerId: string; partner: User; lastMessage: ChatMessage; unreadCount: number }[];
  getMessages: (partnerId: string) => ChatMessage[];
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
  const [departments] = useState<Department[]>(mockDepartments);
  const [news, setNews] = useState<NewsArticle[]>(mockNews);
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>(mockVacationRequests);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
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

  const addUser = useCallback((data: Omit<User, "id" | "isActive">): { success: boolean; error?: string } => {
    const emailExists = allUsers.some(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );
    if (emailExists) {
      return { success: false, error: "Ein Nutzer mit dieser E-Mail existiert bereits." };
    }
    if (!isValidEmail(data.email)) {
      return { success: false, error: "Bitte eine gültige E-Mail-Adresse eingeben." };
    }
    if (!USER_ROLES.includes(data.role)) {
      return { success: false, error: "Ungültige Rolle." };
    }
    const newUser: User = {
      ...data,
      id: `usr-${Date.now()}`,
      isActive: true,
    };
    setAllUsers((users) => [...users, newUser]);
    return { success: true };
  }, [allUsers]);

  const removeUser = useCallback((userId: string) => {
    setAllUsers((users) => users.filter((u) => u.id !== userId));
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

  // --- News Likes ---
  const toggleNewsLike = useCallback((newsId: string) => {
    if (!user) return;
    setNews((prev) =>
      prev.map((article) => {
        if (article.id !== newsId) return article;
        const alreadyLiked = article.likes.includes(user.id);
        return {
          ...article,
          likes: alreadyLiked
            ? article.likes.filter((id) => id !== user.id)
            : [...article.likes, user.id],
        };
      })
    );
  }, [user]);

  // --- Vacation Management ---
  const addVacationRequest = useCallback((req: Omit<VacationRequest, "id" | "createdAt" | "status">) => {
    const newReq: VacationRequest = {
      ...req,
      id: `vac-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      status: "ausstehend",
    };
    setVacationRequests((prev) => [newReq, ...prev]);
  }, []);

  const canApproveVacation = useCallback((request: VacationRequest): boolean => {
    if (!user) return false;
    // Admin can approve everything
    if (user.role === "admin") return true;
    // Department head can approve their team members' requests
    const requestUser = allUsers.find((u) => u.id === request.userId);
    if (!requestUser) return false;
    // If the requester's managerId is the current user, they can approve
    return requestUser.managerId === user.id;
  }, [user, allUsers]);

  const approveVacation = useCallback((requestId: string) => {
    if (!user) return;
    setVacationRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? { ...req, status: "genehmigt" as const, approvedBy: user.id, approvedAt: new Date().toISOString().split("T")[0] }
          : req
      )
    );
  }, [user]);

  const rejectVacation = useCallback((requestId: string) => {
    if (!user) return;
    setVacationRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? { ...req, status: "abgelehnt" as const, approvedBy: user.id, approvedAt: new Date().toISOString().split("T")[0] }
          : req
      )
    );
  }, [user]);

  // --- Chat ---
  const sendMessage = useCallback((receiverId: string, content: string) => {
    if (!user) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setChatMessages((prev) => [...prev, newMsg]);
  }, [user]);

  const markMessagesRead = useCallback((partnerId: string) => {
    if (!user) return;
    setChatMessages((prev) =>
      prev.map((msg) =>
        msg.senderId === partnerId && msg.receiverId === user.id && !msg.read
          ? { ...msg, read: true }
          : msg
      )
    );
  }, [user]);

  const getConversations = useCallback(() => {
    if (!user) return [];

    const partnerMap = new Map<string, { messages: ChatMessage[] }>();

    chatMessages.forEach((msg) => {
      const partnerId = msg.senderId === user.id ? msg.receiverId : msg.receiverId === user.id ? msg.senderId : null;
      if (!partnerId) return;
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, { messages: [] });
      }
      partnerMap.get(partnerId)!.messages.push(msg);
    });

    const conversations = Array.from(partnerMap.entries())
      .map(([partnerId, data]) => {
        const partner = allUsers.find((u) => u.id === partnerId);
        if (!partner) return null;
        const sorted = data.messages.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        const unreadCount = data.messages.filter(
          (m) => m.senderId === partnerId && m.receiverId === user.id && !m.read
        ).length;
        return {
          partnerId,
          partner,
          lastMessage: sorted[0],
          unreadCount,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());

    return conversations;
  }, [user, chatMessages, allUsers]);

  const getMessages = useCallback((partnerId: string) => {
    if (!user) return [];
    return chatMessages
      .filter(
        (msg) =>
          (msg.senderId === user.id && msg.receiverId === partnerId) ||
          (msg.senderId === partnerId && msg.receiverId === user.id)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [user, chatMessages]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        allUsers,
        departments,
        news,
        vacationRequests,
        chatMessages,
        login,
        logout,
        updateUser,
        updateUserRole,
        toggleUserActive,
        addUser,
        removeUser,
        hasRole,
        toggleNewsLike,
        addVacationRequest,
        approveVacation,
        rejectVacation,
        canApproveVacation,
        sendMessage,
        markMessagesRead,
        getConversations,
        getMessages,
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
