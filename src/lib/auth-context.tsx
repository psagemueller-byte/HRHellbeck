"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { User, UserRole, USER_ROLES, NewsArticle, VacationRequest, VacationBalance, VacationCancelRequest, ChatMessage, Department, ShiftEntry, ShiftType, SHIFT_TYPES, DisruptionReport, DisruptionCategory, DISRUPTION_CATEGORIES, HandoverProtocol } from "@/types";
import { mockUsers, mockNews, mockVacationRequests, mockChatMessages, mockDepartments, mockShiftEntries, mockDisruptionReports, mockHandoverProtocols, mockPasswordHashes } from "@/lib/mock-data";
import { isValidEmail, sanitizeString } from "@/lib/sanitize";
import { calculateWorkingDays } from "@/lib/holidays";
import { hashPassword } from "@/lib/password-utils";

const MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000;

const STORAGE_KEY_PASSWORDS = "hr-portal-passwords";
const STORAGE_KEY_USERS = "hr-portal-users";

function loadFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function saveToStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  addUser: (data: Omit<User, "id" | "isActive">) => { success: boolean; error?: string; userId?: string };
  removeUser: (userId: string) => void;
  setPasswordForUser: (userId: string, passwordHash: string) => void;
  passwordHashes: Record<string, string>;
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
  getVacationBalance: (userId: string) => VacationBalance;
  updateUserVacationDays: (userId: string, days: number) => void;
  // Vacation cancel requests
  vacationCancelRequests: VacationCancelRequest[];
  requestVacationCancel: (vacationId: string, reason: string) => void;
  approveVacationCancel: (cancelId: string) => void;
  rejectVacationCancel: (cancelId: string) => void;
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
  // Sick days (access-controlled: own, manager, admin only)
  getSickDaysCount: (targetUserId: string, year: number) => number | null;
  // Disruptions
  disruptionReports: DisruptionReport[];
  addDisruption: (data: Omit<DisruptionReport, "id" | "createdAt" | "status">) => void;
  updateDisruptionStatus: (disruptionId: string, status: DisruptionReport["status"]) => void;
  getDisruptionsForUser: (userId: string) => DisruptionReport[];
  // Handover Protocols
  handoverProtocols: HandoverProtocol[];
  addHandover: (data: Omit<HandoverProtocol, "id" | "createdAt">) => void;
  getHandoversForUser: (userId: string) => HandoverProtocol[];
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  autor: 2,
  benutzer: 1,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(mockUsers);
  const [passwordHashes, setPasswordHashes] = useState<Record<string, string>>(mockPasswordHashes);
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [news, setNews] = useState<NewsArticle[]>(mockNews);
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>(mockVacationRequests);
  const [vacationCancelRequests, setVacationCancelRequests] = useState<VacationCancelRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [shiftEntries, setShiftEntries] = useState<ShiftEntry[]>(mockShiftEntries);
  const [disruptionReports, setDisruptionReports] = useState<DisruptionReport[]>(mockDisruptionReports);
  const [handoverProtocols, setHandoverProtocols] = useState<HandoverProtocol[]>(mockHandoverProtocols);
  const loginAttempts = useRef(0);
  const lockoutUntil = useRef(0);
  const hydratedRef = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const storedUsers = loadFromStorage<User[]>(STORAGE_KEY_USERS);
    if (storedUsers && storedUsers.length > 0) {
      // Merge: stored users take precedence, add any mock users not in stored
      const storedIds = new Set(storedUsers.map((u) => u.id));
      const merged = [...storedUsers, ...mockUsers.filter((u) => !storedIds.has(u.id))];
      setAllUsers(merged);
    }

    const storedHashes = loadFromStorage<Record<string, string>>(STORAGE_KEY_PASSWORDS);
    if (storedHashes) {
      setPasswordHashes((prev) => ({ ...prev, ...storedHashes }));
    }
  }, []);

  // Persist users to localStorage
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveToStorage(STORAGE_KEY_USERS, allUsers);
  }, [allUsers]);

  // Persist password hashes to localStorage
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveToStorage(STORAGE_KEY_PASSWORDS, passwordHashes);
  }, [passwordHashes]);

  // Sync Auth.js session → context user state (only in non-mock mode)
  // Fetch all users from DB when authenticated (production mode)
  const dbUsersFetched = useRef(false);
  useEffect(() => {
    if (MOCK_AUTH) return;
    if (session.status !== "authenticated" || !session.data?.user) return;
    if (dbUsersFetched.current) return;
    dbUsersFetched.current = true;

    const sessionUser = session.data.user;

    // Set current user from session immediately
    const currentUser: User = {
      id: sessionUser.id,
      email: sessionUser.email || "",
      firstName: sessionUser.firstName || "",
      lastName: sessionUser.lastName || "",
      position: sessionUser.position || "",
      department: sessionUser.department || "Ohne Abteilung",
      role: (sessionUser.role as UserRole) || "benutzer",
      phone: "",
      street: "",
      city: "",
      zipCode: "",
      country: "Deutschland",
      birthDate: "",
      startDate: "",
      isActive: sessionUser.isActive ?? true,
      avatar: sessionUser.image || undefined,
    };
    setUser(currentUser);

    // Fetch all users from DB for admin list
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.users) {
          const dbUsers: User[] = data.users.map((u: Record<string, unknown>) => ({
            id: u.id as string,
            email: u.email as string || "",
            firstName: u.firstName as string || "",
            lastName: u.lastName as string || "",
            position: u.position as string || "",
            department: u.department as string || "Ohne Abteilung",
            role: (u.role as UserRole) || "benutzer",
            phone: u.phone as string || "",
            street: "",
            city: "",
            zipCode: "",
            country: "Deutschland",
            birthDate: "",
            startDate: "",
            isActive: u.isActive as boolean ?? true,
            avatar: u.image as string || undefined,
          }));
          setAllUsers(dbUsers);
          // Update current user with full DB data
          const meFromDb = dbUsers.find((u) => u.id === sessionUser.id);
          if (meFromDb) setUser(meFromDb);
        }
      })
      .catch(() => {
        // Fallback: at least add session user to list
        setAllUsers((prev) => {
          if (prev.some((u) => u.id === currentUser.id)) return prev;
          return [...prev, currentUser];
        });
      });
  }, [session.status, session.data]);

  // Handle unauthenticated state
  useEffect(() => {
    if (MOCK_AUTH) return;
    if (session.status === "unauthenticated") {
      setUser(null);
      dbUsersFetched.current = false;
    }
  }, [session.status]);

  const login = useCallback(async (email: string, _password: string): Promise<{ success: boolean; error?: string }> => {
    if (MOCK_AUTH) {
      // Original mock login logic
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

        const storedHash = passwordHashes[foundUser.id];
        if (storedHash) {
          const inputHash = await hashPassword(_password);
          if (inputHash !== storedHash) {
            return { success: false, error: "Ungültige Anmeldedaten." };
          }
        }

        loginAttempts.current = 0;
        setUser(foundUser);
        return { success: true };
      }

      return { success: false, error: "Ungültige Anmeldedaten." };
    }

    // Auth.js credentials login
    try {
      const cleanEmail = sanitizeString(email).toLowerCase();
      if (!isValidEmail(cleanEmail)) {
        return { success: false, error: "Bitte eine gültige E-Mail-Adresse eingeben." };
      }

      if (!_password || _password.length < 1 || _password.length > 128) {
        return { success: false, error: "Bitte ein gültiges Passwort eingeben." };
      }

      console.log("[Auth] Calling signIn for:", cleanEmail);
      const result = await nextAuthSignIn("credentials", {
        email: cleanEmail,
        password: _password,
        redirect: false,
      });
      console.log("[Auth] signIn returned:", JSON.stringify(result));

      if (!result?.ok || result?.error) {
        console.error("[Auth] signIn failed:", result);
        return { success: false, error: "Ungültige Anmeldedaten." };
      }
      return { success: true };
    } catch (err) {
      console.error("[Auth] signIn exception:", err);
      return { success: false, error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." };
    }
  }, [allUsers, passwordHashes]);

  const logout = useCallback(() => {
    if (MOCK_AUTH) {
      setUser(null);
      return;
    }
    nextAuthSignOut({ callbackUrl: "/login" });
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

  const addUser = useCallback((data: Omit<User, "id" | "isActive">): { success: boolean; error?: string; userId?: string } => {
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
    return { success: true, userId: newUser.id };
  }, [allUsers]);

  const setPasswordForUser = useCallback((userId: string, pwHash: string) => {
    setPasswordHashes((prev) => ({ ...prev, [userId]: pwHash }));
  }, []);

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
          const oldHeadId = d.headId;
          updated.headId = data.headId;
          if (data.headId) {
            setAllUsers((users) =>
              users.map((u) => {
                if (u.id === data.headId) return { ...u, managerId: undefined };
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
    if (user.role === "admin") return true;
    const requestUser = allUsers.find((u) => u.id === request.userId);
    if (!requestUser) return false;
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

  // --- Vacation Balance (dynamic) ---
  const getVacationBalance = useCallback((userId: string): VacationBalance => {
    const targetUser = allUsers.find((u) => u.id === userId);
    const total = targetUser?.totalVacationDays ?? 30;

    const userRequests = vacationRequests.filter(
      (r) => r.userId === userId && r.type !== "unbezahlt"
    );

    const used = userRequests
      .filter((r) => r.status === "genehmigt" && new Date(r.endDate) < new Date())
      .reduce((sum, r) => sum + calculateWorkingDays(r.startDate, r.endDate), 0);

    const planned = userRequests
      .filter((r) => (r.status === "genehmigt" || r.status === "ausstehend") && new Date(r.endDate) >= new Date())
      .reduce((sum, r) => sum + calculateWorkingDays(r.startDate, r.endDate), 0);

    return {
      total,
      used,
      planned,
      remaining: Math.max(0, total - used - planned),
    };
  }, [allUsers, vacationRequests]);

  const updateUserVacationDays = useCallback((userId: string, days: number) => {
    const clampedDays = Math.max(0, Math.min(365, Math.round(days)));
    setAllUsers((users) =>
      users.map((u) => (u.id === userId ? { ...u, totalVacationDays: clampedDays } : u))
    );
  }, []);

  // --- Vacation Cancel Requests ---
  const requestVacationCancel = useCallback((vacationId: string, reason: string) => {
    if (!user) return;
    const vacation = vacationRequests.find((v) => v.id === vacationId);
    if (!vacation || vacation.status !== "genehmigt" || vacation.userId !== user.id) return;
    const alreadyRequested = vacationCancelRequests.some(
      (cr) => cr.vacationId === vacationId && cr.status === "ausstehend"
    );
    if (alreadyRequested) return;

    const newRequest: VacationCancelRequest = {
      id: `cancel-${Date.now()}`,
      vacationId,
      userId: user.id,
      reason: sanitizeString(reason).slice(0, 500),
      status: "ausstehend",
      createdAt: new Date().toISOString(),
    };
    setVacationCancelRequests((prev) => [newRequest, ...prev]);
  }, [user, vacationRequests, vacationCancelRequests]);

  const approveVacationCancel = useCallback((cancelId: string) => {
    if (!user) return;
    const cancelReq = vacationCancelRequests.find((cr) => cr.id === cancelId);
    if (!cancelReq || cancelReq.status !== "ausstehend") return;

    setVacationCancelRequests((prev) =>
      prev.map((cr) =>
        cr.id === cancelId
          ? { ...cr, status: "genehmigt" as const, decidedBy: user.id, decidedAt: new Date().toISOString().split("T")[0] }
          : cr
      )
    );
    setVacationRequests((prev) =>
      prev.map((v) =>
        v.id === cancelReq.vacationId
          ? { ...v, status: "abgelehnt" as const, approvedBy: user.id, approvedAt: new Date().toISOString().split("T")[0] }
          : v
      )
    );
  }, [user, vacationCancelRequests]);

  const rejectVacationCancel = useCallback((cancelId: string) => {
    if (!user) return;
    setVacationCancelRequests((prev) =>
      prev.map((cr) =>
        cr.id === cancelId
          ? { ...cr, status: "abgelehnt" as const, decidedBy: user.id, decidedAt: new Date().toISOString().split("T")[0] }
          : cr
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
  const shiftCounter = useRef(0);
  const addShift = useCallback((data: Omit<ShiftEntry, "id">) => {
    if (!SHIFT_TYPES.includes(data.type)) return;
    shiftCounter.current += 1;
    const newShift: ShiftEntry = {
      ...data,
      id: `shift-${Date.now()}-${shiftCounter.current}`,
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

  // --- Sick Days (access-controlled) ---
  const getSickDaysCount = useCallback((targetUserId: string, year: number): number | null => {
    if (!user) return null;
    const isOwn = user.id === targetUserId;
    const isAdmin = user.role === "admin";
    const targetUser = allUsers.find((u) => u.id === targetUserId);
    const isManager = targetUser?.managerId === user.id;

    if (!isOwn && !isAdmin && !isManager) return null;

    return shiftEntries.filter((s) => {
      if (s.userId !== targetUserId || s.type !== "krank") return false;
      const d = new Date(s.date);
      if (d.getFullYear() !== year) return false;
      const dow = d.getDay();
      return dow !== 0 && dow !== 6;
    }).length;
  }, [user, allUsers, shiftEntries]);

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

  const refreshUsers = useCallback(async () => {
    if (MOCK_AUTH) return;
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success && data.users) {
        const dbUsers: User[] = data.users.map((u: Record<string, unknown>) => ({
          id: u.id as string,
          email: u.email as string || "",
          firstName: u.firstName as string || "",
          lastName: u.lastName as string || "",
          position: u.position as string || "",
          department: u.department as string || "Ohne Abteilung",
          role: (u.role as UserRole) || "benutzer",
          phone: u.phone as string || "",
          street: "",
          city: "",
          zipCode: "",
          country: "Deutschland",
          birthDate: "",
          startDate: "",
          isActive: u.isActive as boolean ?? true,
          avatar: u.image as string || undefined,
        }));
        setAllUsers(dbUsers);
      }
    } catch {
      // silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: !MOCK_AUTH && session.status === "loading",
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
        setPasswordForUser,
        passwordHashes,
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
        getVacationBalance,
        updateUserVacationDays,
        vacationCancelRequests,
        requestVacationCancel,
        approveVacationCancel,
        rejectVacationCancel,
        sendMessage,
        markMessagesRead,
        getConversations,
        getMessages,
        shiftEntries,
        addShift,
        updateShift,
        deleteShift,
        getShiftsForUser,
        getSickDaysCount,
        disruptionReports,
        addDisruption,
        updateDisruptionStatus,
        getDisruptionsForUser,
        handoverProtocols,
        addHandover,
        getHandoversForUser,
        refreshUsers,
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
