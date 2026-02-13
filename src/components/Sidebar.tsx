"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Palmtree,
  LogOut,
  Building2,
  Shield,
  Crown,
  PenTool,
  User as UserIcon,
  MessageSquare,
  Network,
  Newspaper,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";

const roleLabels: Record<UserRole, { label: string; icon: typeof Crown; color: string }> = {
  admin: { label: "Administrator", icon: Crown, color: "text-amber-600" },
  autor: { label: "Autor", icon: PenTool, color: "text-blue-600" },
  benutzer: { label: "Benutzer", icon: UserIcon, color: "text-gray-500" },
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, minRole: "benutzer" as UserRole },
  { href: "/news", label: "News", icon: Newspaper, minRole: "benutzer" as UserRole },
  { href: "/profile", label: "Meine Daten", icon: User, minRole: "benutzer" as UserRole },
  { href: "/vacation", label: "Urlaub", icon: Palmtree, minRole: "benutzer" as UserRole },
  { href: "/chat", label: "Nachrichten", icon: MessageSquare, minRole: "benutzer" as UserRole },
  { href: "/organigramm", label: "Organigramm", icon: Network, minRole: "admin" as UserRole },
  { href: "/admin", label: "Administration", icon: Shield, minRole: "admin" as UserRole },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole, getConversations } = useAuth();
  const conversations = getConversations();
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const roleInfo = user ? roleLabels[user.role] : null;
  const RoleBadgeIcon = roleInfo?.icon;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-[var(--color-border)] flex flex-col z-50">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--color-border)]">
        <Building2 className="h-8 w-8 text-[var(--color-primary-600)] mr-3" />
        <span className="text-xl font-bold text-[var(--color-text-primary)]">
          HR Portal
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3">
        <ul className="space-y-1">
          {navItems
            .filter((item) => hasRole(item.minRole))
            .map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                    {item.href === "/chat" && totalUnread > 0 && (
                      <span className="ml-auto bg-[var(--color-primary-600)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {totalUnread}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-[var(--color-border)] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-semibold text-sm">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {user?.firstName} {user?.lastName}
            </p>
            {roleInfo && RoleBadgeIcon && (
              <p className={`text-xs flex items-center gap-1 ${roleInfo.color}`}>
                <RoleBadgeIcon className="h-3 w-3" />
                {roleInfo.label}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
