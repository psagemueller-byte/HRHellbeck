"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Newspaper, CalendarRange, Palmtree, Network, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/personalplanung", label: "Schicht", icon: CalendarRange },
  { href: "/vacation", label: "Urlaub", icon: Palmtree },
  { href: "/organigramm", label: "Organigramm", icon: Network },
  { href: "/chat", label: "Chat", icon: MessageSquare },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { getConversations } = useAuth();
  const conversations = getConversations();
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface-secondary)] border-t border-[var(--color-border-light)] md:hidden">
      <div className="flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] relative transition-colors ${
                isActive
                  ? "text-[var(--color-primary-600)] bg-[rgba(0,158,226,0.1)]"
                  : "text-[var(--color-text-placeholder)]"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className={`text-[10px] tracking-[0.25px] uppercase ${isActive ? "font-medium" : "font-medium"}`}>
                {item.label}
              </span>
              {item.href === "/chat" && totalUnread > 0 && (
                <span className="absolute -top-0.5 right-1 bg-[var(--color-primary-400)] text-white text-[8px] font-bold px-1 py-0.5 rounded-full min-w-[14px] text-center leading-none">
                  {totalUnread}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
