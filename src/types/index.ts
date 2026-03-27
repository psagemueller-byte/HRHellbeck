export const USER_ROLES = ["admin", "autor", "benutzer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  role: UserRole;
  avatar?: string;
  phone: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  birthDate: string;
  startDate: string;
  managerId?: string;
  isActive: boolean;
  totalVacationDays?: number; // Default 30
}

export interface Department {
  id: string;
  name: string;
  headId: string;
  color: string;
}

export interface VacationRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  days: number;
  type: "urlaub" | "sonderurlaub" | "unbezahlt";
  status: "ausstehend" | "genehmigt" | "abgelehnt" | "storniert";
  reason?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface VacationBalance {
  total: number;
  used: number;
  planned: number;
  remaining: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: "unternehmen" | "team" | "event" | "hr";
  publishedAt: string;
  imageUrl?: string;
  likes: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export const SHIFT_TYPES = ["frueh", "spaet", "nacht", "frei", "feiertag", "urlaub", "sonderurlaub", "krank"] as const;
export type ShiftType = (typeof SHIFT_TYPES)[number];

export interface ShiftEntry {
  id: string;
  userId: string;
  date: string;
  type: ShiftType;
  startTime?: string;
  endTime?: string;
  note?: string;
  createdBy: string;
}

export const DISRUPTION_CATEGORIES = [
  "maschinenstillstand",
  "materialfehler",
  "qualitaetsmangel",
  "sicherheitsvorfall",
  "it-stoerung",
  "sonstiges",
] as const;
export type DisruptionCategory = (typeof DISRUPTION_CATEGORIES)[number];

export interface DisruptionReport {
  id: string;
  reporterId: string;
  category: DisruptionCategory;
  title: string;
  description: string;
  location?: string;
  imageUrls: string[];
  status: "offen" | "in_bearbeitung" | "erledigt";
  createdAt: string;
  assignedTo?: string;
}

export interface HandoverProtocol {
  id: string;
  authorId: string;
  shiftDate: string;
  shiftType: ShiftType;
  machineStatus: string;
  openTasks: string;
  incidents: string;
  notes: string;
  createdAt: string;
}

export interface VacationCancelRequest {
  id: string;
  vacationId: string;
  userId: string;
  reason: string;
  cancelDates?: string[]; // specific dates to cancel (partial cancellation)
  status: "ausstehend" | "genehmigt" | "abgelehnt";
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface HRToolConfig {
  apiBaseUrl: string;
  apiKey: string;
  syncEnabled: boolean;
}
