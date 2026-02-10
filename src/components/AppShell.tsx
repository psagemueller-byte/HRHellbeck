"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login");
    }
    if (isAuthenticated && pathname === "/login") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, pathname, router]);

  if (pathname === "/login" || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)]">
      <Sidebar />
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
