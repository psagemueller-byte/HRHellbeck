"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import {
  Network,
  Crown,
  Users,
  ChevronDown,
  Building2,
} from "lucide-react";
import { useState } from "react";

function UserCard({ u, isHead, subordinates }: { u: User; isHead: boolean; subordinates: User[] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col items-center">
      {/* User node */}
      <div
        className={`relative bg-white rounded-xl border-2 p-4 w-56 text-center transition-all ${
          isHead
            ? "border-[var(--color-primary-400)] shadow-md shadow-[var(--color-primary-100)]"
            : "border-[var(--color-border)]"
        }`}
      >
        {isHead && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary-600)] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Leitung
          </div>
        )}
        <div
          className={`h-12 w-12 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold ${
            isHead
              ? "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {u.firstName[0]}{u.lastName[0]}
        </div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          {u.firstName} {u.lastName}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {u.position}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">{u.email}</p>

        {subordinates.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 bg-white border border-[var(--color-border)] rounded-full flex items-center justify-center hover:bg-gray-50"
          >
            <ChevronDown className={`h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Subordinates */}
      {expanded && subordinates.length > 0 && (
        <div className="mt-6 relative">
          {/* Vertical line from parent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-[var(--color-border)]" />

          {subordinates.length === 1 ? (
            <div className="pt-4">
              <div className="w-px h-2 bg-[var(--color-border)] mx-auto" />
              <UserCard u={subordinates[0]} isHead={false} subordinates={[]} />
            </div>
          ) : (
            <div className="pt-4">
              {/* Horizontal connector */}
              <div className="relative flex justify-center gap-8">
                <div
                  className="absolute top-0 h-px bg-[var(--color-border)]"
                  style={{
                    left: `calc(${100 / (subordinates.length * 2)}%)`,
                    right: `calc(${100 / (subordinates.length * 2)}%)`,
                  }}
                />
                {subordinates.map((sub) => (
                  <div key={sub.id} className="flex flex-col items-center">
                    <div className="w-px h-4 bg-[var(--color-border)]" />
                    <UserCard u={sub} isHead={false} subordinates={[]} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrganigrammPage() {
  const { user, allUsers, departments, hasRole } = useAuth();
  const router = useRouter();

  if (!user || !hasRole("admin")) {
    router.push("/dashboard");
    return null;
  }

  // Build org tree per department
  const deptTree = departments.map((dept) => {
    const head = allUsers.find((u) => u.id === dept.headId);
    const members = allUsers.filter(
      (u) => u.department === dept.name && u.id !== dept.headId && u.isActive
    );
    return { dept, head, members };
  });

  const totalDepts = departments.length;
  const totalHeads = deptTree.filter((d) => d.head).length;
  const totalMembers = allUsers.filter((u) => u.isActive).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
          <Network className="h-7 w-7 text-[var(--color-primary-600)]" />
          Organigramm
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Unternehmensstruktur mit Abteilungen und Vorgesetzten
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-primary-600)]">{totalDepts}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Abteilungen</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{totalHeads}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Abteilungsleiter</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{totalMembers}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Aktive Mitarbeiter</p>
        </div>
      </div>

      {/* Company-level org chart */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 mb-8 overflow-x-auto">
        <div className="flex flex-col items-center min-w-fit">
          {/* CEO / Admin node */}
          <div className="bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-800)] text-white rounded-xl p-5 w-64 text-center shadow-lg">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-90" />
            <p className="text-base font-bold">Hellbeck GmbH</p>
            <p className="text-xs opacity-80 mt-1">Geschäftsführung</p>
          </div>

          {/* Line down */}
          <div className="w-px h-8 bg-[var(--color-border)]" />

          {/* Departments */}
          <div className="relative">
            {/* Horizontal connector line */}
            <div
              className="absolute top-0 h-px bg-[var(--color-border)]"
              style={{
                left: `calc(${100 / (deptTree.length * 2)}%)`,
                right: `calc(${100 / (deptTree.length * 2)}%)`,
              }}
            />

            <div className="flex gap-10">
              {deptTree.map(({ dept, head, members }) => (
                <div key={dept.id} className="flex flex-col items-center">
                  {/* Vertical line down to department */}
                  <div className="w-px h-6 bg-[var(--color-border)]" />

                  {/* Department badge */}
                  <div className={`rounded-full px-4 py-1.5 text-xs font-bold border mb-4 ${dept.color}`}>
                    <Users className="h-3 w-3 inline mr-1.5" />
                    {dept.name}
                  </div>

                  {/* Head + members tree */}
                  {head ? (
                    <UserCard u={head} isHead={true} subordinates={members} />
                  ) : (
                    <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-4 w-56 text-center">
                      <p className="text-sm text-[var(--color-text-muted)]">Kein Leiter zugewiesen</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Department details table */}
      <div className="bg-white rounded-xl border border-[var(--color-border)]">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--color-text-secondary)]" />
            Abteilungsübersicht
          </h2>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {deptTree.map(({ dept, head, members }) => (
            <div key={dept.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${dept.color}`}>
                    {dept.name}
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {(head ? 1 : 0) + members.length} Mitarbeiter
                  </span>
                </div>
                {head && (
                  <div className="flex items-center gap-2 text-xs">
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {head.firstName} {head.lastName}
                    </span>
                    <span className="text-[var(--color-text-muted)]">— Abteilungsleiter</span>
                  </div>
                )}
              </div>
              {members.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-1">
                  {members.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1.5 bg-[var(--color-surface-tertiary)] px-2.5 py-1 rounded-lg text-xs"
                    >
                      <span className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)]">
                        {m.firstName[0]}{m.lastName[0]}
                      </span>
                      <span className="text-[var(--color-text-primary)] font-medium">
                        {m.firstName} {m.lastName}
                      </span>
                      <span className="text-[var(--color-text-muted)]">— {m.position}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
