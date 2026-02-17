import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
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

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim() || user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (dbUser && !dbUser.isActive) {
          return false;
        }

        // Only allow Google login for pre-existing HR users
        if (!dbUser) {
          return "/login?error=NoAccount";
        }
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        // Initial sign-in: load full HR profile from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role as UserRole;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.department = dbUser.department;
          token.position = dbUser.position;
          token.isActive = dbUser.isActive;
        }
      }
      if (trigger === "update") {
        // Refresh profile data from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
        });
        if (dbUser) {
          token.role = dbUser.role as UserRole;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.department = dbUser.department;
          token.position = dbUser.position;
          token.isActive = dbUser.isActive;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as UserRole;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.department = token.department as string;
        session.user.position = token.position as string;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
});
