"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { UserRole, USER_ROLES } from "@/types";
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Search,
  Crown,
  PenTool,
  User as UserIcon,
  UserPlus,
  Trash2,
  X,
  Mail,
  Palmtree,
} from "lucide-react";
import {
  sanitizeAndLimit,
  sanitizeString,
  isValidEmail,
  isValidPhone,
} from "@/lib/sanitize";

const roleConfig: Record<
  UserRole,
  { label: string; icon: typeof Crown; color: string; bg: string; description: string }
> = {
  admin: {
    label: "Administrator",
    icon: Crown,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    description: "Voller Zugriff — Nutzerverwaltung, Einstellungen, alle Schreibrechte",
  },
  autor: {
    label: "Autor",
    icon: PenTool,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    description: "Schreibrechte — Kann News erstellen und Inhalte bearbeiten",
  },
  benutzer: {
    label: "Benutzer",
    icon: UserIcon,
    color: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
    description: "Leserechte — Kann eigene Daten bearbeiten, Urlaub beantragen",
  },
};

const EMPTY_INVITE = {
  firstName: "",
  lastName: "",
  email: "",
  position: "",
  department: "",
  phone: "",
  role: "benutzer" as UserRole,
};

export default function AdminPage() {
  const {
    user,
    allUsers,
    departments,
    hasRole,
    updateUserRole,
    toggleUserActive,
    addUser,
    removeUser,
    moveUserToDepartment,
    getVacationBalance,
    updateUserVacationDays,
  } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "alle">("alle");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState(EMPTY_INVITE);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    action: "role" | "toggle" | "remove";
    newRole?: UserRole;
  } | null>(null);

  if (!user || !hasRole("admin")) {
    router.push("/dashboard");
    return null;
  }

  const sanitizedSearch = sanitizeAndLimit(searchQuery, 100).toLowerCase();
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      !sanitizedSearch ||
      u.firstName.toLowerCase().includes(sanitizedSearch) ||
      u.lastName.toLowerCase().includes(sanitizedSearch) ||
      u.email.toLowerCase().includes(sanitizedSearch) ||
      u.department.toLowerCase().includes(sanitizedSearch);
    const matchesRole = roleFilter === "alle" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: allUsers.length,
    active: allUsers.filter((u) => u.isActive).length,
    admins: allUsers.filter((u) => u.role === "admin").length,
    autoren: allUsers.filter((u) => u.role === "autor").length,
    benutzer: allUsers.filter((u) => u.role === "benutzer").length,
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    if (!USER_ROLES.includes(newRole as UserRole)) return;
    if (userId === user.id) return;
    setConfirmAction({ userId, action: "role", newRole: newRole as UserRole });
  };

  const handleToggleActive = (userId: string) => {
    if (userId === user.id) return;
    setConfirmAction({ userId, action: "toggle" });
  };

  const handleRemoveUser = (userId: string) => {
    if (userId === user.id) return;
    setConfirmAction({ userId, action: "remove" });
  };

  const executeAction = () => {
    if (!confirmAction) return;
    if (confirmAction.action === "role" && confirmAction.newRole) {
      updateUserRole(confirmAction.userId, confirmAction.newRole);
    } else if (confirmAction.action === "toggle") {
      toggleUserActive(confirmAction.userId);
    } else if (confirmAction.action === "remove") {
      removeUser(confirmAction.userId);
    }
    setConfirmAction(null);
  };

  const isMockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");

    const cleaned = {
      firstName: sanitizeAndLimit(inviteData.firstName, 100),
      lastName: sanitizeAndLimit(inviteData.lastName, 100),
      email: sanitizeString(inviteData.email).toLowerCase(),
      position: sanitizeAndLimit(inviteData.position, 100),
      department: sanitizeAndLimit(inviteData.department, 100),
      phone: sanitizeAndLimit(inviteData.phone, 30),
      role: inviteData.role,
    };

    if (!cleaned.firstName || !cleaned.lastName) {
      setInviteError("Vor- und Nachname sind Pflichtfelder.");
      return;
    }
    if (!isValidEmail(cleaned.email)) {
      setInviteError("Bitte eine gültige E-Mail-Adresse eingeben.");
      return;
    }
    if (!cleaned.position || !cleaned.department) {
      setInviteError("Position und Abteilung sind Pflichtfelder.");
      return;
    }
    if (cleaned.phone && !isValidPhone(cleaned.phone)) {
      setInviteError("Bitte eine gültige Telefonnummer eingeben.");
      return;
    }
    if (!USER_ROLES.includes(cleaned.role)) {
      setInviteError("Ungültige Rolle.");
      return;
    }

    if (isMockAuth) {
      // Mock mode: in-memory only
      const result = addUser({
        ...cleaned,
        street: "",
        city: "",
        zipCode: "",
        country: "Deutschland",
        birthDate: "",
        startDate: new Date().toISOString().split("T")[0],
      });

      if (result.success) {
        setInviteSuccess(`${cleaned.firstName} ${cleaned.lastName} wurde erfolgreich eingeladen.`);
        setInviteData(EMPTY_INVITE);
        setTimeout(() => {
          setInviteSuccess("");
          setShowInviteForm(false);
        }, 2000);
      } else {
        setInviteError(result.error || "Fehler beim Anlegen des Nutzers.");
      }
    } else {
      // Production mode: call invite API → creates user in DB + sends email
      setInviteLoading(true);
      try {
        const res = await fetch("/api/auth/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleaned),
        });

        const data = await res.json();

        if (data.success) {
          // Also add to local state for immediate UI update
          addUser({
            ...cleaned,
            street: "",
            city: "",
            zipCode: "",
            country: "Deutschland",
            birthDate: "",
            startDate: new Date().toISOString().split("T")[0],
          });
          setInviteSuccess(`Einladung an ${cleaned.email} gesendet.`);
          setInviteData(EMPTY_INVITE);
          setTimeout(() => {
            setInviteSuccess("");
            setShowInviteForm(false);
          }, 3000);
        } else {
          setInviteError(data.error || "Fehler beim Einladen des Nutzers.");
        }
      } catch {
        setInviteError("Verbindungsfehler. Bitte versuche es erneut.");
      } finally {
        setInviteLoading(false);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Shield className="h-7 w-7 text-[var(--color-primary-600)]" />
            Administration
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Nutzerverwaltung — Rollen und Zugriffsrechte verwalten
          </p>
        </div>
        <button
          onClick={() => setShowInviteForm(true)}
          className="flex items-center gap-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Nutzer einladen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.total}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Gesamt</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Aktiv</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.admins}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Admins</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.autoren}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Autoren</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{stats.benutzer}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Benutzer</p>
        </div>
      </div>

      {/* Role overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(Object.entries(roleConfig) as [UserRole, typeof roleConfig.admin][]).map(
          ([role, config]) => {
            const Icon = config.icon;
            return (
              <div key={role} className={`rounded-xl border p-4 ${config.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <h3 className={`text-sm font-semibold ${config.color}`}>{config.label}</h3>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">{config.description}</p>
              </div>
            );
          }
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name, E-Mail oder Abteilung suchen..."
            maxLength={100}
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "alle" || USER_ROLES.includes(val as UserRole)) {
              setRoleFilter(val as UserRole | "alle");
            }
          }}
          className="px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
        >
          <option value="alle">Alle Rollen</option>
          <option value="admin">Administratoren</option>
          <option value="autor">Autoren</option>
          <option value="benutzer">Benutzer</option>
        </select>
      </div>

      {/* Users list */}
      <div className="bg-white rounded-xl border border-[var(--color-border)]">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--color-text-secondary)]" />
            Nutzer ({filteredUsers.length})
          </h2>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {filteredUsers.map((u) => {
            const config = roleConfig[u.role];
            const RoleIcon = config.icon;
            const isSelf = u.id === user.id;

            return (
              <div key={u.id} className="px-5 py-4 flex items-center gap-4">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                    u.isActive
                      ? "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {u.firstName[0]}
                  {u.lastName[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        u.isActive
                          ? "text-[var(--color-text-primary)]"
                          : "text-[var(--color-text-muted)] line-through"
                      }`}
                    >
                      {u.firstName} {u.lastName}
                    </span>
                    {isSelf && (
                      <span className="text-xs bg-[var(--color-primary-50)] text-[var(--color-primary-700)] px-1.5 py-0.5 rounded font-medium">
                        Du
                      </span>
                    )}
                    {!u.isActive && (
                      <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">
                        Deaktiviert
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {u.email} &middot; {u.department} &middot; {u.position}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${config.bg} ${config.color}`}
                  >
                    <RoleIcon className="h-3.5 w-3.5" />
                    {config.label}
                  </div>

                  {!isSelf && (
                    <>
                      <select
                        value={u.department}
                        onChange={(e) => {
                          const dept = e.target.value;
                          const deptObj = departments.find((d) => d.name === dept);
                          moveUserToDepartment(u.id, dept, deptObj?.headId || undefined);
                        }}
                        className="px-2 py-1.5 border border-[var(--color-border)] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                        title="Abteilung zuweisen"
                      >
                        <option value="Ohne Abteilung">Ohne Abteilung</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1" title={`Urlaubstage: ${getVacationBalance(u.id).remaining} Rest von ${u.totalVacationDays ?? 30}`}>
                        <Palmtree className="h-3.5 w-3.5 text-emerald-500" />
                        <input
                          type="number"
                          min={0}
                          max={365}
                          value={u.totalVacationDays ?? 30}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) updateUserVacationDays(u.id, val);
                          }}
                          className="w-14 px-1.5 py-1.5 border border-[var(--color-border)] rounded-lg text-xs bg-white text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                          title="Jahresurlaub anpassen"
                        />
                      </div>

                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2 py-1.5 border border-[var(--color-border)] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                      >
                        <option value="admin">Admin</option>
                        <option value="autor">Autor</option>
                        <option value="benutzer">Benutzer</option>
                      </select>

                      <button
                        onClick={() => handleToggleActive(u.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.isActive
                            ? "text-amber-500 hover:bg-amber-50"
                            : "text-green-500 hover:bg-green-50"
                        }`}
                        title={u.isActive ? "Sperren" : "Entsperren"}
                      >
                        {u.isActive ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleRemoveUser(u.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Endgültig entfernen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="px-5 py-12 text-center text-[var(--color-text-muted)]">
              Keine Nutzer gefunden.
            </div>
          )}
        </div>
      </div>

      {/* Invite modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-50)] flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-[var(--color-primary-600)]" />
                </div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Nutzer einladen
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteError("");
                  setInviteSuccess("");
                  setInviteData(EMPTY_INVITE);
                }}
                className="h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center"
              >
                <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              {inviteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
                  {inviteSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={inviteData.firstName}
                    onChange={(e) => setInviteData({ ...inviteData, firstName: e.target.value })}
                    maxLength={100}
                    className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={inviteData.lastName}
                    onChange={(e) => setInviteData({ ...inviteData, lastName: e.target.value })}
                    maxLength={100}
                    className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  E-Mail-Adresse *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    placeholder="name@hellbeck.de"
                    maxLength={254}
                    className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                    Position *
                  </label>
                  <input
                    type="text"
                    value={inviteData.position}
                    onChange={(e) => setInviteData({ ...inviteData, position: e.target.value })}
                    maxLength={100}
                    className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                    Abteilung *
                  </label>
                  <input
                    type="text"
                    value={inviteData.department}
                    onChange={(e) => setInviteData({ ...inviteData, department: e.target.value })}
                    maxLength={100}
                    className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Telefon (optional)
                </label>
                <input
                  type="tel"
                  value={inviteData.phone}
                  onChange={(e) => setInviteData({ ...inviteData, phone: e.target.value })}
                  placeholder="+49 170 1234567"
                  maxLength={30}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Rolle
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (USER_ROLES.includes(val as UserRole)) {
                      setInviteData({ ...inviteData, role: val as UserRole });
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="benutzer">Benutzer</option>
                  <option value="autor">Autor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteError("");
                    setInviteSuccess("");
                    setInviteData(EMPTY_INVITE);
                  }}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {inviteLoading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Einladen
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  confirmAction.action === "remove"
                    ? "bg-red-100"
                    : "bg-amber-100"
                }`}
              >
                {confirmAction.action === "remove" ? (
                  <Trash2 className="h-5 w-5 text-red-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                {confirmAction.action === "remove"
                  ? "Nutzer entfernen"
                  : "Änderung bestätigen"}
              </h2>
            </div>

            {(() => {
              const targetUser = allUsers.find((u) => u.id === confirmAction.userId);
              if (!targetUser) return null;

              if (confirmAction.action === "remove") {
                return (
                  <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                    Möchtest du{" "}
                    <span className="font-semibold">
                      {targetUser.firstName} {targetUser.lastName}
                    </span>{" "}
                    ({targetUser.email}) <strong>endgültig entfernen</strong>?
                    Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                );
              }
              if (confirmAction.action === "role" && confirmAction.newRole) {
                return (
                  <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                    Möchtest du die Rolle von{" "}
                    <span className="font-semibold">
                      {targetUser.firstName} {targetUser.lastName}
                    </span>{" "}
                    von{" "}
                    <span className="font-semibold">
                      {roleConfig[targetUser.role].label}
                    </span>{" "}
                    zu{" "}
                    <span className="font-semibold">
                      {roleConfig[confirmAction.newRole].label}
                    </span>{" "}
                    ändern?
                  </p>
                );
              }
              return (
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                  Möchtest du{" "}
                  <span className="font-semibold">
                    {targetUser.firstName} {targetUser.lastName}
                  </span>{" "}
                  {targetUser.isActive ? "sperren" : "wieder entsperren"}?
                  {targetUser.isActive &&
                    " Der Nutzer kann sich danach nicht mehr anmelden."}
                </p>
              );
            })()}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={executeAction}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  confirmAction.action === "remove"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white"
                }`}
              >
                {confirmAction.action === "remove" ? (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Entfernen
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Bestätigen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
