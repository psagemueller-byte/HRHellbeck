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
}

export interface VacationRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  days: number;
  type: "urlaub" | "sonderurlaub" | "unbezahlt";
  status: "ausstehend" | "genehmigt" | "abgelehnt";
  reason?: string;
  createdAt: string;
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
}

export interface HRToolConfig {
  apiBaseUrl: string;
  apiKey: string;
  syncEnabled: boolean;
}
