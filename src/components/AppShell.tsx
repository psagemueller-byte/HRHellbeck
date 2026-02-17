"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import CookieConsent from "./CookieConsent";

const PUBLIC_ROUTES = ["/login", "/datenschutz", "/impressum", "/passwort-vergessen", "/passwort-zuruecksetzen", "/konto-einrichten"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[var(--color-border)] flex items-center px-4 z-30">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
        >
          <Menu className="h-6 w-6" />
        </button>
        <img src="/logo_hellbeck.svg" alt="Hellbeck" className="h-7 ml-3" />
        <span className="text-base font-bold text-[var(--color-text-primary)] ml-2">
          HR Portal
        </span>
      </header>

      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <main className="md:ml-64 p-4 md:p-8 flex-1 mt-14 md:mt-0">{children}</main>
      <div className="md:ml-64">
        <Footer />
      </div>
      <CookieConsent />
    </div>
  );
}
