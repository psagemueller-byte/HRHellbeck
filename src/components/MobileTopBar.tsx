"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";

export default function MobileTopBar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[rgba(251,249,248,0.8)] px-6 py-3 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1">
            {menuOpen ? (
              <X className="h-5 w-5 text-[var(--color-text-primary)]" />
            ) : (
              <Menu className="h-5 w-5 text-[var(--color-text-primary)]" />
            )}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo_hellbeck.svg" alt="Hellbeck" className="h-8" />
            <span className="text-lg font-black text-[var(--color-primary-600)] tracking-tight uppercase">
              HELLBECK
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link href="/profile">
            {user?.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              className="h-10 w-10 rounded-xl object-cover border-2 border-[var(--color-primary-400)]"
            />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-bold text-sm border-2 border-[var(--color-primary-400)]">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          )}
          </Link>
        </div>
      </header>

      {/* Mobile slide-out menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl animate-[slideIn_0.2s_ease-out]">
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
}
