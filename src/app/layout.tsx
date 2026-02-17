import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "HR Portal — Hellbeck",
  description: "Mitarbeiterportal für Hellbeck — Urlaub, News und persönliche Daten",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <SessionProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
