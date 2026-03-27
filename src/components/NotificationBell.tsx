"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare, Palmtree, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Notification {
  id: string;
  type: "chat" | "vacation-approval" | "vacation-status";
  title: string;
  description: string;
  href: string;
  time?: string;
}

export default function NotificationBell() {
  const {
    user,
    allUsers,
    vacationRequests,
    getConversations,
    getPendingApprovalsCount,
  } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!user) return null;

  const notifications: Notification[] = [];

  // 1. Unread chat messages
  const conversations = getConversations();
  for (const conv of conversations) {
    if (conv.unreadCount > 0) {
      notifications.push({
        id: `chat-${conv.partnerId}`,
        type: "chat",
        title: `Nachricht von ${conv.partner.firstName} ${conv.partner.lastName}`,
        description: conv.lastMessage.content.length > 60
          ? conv.lastMessage.content.slice(0, 60) + "..."
          : conv.lastMessage.content,
        href: "/chat",
        time: new Date(conv.lastMessage.timestamp).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
  }

  // 2. Pending vacation approvals (for admins / managers)
  const pendingApprovals = vacationRequests.filter(
    (r) =>
      r.status === "ausstehend" &&
      r.userId !== user.id &&
      (user.role === "admin" ||
        allUsers.find((u) => u.id === r.userId)?.managerId === user.id)
  );
  for (const req of pendingApprovals) {
    const requestUser = allUsers.find((u) => u.id === req.userId);
    if (requestUser) {
      notifications.push({
        id: `vac-approve-${req.id}`,
        type: "vacation-approval",
        title: `Urlaubsantrag von ${requestUser.firstName} ${requestUser.lastName}`,
        description: `${req.startDate} – ${req.endDate} (${req.days} Tage)`,
        href: "/vacation",
      });
    }
  }

  // 3. Status changes on own vacation requests (recently approved/rejected)
  const myRecentDecisions = vacationRequests.filter(
    (r) =>
      r.userId === user.id &&
      r.approvedAt &&
      (r.status === "genehmigt" || r.status === "abgelehnt")
  );
  for (const req of myRecentDecisions.slice(0, 3)) {
    const approver = allUsers.find((u) => u.id === req.approvedBy);
    notifications.push({
      id: `vac-status-${req.id}`,
      type: "vacation-status",
      title: `Urlaub ${req.status === "genehmigt" ? "genehmigt" : "abgelehnt"}`,
      description: `${req.startDate} – ${req.endDate}${approver ? ` von ${approver.firstName} ${approver.lastName}` : ""}`,
      href: "/vacation",
    });
  }

  const totalCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0) + pendingApprovals.length;

  const iconForType = (type: Notification["type"]) => {
    switch (type) {
      case "chat":
        return <MessageSquare className="h-4 w-4 text-[var(--color-primary-600)]" />;
      case "vacation-approval":
        return <Palmtree className="h-4 w-4 text-amber-500" />;
      case "vacation-status":
        return <Palmtree className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors"
        title="Benachrichtigungen"
      >
        <Bell className="h-5 w-5 text-[var(--color-text-secondary)]" />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-12 w-80 sm:w-96 bg-white rounded-xl border border-[var(--color-border)] shadow-xl z-[200] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              Benachrichtigungen
              {totalCount > 0 && (
                <span className="ml-2 text-xs font-medium text-[var(--color-primary-600)]">
                  {totalCount} neu
                </span>
              )}
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-[var(--color-surface-tertiary)]"
            >
              <X className="h-4 w-4 text-[var(--color-text-muted)]" />
            </button>
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-[var(--color-text-muted)] mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[var(--color-text-muted)]">
                  Keine neuen Benachrichtigungen
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(n.href);
                  }}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[var(--color-surface-tertiary)] transition-colors text-left border-b border-[var(--color-border)] last:border-b-0"
                >
                  <div className="mt-0.5 h-8 w-8 rounded-lg bg-[var(--color-surface-tertiary)] flex items-center justify-center flex-shrink-0">
                    {iconForType(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                      {n.description}
                    </p>
                  </div>
                  {n.time && (
                    <span className="text-[10px] text-[var(--color-text-muted)] flex-shrink-0 mt-0.5">
                      {n.time}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
