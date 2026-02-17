"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import CookieConsent from "./CookieConsent";

const PUBLIC_ROUTES = ["/login", "/datenschutz", "/impressum", "/passwort-vergessen", "/passwort-zuruecksetzen"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !isPublicRoute) {
      router.push("/login");
    }
    if (isAuthenticated && pathname === "/login") {
      router.push("/dashboard");
    }
    if (isAuthenticated && (pathname === "/admin" || pathname === "/organigramm") && !hasRole("admin")) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname, isPublicRoute, hasRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-secondary)]">
        <div className="h-8 w-8 border-2 border-[var(--color-primary-600)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPublicRoute || !isAuthenticated) {
    return (
      <>
        {children}
        <CookieConsent />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)] flex flex-col">
      <Sidebar />
      <main className="ml-64 p-8 flex-1">{children}</main>
      <div className="ml-64">
        <Footer />
      </div>
      <CookieConsent />
    </div>
  );
}
