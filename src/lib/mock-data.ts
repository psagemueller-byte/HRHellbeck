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
  {
    id: "usr-002",
    email: "p.sagemueller@googlemail.com",
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
  "usr-001": "011d7a4601b9913c24996b3a46c25b8e326cd6a76bbd0a4bdccbaba926614985",
  "usr-002": "76571d92c88e55f118d96f36c394e28a12452288afc1ec342fcdb911ac6a50d4",
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
