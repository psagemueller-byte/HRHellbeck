/**
 * HR-Tool API Integration Layer
 *
 * Diese Datei dient als Abstraktionsschicht für die spätere Anbindung
 * an ein externes HR-Tool (z.B. Personio, HRworks, etc.).
 *
 * Aktuell werden Mock-Daten verwendet. Bei der Integration muss nur
 * diese Datei angepasst werden — alle Komponenten nutzen diese API-Schicht.
 */

import { User, VacationRequest, VacationBalance } from "@/types";
import {
  mockUser,
  mockVacationBalance,
  mockVacationRequests,
} from "@/lib/mock-data";

// Configuration for HR tool connection
const HR_API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_HR_API_URL || "",
  apiKey: process.env.HR_API_KEY || "",
  enabled: process.env.NEXT_PUBLIC_HR_INTEGRATION_ENABLED === "true",
};

export async function fetchUserProfile(userId: string): Promise<User> {
  if (HR_API_CONFIG.enabled) {
    const res = await fetch(`${HR_API_CONFIG.baseUrl}/employees/${userId}`, {
      headers: { Authorization: `Bearer ${HR_API_CONFIG.apiKey}` },
    });
    return res.json();
  }
  return { ...mockUser, id: userId };
}

export async function updateUserProfile(
  userId: string,
  data: Partial<User>
): Promise<User> {
  if (HR_API_CONFIG.enabled) {
    const res = await fetch(`${HR_API_CONFIG.baseUrl}/employees/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${HR_API_CONFIG.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  }
  return { ...mockUser, ...data };
}

export async function fetchVacationBalance(
  userId: string
): Promise<VacationBalance> {
  if (HR_API_CONFIG.enabled) {
    const res = await fetch(
      `${HR_API_CONFIG.baseUrl}/employees/${userId}/vacation-balance`,
      { headers: { Authorization: `Bearer ${HR_API_CONFIG.apiKey}` } }
    );
    return res.json();
  }
  void userId;
  return mockVacationBalance;
}

export async function fetchVacationRequests(
  userId: string
): Promise<VacationRequest[]> {
  if (HR_API_CONFIG.enabled) {
    const res = await fetch(
      `${HR_API_CONFIG.baseUrl}/employees/${userId}/vacation-requests`,
      { headers: { Authorization: `Bearer ${HR_API_CONFIG.apiKey}` } }
    );
    return res.json();
  }
  void userId;
  return mockVacationRequests;
}

export async function createVacationRequest(
  request: Omit<VacationRequest, "id" | "createdAt" | "status">
): Promise<VacationRequest> {
  if (HR_API_CONFIG.enabled) {
    const res = await fetch(`${HR_API_CONFIG.baseUrl}/vacation-requests`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HR_API_CONFIG.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    return res.json();
  }
  return {
    ...request,
    id: `vac-${Date.now()}`,
    status: "ausstehend",
    createdAt: new Date().toISOString().split("T")[0],
  };
}

export async function cancelVacationRequest(
  requestId: string
): Promise<boolean> {
  if (HR_API_CONFIG.enabled) {
    const res = await fetch(
      `${HR_API_CONFIG.baseUrl}/vacation-requests/${requestId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${HR_API_CONFIG.apiKey}` },
      }
    );
    return res.ok;
  }
  void requestId;
  return true;
}
