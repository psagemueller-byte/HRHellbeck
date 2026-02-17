import { User, VacationRequest, VacationBalance, NewsArticle, Department, ChatMessage, ShiftEntry, DisruptionReport, HandoverProtocol } from "@/types";

export const mockDepartments: Department[] = [
  { id: "dept-hr", name: "HR", headId: "usr-001", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

export const mockUsers: User[] = [
  {
    id: "usr-001",
    email: "p.sagemueller@hellbeck.info",
    firstName: "Patrick",
    lastName: "Sagemüller",
    position: "HR-Administrator",
    department: "HR",
    role: "admin",
    phone: "",
    street: "",
    city: "Borchen",
    zipCode: "",
    country: "Deutschland",
    birthDate: "1985-01-01",
    startDate: "2019-01-01",
    isActive: true,
  },
];

// Password hashes (SHA-256 of "hellbeck:{password}")
export const mockPasswordHashes: Record<string, string> = {
  "usr-001": "45ef16e56accd172ec154a2c6c68b703399ad58e9962a23c6872e8d607470dfc",
};

// Backwards-compatible default user
export const mockUser: User = mockUsers[0];

export const mockVacationBalance: VacationBalance = {
  total: 30,
  used: 0,
  planned: 0,
  remaining: 30,
};

export const mockVacationRequests: VacationRequest[] = [];

export const mockNews: NewsArticle[] = [];

export const mockShiftEntries: ShiftEntry[] = [];

export const mockDisruptionReports: DisruptionReport[] = [];

export const mockHandoverProtocols: HandoverProtocol[] = [];

export const mockChatMessages: ChatMessage[] = [];
