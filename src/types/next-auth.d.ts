import type { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      firstName: string;
      lastName: string;
      department: string;
      position: string;
      isActive: boolean;
    };
  }

  interface User {
    role?: UserRole;
    firstName?: string;
    lastName?: string;
    department?: string;
    position?: string;
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    department: string;
    position: string;
    isActive: boolean;
  }
}
