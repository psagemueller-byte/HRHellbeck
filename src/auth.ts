import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // No PrismaAdapter — we use Credentials + JWT only, no OAuth
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.isActive || !user.passwordHash) return null;

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim() || user.name,
          };
        } catch (error) {
          console.error("[Auth] Database error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id!;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, firstName: true, lastName: true, department: true, isActive: true },
        });
        if (dbUser) {
          token.role = dbUser.role as UserRole;
          token.fn = dbUser.firstName;
          token.ln = dbUser.lastName;
          token.dept = dbUser.department;
          token.act = dbUser.isActive;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = (token.role as UserRole) || "benutzer";
        session.user.firstName = (token.fn as string) || "";
        session.user.lastName = (token.ln as string) || "";
        session.user.department = (token.dept as string) || "";
        session.user.isActive = (token.act as boolean) ?? true;
      }
      return session;
    },
  },
});
