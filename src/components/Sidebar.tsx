"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Palmtree,
  LogOut,
  Shield,
  Crown,
  PenTool,
  User as UserIcon,
  MessageSquare,
  Network,
  Newspaper,
  Calendar,
  CalendarRange,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";

const roleLabels: Record<UserRole, { label: string; icon: typeof Crown; color: string }> = {
  admin: { label: "Administrator", icon: Crown, color: "text-amber-600" },
  autor: { label: "Autor", icon: PenTool, color: "text-blue-600" },
  benutzer: { label: "Benutzer", icon: UserIcon, color: "text-gray-500" },
};

const navItems: { href: string; label: string; icon: typeof LayoutDashboard; minRole: UserRole; managerOnly?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, minRole: "benutzer" },
  { href: "/news", label: "News", icon: Newspaper, minRole: "benutzer" },
  { href: "/profile", label: "Meine Daten", icon: User, minRole: "benutzer" },
  { href: "/kalender", label: "Kalender", icon: Calendar, minRole: "benutzer" },
  { href: "/personalplanung", label: "Personalplanung", icon: CalendarRange, minRole: "benutzer", managerOnly: true },
  { href: "/vacation", label: "Urlaub", icon: Palmtree, minRole: "benutzer" },
  { href: "/chat", label: "Nachrichten", icon: MessageSquare, minRole: "benutzer" },
  { href: "/organigramm", label: "Organigramm", icon: Network, minRole: "admin" },
  { href: "/admin", label: "Administration", icon: Shield, minRole: "admin" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, hasRole, allUsers, getConversations, getPendingApprovalsCount } = useAuth();
  const conversations = getConversations();
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const pendingApprovals = getPendingApprovalsCount();
  const isManager = user?.role === "admin" || allUsers.some((u) => u.managerId === user?.id);

  const roleInfo = user ? roleLabels[user.role] : null;
  const RoleBadgeIcon = roleInfo?.icon;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-[var(--color-border)] flex flex-col z-50 transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--color-border)]">
          <img src="/logo_hellbeck.svg" alt="Hellbeck" className="h-9 mr-3" />
          <span className="text-lg font-bold text-[var(--color-text-primary)]">
            HR Portal
          </span>
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="ml-auto md:hidden p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems
              .filter((item) => hasRole(item.minRole) && (!item.managerOnly || isManager))
              .map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
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
                      {item.href === "/vacation" && pendingApprovals > 0 && (
                        <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {pendingApprovals}
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
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-10 w-10 rounded-full object-cover border border-[var(--color-border)] flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-semibold text-sm flex-shrink-0">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
            )}
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
    </>
  );
}
