"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { User, UserRole, USER_ROLES, NewsArticle, VacationRequest, ChatMessage, Department, ShiftEntry, ShiftType, SHIFT_TYPES, DisruptionReport, DisruptionCategory, DISRUPTION_CATEGORIES, HandoverProtocol } from "@/types";
import { mockUsers, mockNews, mockVacationRequests, mockChatMessages, mockDepartments, mockShiftEntries, mockDisruptionReports, mockHandoverProtocols } from "@/lib/mock-data";
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
  addDepartment: (name: string, color: string) => { success: boolean; error?: string };
  updateDepartment: (deptId: string, data: { name?: string; headId?: string; color?: string }) => void;
  deleteDepartment: (deptId: string) => void;
  moveUserToDepartment: (userId: string, department: string, managerId?: string) => void;
  getPendingApprovalsCount: () => number;
  toggleNewsLike: (newsId: string) => void;
  addNews: (data: Omit<NewsArticle, "id" | "publishedAt" | "likes">) => void;
  deleteNews: (newsId: string) => void;
  addVacationRequest: (req: Omit<VacationRequest, "id" | "createdAt" | "status">) => void;
  approveVacation: (requestId: string) => void;
  rejectVacation: (requestId: string) => void;
  canApproveVacation: (request: VacationRequest) => boolean;
  sendMessage: (receiverId: string, content: string) => void;
  markMessagesRead: (partnerId: string) => void;
  getConversations: () => { partnerId: string; partner: User; lastMessage: ChatMessage; unreadCount: number }[];
  getMessages: (partnerId: string) => ChatMessage[];
  // Shifts
  shiftEntries: ShiftEntry[];
  addShift: (data: Omit<ShiftEntry, "id">) => void;
  updateShift: (shiftId: string, data: Partial<ShiftEntry>) => void;
  deleteShift: (shiftId: string) => void;
  getShiftsForUser: (userId: string, month: number, year: number) => ShiftEntry[];
  // Disruptions
  disruptionReports: DisruptionReport[];
  addDisruption: (data: Omit<DisruptionReport, "id" | "createdAt" | "status">) => void;
  updateDisruptionStatus: (disruptionId: string, status: DisruptionReport["status"]) => void;
  getDisruptionsForUser: (userId: string) => DisruptionReport[];
  // Handover Protocols
  handoverProtocols: HandoverProtocol[];
  addHandover: (data: Omit<HandoverProtocol, "id" | "createdAt">) => void;
  getHandoversForUser: (userId: string) => HandoverProtocol[];
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
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [news, setNews] = useState<NewsArticle[]>(mockNews);
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>(mockVacationRequests);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [shiftEntries, setShiftEntries] = useState<ShiftEntry[]>(mockShiftEntries);
  const [disruptionReports, setDisruptionReports] = useState<DisruptionReport[]>(mockDisruptionReports);
  const [handoverProtocols, setHandoverProtocols] = useState<HandoverProtocol[]>(mockHandoverProtocols);
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

  // --- Department Management ---
  const addDepartment = useCallback((name: string, color: string): { success: boolean; error?: string } => {
    const cleanName = sanitizeString(name).slice(0, 50);
    if (!cleanName) return { success: false, error: "Bitte einen Abteilungsnamen eingeben." };
    const exists = departments.some((d) => d.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) return { success: false, error: "Eine Abteilung mit diesem Namen existiert bereits." };
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: cleanName,
      headId: "",
      color: color || "bg-gray-100 text-gray-700 border-gray-200",
    };
    setDepartments((prev) => [...prev, newDept]);
    return { success: true };
  }, [departments]);

  const updateDepartment = useCallback((deptId: string, data: { name?: string; headId?: string; color?: string }) => {
    setDepartments((prev) =>
      prev.map((d) => {
        if (d.id !== deptId) return d;
        const updated = { ...d };
        if (data.name !== undefined) updated.name = sanitizeString(data.name).slice(0, 50);
        if (data.headId !== undefined) {
          // Update old head's managerId references
          const oldHeadId = d.headId;
          updated.headId = data.headId;
          // Set the new head's managerId to empty (they are the top of the dept)
          if (data.headId) {
            setAllUsers((users) =>
              users.map((u) => {
                if (u.id === data.headId) return { ...u, managerId: undefined };
                // Reassign members who reported to old head to new head
                if (u.managerId === oldHeadId && u.department === d.name && u.id !== data.headId) {
                  return { ...u, managerId: data.headId };
                }
                return u;
              })
            );
          }
        }
        if (data.color !== undefined) updated.color = data.color;
        return updated;
      })
    );
  }, []);

  const deleteDepartment = useCallback((deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;
    // Move all users in this department to "Ohne Abteilung"
    setAllUsers((users) =>
      users.map((u) =>
        u.department === dept.name ? { ...u, department: "Ohne Abteilung", managerId: undefined } : u
      )
    );
    setDepartments((prev) => prev.filter((d) => d.id !== deptId));
  }, [departments]);

  const moveUserToDepartment = useCallback((userId: string, department: string, managerId?: string) => {
    setAllUsers((users) =>
      users.map((u) => {
        if (u.id !== userId) return u;
        return { ...u, department, managerId: managerId || undefined };
      })
    );
    // Update current user if it's the logged-in user
    setUser((prev) => {
      if (!prev || prev.id !== userId) return prev;
      return { ...prev, department, managerId: managerId || undefined };
    });
  }, []);

  const getPendingApprovalsCount = useCallback(() => {
    if (!user) return 0;
    return vacationRequests.filter(
      (r) => r.status === "ausstehend" && r.userId !== user.id && (
        user.role === "admin" ||
        allUsers.find((u) => u.id === r.userId)?.managerId === user.id
      )
    ).length;
  }, [user, vacationRequests, allUsers]);

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

  const addNews = useCallback((data: Omit<NewsArticle, "id" | "publishedAt" | "likes">) => {
    const newArticle: NewsArticle = {
      ...data,
      id: `news-${Date.now()}`,
      publishedAt: new Date().toISOString().split("T")[0],
      likes: [],
    };
    setNews((prev) => [newArticle, ...prev]);
  }, []);

  const deleteNews = useCallback((newsId: string) => {
    setNews((prev) => prev.filter((n) => n.id !== newsId));
  }, []);

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

  // --- Shift Management ---
  const addShift = useCallback((data: Omit<ShiftEntry, "id">) => {
    if (!SHIFT_TYPES.includes(data.type)) return;
    const newShift: ShiftEntry = {
      ...data,
      id: `shift-${Date.now()}`,
    };
    setShiftEntries((prev) => [...prev, newShift]);
  }, []);

  const updateShift = useCallback((shiftId: string, data: Partial<ShiftEntry>) => {
    setShiftEntries((prev) =>
      prev.map((s) => (s.id === shiftId ? { ...s, ...data } : s))
    );
  }, []);

  const deleteShift = useCallback((shiftId: string) => {
    setShiftEntries((prev) => prev.filter((s) => s.id !== shiftId));
  }, []);

  const getShiftsForUser = useCallback((userId: string, month: number, year: number) => {
    return shiftEntries.filter((s) => {
      if (s.userId !== userId) return false;
      const d = new Date(s.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [shiftEntries]);

  // --- Disruption Management ---
  const addDisruption = useCallback((data: Omit<DisruptionReport, "id" | "createdAt" | "status">) => {
    if (!DISRUPTION_CATEGORIES.includes(data.category)) return;
    const newReport: DisruptionReport = {
      ...data,
      id: `dis-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "offen",
    };
    setDisruptionReports((prev) => [newReport, ...prev]);
    // Send chat message to supervisor
    if (data.assignedTo && user) {
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-dis`,
        senderId: user.id,
        receiverId: data.assignedTo,
        content: `Neue Störungsmeldung: ${data.title} (${data.category})`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setChatMessages((prev) => [...prev, newMsg]);
    }
  }, [user]);

  const updateDisruptionStatus = useCallback((disruptionId: string, status: DisruptionReport["status"]) => {
    const validStatuses: DisruptionReport["status"][] = ["offen", "in_bearbeitung", "erledigt"];
    if (!validStatuses.includes(status)) return;
    setDisruptionReports((prev) =>
      prev.map((d) => (d.id === disruptionId ? { ...d, status } : d))
    );
  }, []);

  const getDisruptionsForUser = useCallback((userId: string) => {
    return disruptionReports.filter(
      (d) => d.reporterId === userId || d.assignedTo === userId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [disruptionReports]);

  // --- Handover Protocol Management ---
  const addHandover = useCallback((data: Omit<HandoverProtocol, "id" | "createdAt">) => {
    if (!SHIFT_TYPES.includes(data.shiftType)) return;
    const newProtocol: HandoverProtocol = {
      ...data,
      id: `hand-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setHandoverProtocols((prev) => [newProtocol, ...prev]);
  }, []);

  const getHandoversForUser = useCallback((userId: string) => {
    return handoverProtocols
      .filter((h) => h.authorId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [handoverProtocols]);

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
        addDepartment,
        updateDepartment,
        deleteDepartment,
        moveUserToDepartment,
        getPendingApprovalsCount,
        toggleNewsLike,
        addNews,
        deleteNews,
        addVacationRequest,
        approveVacation,
        rejectVacation,
        canApproveVacation,
        sendMessage,
        markMessagesRead,
        getConversations,
        getMessages,
        shiftEntries,
        addShift,
        updateShift,
        deleteShift,
        getShiftsForUser,
        disruptionReports,
        addDisruption,
        updateDisruptionStatus,
        getDisruptionsForUser,
        handoverProtocols,
        addHandover,
        getHandoversForUser,
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
