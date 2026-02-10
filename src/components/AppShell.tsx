"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import CookieConsent from "./CookieConsent";

const PUBLIC_ROUTES = ["/login", "/datenschutz", "/impressum"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isAuthenticated && !isPublicRoute) {
      router.push("/login");
    }
    if (isAuthenticated && pathname === "/login") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, pathname, isPublicRoute, router]);

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
