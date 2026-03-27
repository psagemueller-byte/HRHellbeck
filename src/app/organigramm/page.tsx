"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { User, Department } from "@/types";
import { sanitizeAndLimit } from "@/lib/sanitize";
import {
  Network,
  Crown,
  Users,
  ChevronDown,
  Building2,
  Plus,
  X,
  Pencil,
  Trash2,
  GripVertical,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { useState, DragEvent } from "react";

const DEPT_COLORS = [
  { label: "Lila", value: "bg-purple-100 text-purple-700 border-purple-200" },
  { label: "Pink", value: "bg-pink-100 text-pink-700 border-pink-200" },
  { label: "Blau", value: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Grün", value: "bg-green-100 text-green-700 border-green-200" },
  { label: "Gelb", value: "bg-amber-100 text-amber-700 border-amber-200" },
  { label: "Rot", value: "bg-red-100 text-red-700 border-red-200" },
  { label: "Cyan", value: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { label: "Orange", value: "bg-orange-100 text-orange-700 border-orange-200" },
];

function UserCard({ u, isHead, subordinates, onDragStart }: {
  u: User; isHead: boolean; subordinates: User[];
  onDragStart: (e: DragEvent, userId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col items-center">
      <div
        draggable
        onDragStart={(e) => onDragStart(e, u.id)}
        className={`relative bg-white rounded-xl border-2 p-4 w-56 text-center transition-all cursor-grab active:cursor-grabbing ${
          isHead
            ? "border-[var(--color-primary-400)] shadow-md shadow-[var(--color-primary-100)]"
            : "border-[var(--color-border)] hover:border-[var(--color-primary-200)]"
        }`}
      >
        <div className="absolute top-2 left-2 text-[var(--color-text-muted)] opacity-40">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
        {isHead && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary-600)] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Leitung
          </div>
        )}
        <div className={`h-12 w-12 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold overflow-hidden ${
          isHead ? "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]" : "bg-gray-100 text-gray-600"
        }`}>
          {u.avatar ? (
            <img src={u.avatar} alt={`${u.firstName} ${u.lastName}`} className="h-full w-full object-cover" />
          ) : (
            <>{u.firstName[0]}{u.lastName[0]}</>
          )}
        </div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{u.firstName} {u.lastName}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{u.position}</p>

        {subordinates.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 bg-white border border-[var(--color-border)] rounded-full flex items-center justify-center hover:bg-gray-50"
          >
            <ChevronDown className={`h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {expanded && subordinates.length > 0 && (
        <div className="mt-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-[var(--color-border)]" />
          {subordinates.length === 1 ? (
            <div className="pt-4">
              <div className="w-px h-2 bg-[var(--color-border)] mx-auto" />
              <UserCard u={subordinates[0]} isHead={false} subordinates={[]} onDragStart={onDragStart} />
            </div>
          ) : (
            <div className="pt-4">
              <div className="relative flex justify-center gap-6">
                <div className="absolute top-0 h-px bg-[var(--color-border)]"
                  style={{ left: `calc(${100 / (subordinates.length * 2)}%)`, right: `calc(${100 / (subordinates.length * 2)}%)` }}
                />
                {subordinates.map((sub) => (
                  <div key={sub.id} className="flex flex-col items-center">
                    <div className="w-px h-4 bg-[var(--color-border)]" />
                    <UserCard u={sub} isHead={false} subordinates={[]} onDragStart={onDragStart} />
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
  const {
    user, allUsers, departments, hasRole,
    addDepartment, updateDepartment, deleteDepartment, moveUserToDepartment,
  } = useAuth();
  const router = useRouter();

  const [showAddDept, setShowAddDept] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptColor, setNewDeptColor] = useState(DEPT_COLORS[0].value);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editHeadId, setEditHeadId] = useState("");
  const [deptError, setDeptError] = useState("");
  const [dragOverDept, setDragOverDept] = useState<string | null>(null);
  const [dragUserId, setDragUserId] = useState<string | null>(null);

  if (!user || !hasRole("admin")) {
    router.push("/dashboard");
    return null;
  }

  const deptTree = departments.map((dept) => {
    const head = dept.headId ? allUsers.find((u) => u.id === dept.headId) : undefined;
    const members = allUsers.filter(
      (u) => u.department === dept.name && u.id !== dept.headId && u.isActive
    );
    return { dept, head, members };
  });

  const unassignedUsers = allUsers.filter(
    (u) => u.isActive && (
      u.department === "Ohne Abteilung" ||
      !departments.some((d) => d.name === u.department)
    )
  );

  const totalDepts = departments.length;
  const totalHeads = deptTree.filter((d) => d.head).length;
  const totalMembers = allUsers.filter((u) => u.isActive).length;

  // --- Drag & Drop ---
  const handleDragStart = (e: DragEvent, userId: string) => {
    e.dataTransfer.setData("text/plain", userId);
    setDragUserId(userId);
  };

  const handleDragOver = (e: DragEvent, deptName: string) => {
    e.preventDefault();
    setDragOverDept(deptName);
  };

  const handleDragLeave = () => {
    setDragOverDept(null);
  };

  const handleDrop = (e: DragEvent, dept: Department) => {
    e.preventDefault();
    const userId = e.dataTransfer.getData("text/plain");
    if (!userId) return;
    const headId = dept.headId || undefined;
    moveUserToDepartment(userId, dept.name, headId);
    setDragOverDept(null);
    setDragUserId(null);
  };

  const handleDropUnassigned = (e: DragEvent) => {
    e.preventDefault();
    const userId = e.dataTransfer.getData("text/plain");
    if (!userId) return;
    moveUserToDepartment(userId, "Ohne Abteilung", undefined);
    setDragOverDept(null);
    setDragUserId(null);
  };

  // --- Add Department ---
  const handleAddDept = async () => {
    setDeptError("");
    const result = await addDepartment(newDeptName, newDeptColor);
    if (!result.success) {
      setDeptError(result.error || "Fehler beim Erstellen.");
      return;
    }
    setNewDeptName("");
    setNewDeptColor(DEPT_COLORS[0].value);
    setShowAddDept(false);
  };

  // --- Edit Department ---
  const openEditDept = (dept: Department) => {
    setEditDept(dept);
    setEditName(dept.name);
    setEditColor(dept.color);
    setEditHeadId(dept.headId);
    setDeptError("");
  };

  const handleEditDept = () => {
    if (!editDept) return;
    setDeptError("");
    const cleanName = sanitizeAndLimit(editName, 50);
    if (!cleanName) {
      setDeptError("Bitte einen Namen eingeben.");
      return;
    }
    // Check name uniqueness (except current)
    const duplicate = departments.some(
      (d) => d.id !== editDept.id && d.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      setDeptError("Dieser Name ist bereits vergeben.");
      return;
    }

    // If name changed, update all users in this department
    if (cleanName !== editDept.name) {
      allUsers.forEach((u) => {
        if (u.department === editDept.name) {
          moveUserToDepartment(u.id, cleanName, u.managerId);
        }
      });
    }

    updateDepartment(editDept.id, {
      name: cleanName,
      headId: editHeadId,
      color: editColor,
    });
    setEditDept(null);
  };

  // Department members for head selection
  const deptMembersForEdit = editDept
    ? allUsers.filter((u) => u.department === editDept.name && u.isActive)
    : [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <p className="text-[12px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.6px] mb-1">
            Unternehmensstruktur
          </p>
          <h1 className="text-[28px] sm:text-[36px] md:text-2xl font-extrabold text-[var(--color-text-primary)] tracking-[-0.9px] flex items-center gap-3">
            <Network className="h-6 w-6 md:h-7 md:w-7 text-[var(--color-primary-600)] hidden md:block" />
            Organigramm
          </h1>
          <p className="text-sm md:text-base text-[var(--color-text-secondary)] mt-1 hidden md:block">
            Abteilungen verwalten und Mitarbeiter per Drag & Drop zuordnen
          </p>
        </div>
        <button
          onClick={() => { setShowAddDept(true); setDeptError(""); setNewDeptName(""); }}
          className="flex items-center gap-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Abteilung erstellen</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>

      {/* Mobile: Search */}
      <div className="md:hidden mb-6 relative">
        <div className="bg-[var(--color-surface-dim)] rounded-lg flex items-center px-4 py-3.5">
          <Network className="h-4.5 w-4.5 text-[var(--color-text-body)] opacity-50 mr-3" />
          <span className="text-base text-[var(--color-text-body)] opacity-50">Mitarbeiter oder Abteilung suchen...</span>
        </div>
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

      {/* Org chart visual */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 mb-8 overflow-x-auto">
        <div className="flex flex-col items-center min-w-fit">
          <div className="bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-800)] text-white rounded-xl p-5 w-64 text-center shadow-lg">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-90" />
            <p className="text-base font-bold">Hellbeck GmbH</p>
            <p className="text-xs opacity-80 mt-1">Geschäftsführung</p>
          </div>
          <div className="w-px h-8 bg-[var(--color-border)]" />

          {deptTree.length > 0 ? (
            <div className="relative">
              {deptTree.length > 1 && (
                <div className="absolute top-0 h-px bg-[var(--color-border)]"
                  style={{ left: `calc(${100 / (deptTree.length * 2)}%)`, right: `calc(${100 / (deptTree.length * 2)}%)` }}
                />
              )}
              <div className="flex gap-10">
                {deptTree.map(({ dept, head, members }) => (
                  <div
                    key={dept.id}
                    className={`flex flex-col items-center transition-all ${
                      dragOverDept === dept.name ? "scale-[1.02]" : ""
                    }`}
                    onDragOver={(e) => handleDragOver(e, dept.name)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dept)}
                  >
                    <div className="w-px h-6 bg-[var(--color-border)]" />

                    {/* Department badge with edit buttons */}
                    <div className={`relative rounded-full px-4 py-1.5 text-xs font-bold border mb-4 transition-all ${dept.color} ${
                      dragOverDept === dept.name ? "ring-2 ring-[var(--color-primary-400)] ring-offset-2" : ""
                    }`}>
                      <Users className="h-3 w-3 inline mr-1.5" />
                      {dept.name}
                      <div className="absolute -top-2 -right-2 flex gap-0.5">
                        <button
                          onClick={() => openEditDept(dept)}
                          className="h-5 w-5 bg-white border border-[var(--color-border)] rounded-full flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          title="Bearbeiten"
                        >
                          <Pencil className="h-2.5 w-2.5 text-[var(--color-text-muted)]" />
                        </button>
                        <button
                          onClick={() => setDeleteDept(dept)}
                          className="h-5 w-5 bg-white border border-[var(--color-border)] rounded-full flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="h-2.5 w-2.5 text-[var(--color-text-muted)]" />
                        </button>
                      </div>
                    </div>

                    {head ? (
                      <UserCard u={head} isHead={true} subordinates={members} onDragStart={handleDragStart} />
                    ) : members.length > 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-amber-50 border border-dashed border-amber-300 rounded-xl p-3 w-56 text-center">
                          <p className="text-xs text-amber-600">Kein Leiter zugewiesen</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                          {members.map((m) => (
                            <UserCard key={m.id} u={m} isHead={false} subordinates={[]} onDragStart={handleDragStart} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={`border-2 border-dashed rounded-xl p-6 w-56 text-center transition-all ${
                        dragOverDept === dept.name ? "border-[var(--color-primary-400)] bg-[var(--color-primary-50)]" : "border-gray-200"
                      }`}>
                        <UserPlus className="h-6 w-6 text-[var(--color-text-muted)] mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-[var(--color-text-muted)]">Mitarbeiter hierher ziehen</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--color-text-muted)]">Noch keine Abteilungen angelegt.</p>
            </div>
          )}
        </div>
      </div>

      {/* Unassigned users */}
      {unassignedUsers.length > 0 && (
        <div
          className={`bg-white rounded-xl border-2 border-dashed p-5 mb-8 transition-all ${
            dragOverDept === "__unassigned" ? "border-amber-400 bg-amber-50" : "border-[var(--color-border)]"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOverDept("__unassigned"); }}
          onDragLeave={handleDragLeave}
          onDrop={handleDropUnassigned}
        >
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" />
            Ohne Abteilung ({unassignedUsers.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {unassignedUsers.map((u) => (
              <div
                key={u.id}
                draggable
                onDragStart={(e) => handleDragStart(e, u.id)}
                className="inline-flex items-center gap-2 bg-[var(--color-surface-tertiary)] px-3 py-2 rounded-lg text-xs cursor-grab active:cursor-grabbing hover:bg-gray-200 transition-colors"
              >
                <GripVertical className="h-3 w-3 text-[var(--color-text-muted)] opacity-50" />
                <span className="h-6 w-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)] overflow-hidden">
                  {u.avatar ? (
                    <img src={u.avatar} alt={`${u.firstName} ${u.lastName}`} className="h-full w-full object-cover" />
                  ) : (
                    <>{u.firstName[0]}{u.lastName[0]}</>
                  )}
                </span>
                <span className="text-[var(--color-text-primary)] font-medium">{u.firstName} {u.lastName}</span>
                <ArrowRight className="h-3 w-3 text-[var(--color-text-muted)]" />
              </div>
            ))}
          </div>
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  {head && (
                    <div className="flex items-center gap-2 text-xs">
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-medium text-[var(--color-text-primary)]">{head.firstName} {head.lastName}</span>
                    </div>
                  )}
                  <button onClick={() => openEditDept(dept)}
                    className="text-xs text-[var(--color-primary-600)] hover:underline">
                    Bearbeiten
                  </button>
                </div>
              </div>
              {members.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-1">
                  {members.map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1.5 bg-[var(--color-surface-tertiary)] px-2.5 py-1 rounded-lg text-xs">
                      <span className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)] overflow-hidden">
                        {m.avatar ? (
                          <img src={m.avatar} alt={`${m.firstName} ${m.lastName}`} className="h-full w-full object-cover" />
                        ) : (
                          <>{m.firstName[0]}{m.lastName[0]}</>
                        )}
                      </span>
                      <span className="text-[var(--color-text-primary)] font-medium">{m.firstName} {m.lastName}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Department Modal */}
      {showAddDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Neue Abteilung</h2>
              <button onClick={() => setShowAddDept(false)} className="h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center">
                <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            <div className="space-y-4">
              {deptError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{deptError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Name *</label>
                <input type="text" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="z.B. Design, Finanzen..." maxLength={50}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Farbe</label>
                <div className="flex flex-wrap gap-2">
                  {DEPT_COLORS.map((c) => (
                    <button key={c.value} onClick={() => setNewDeptColor(c.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${c.value} ${
                        newDeptColor === c.value ? "ring-2 ring-[var(--color-primary-400)] ring-offset-1" : ""
                      }`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddDept(false)}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
                  Abbrechen
                </button>
                <button onClick={handleAddDept}
                  className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-medium transition-colors">
                  Erstellen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Abteilung bearbeiten</h2>
              <button onClick={() => setEditDept(null)} className="h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center">
                <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            <div className="space-y-4">
              {deptError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{deptError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={50}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Abteilungsleiter</label>
                <select value={editHeadId} onChange={(e) => setEditHeadId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
                  <option value="">— Kein Leiter —</option>
                  {deptMembersForEdit.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.position}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Farbe</label>
                <div className="flex flex-wrap gap-2">
                  {DEPT_COLORS.map((c) => (
                    <button key={c.value} onClick={() => setEditColor(c.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${c.value} ${
                        editColor === c.value ? "ring-2 ring-[var(--color-primary-400)] ring-offset-1" : ""
                      }`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditDept(null)}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
                  Abbrechen
                </button>
                <button onClick={handleEditDept}
                  className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-medium transition-colors">
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Department Confirm */}
      {deleteDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2">
              &ldquo;{deleteDept.name}&rdquo; löschen?
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              Alle Mitarbeiter dieser Abteilung werden in &ldquo;Ohne Abteilung&rdquo; verschoben.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteDept(null)}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
                Abbrechen
              </button>
              <button onClick={() => { deleteDepartment(deleteDept.id); setDeleteDept(null); }}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
