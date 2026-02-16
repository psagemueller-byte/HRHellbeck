"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ClipboardList,
  Plus,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Sunset,
  Briefcase,
  Thermometer,
} from "lucide-react";
import { ShiftType, SHIFT_TYPES } from "@/types";
import { sanitizeAndLimit } from "@/lib/sanitize";

const shiftTypeLabels: Record<ShiftType, { label: string; icon: typeof Sun; color: string }> = {
  frueh: { label: "Frühschicht", icon: Sun, color: "text-amber-600" },
  spaet: { label: "Spätschicht", icon: Sunset, color: "text-orange-600" },
  nacht: { label: "Nachtschicht", icon: Moon, color: "text-indigo-600" },
  frei: { label: "Frei", icon: Sun, color: "text-gray-400" },
  feiertag: { label: "Feiertag", icon: Sun, color: "text-red-500" },
  urlaub: { label: "Urlaub", icon: Sun, color: "text-green-500" },
  sonderurlaub: { label: "Sonderurlaub", icon: Briefcase, color: "text-teal-500" },
  krank: { label: "Krank", icon: Thermometer, color: "text-pink-500" },
};

export default function UebergabePage() {
  const { user, allUsers, handoverProtocols, addHandover, getHandoversForUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    shiftDate: new Date().toISOString().split("T")[0],
    shiftType: "frueh" as ShiftType,
    machineStatus: "",
    openTasks: "",
    incidents: "",
    notes: "",
  });

  const myProtocols = user ? getHandoversForUser(user.id) : [];

  // Managers also see their team's protocols
  const teamProtocols = user
    ? handoverProtocols
        .filter((h) => {
          if (h.authorId === user.id) return false;
          const author = allUsers.find((u) => u.id === h.authorId);
          if (!author) return false;
          return author.managerId === user.id || user.role === "admin";
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const handleSubmit = () => {
    setFormError("");

    const cleaned = {
      shiftDate: formData.shiftDate,
      shiftType: formData.shiftType,
      machineStatus: sanitizeAndLimit(formData.machineStatus, 1000),
      openTasks: sanitizeAndLimit(formData.openTasks, 1000),
      incidents: sanitizeAndLimit(formData.incidents, 1000),
      notes: sanitizeAndLimit(formData.notes, 1000),
    };

    if (!cleaned.shiftDate) {
      setFormError("Bitte ein Datum angeben.");
      return;
    }
    if (!SHIFT_TYPES.includes(cleaned.shiftType)) {
      setFormError("Ungültiger Schichttyp.");
      return;
    }
    if (!cleaned.machineStatus) {
      setFormError("Bitte den Maschinenstatus angeben.");
      return;
    }
    if (!cleaned.openTasks) {
      setFormError("Bitte offene Aufgaben angeben.");
      return;
    }

    addHandover({
      authorId: user!.id,
      ...cleaned,
    });

    setFormData({
      shiftDate: new Date().toISOString().split("T")[0],
      shiftType: "frueh",
      machineStatus: "",
      openTasks: "",
      incidents: "",
      notes: "",
    });
    setShowForm(false);
  };

  const getUserName = (id: string) => {
    const u = allUsers.find((usr) => usr.id === id);
    return u ? `${u.firstName} ${u.lastName}` : "Unbekannt";
  };

  const renderProtocol = (protocol: typeof myProtocols[0], showAuthor = false) => {
    const isExpanded = expandedId === protocol.id;
    const typeConfig = shiftTypeLabels[protocol.shiftType];
    const TypeIcon = typeConfig.icon;

    return (
      <div key={protocol.id} className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <button
          onClick={() => setExpandedId(isExpanded ? null : protocol.id)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-[var(--color-surface-tertiary)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg bg-[var(--color-primary-50)] flex items-center justify-center`}>
              <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {typeConfig.label} — {new Date(protocol.shiftDate).toLocaleDateString("de-DE", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(protocol.createdAt).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {showAuthor && ` — ${getUserName(protocol.authorId)}`}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-[var(--color-text-muted)]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[var(--color-text-muted)]" />
          )}
        </button>

        {isExpanded && (
          <div className="px-5 pb-5 border-t border-[var(--color-border)] pt-4">
            <div className="grid gap-4">
              <div>
                <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                  Maschinenstatus
                </h4>
                <p className="text-sm text-[var(--color-text-primary)] bg-[var(--color-surface-secondary)] rounded-lg p-3">
                  {protocol.machineStatus}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                  Offene Aufgaben
                </h4>
                <p className="text-sm text-[var(--color-text-primary)] bg-[var(--color-surface-secondary)] rounded-lg p-3">
                  {protocol.openTasks}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                  Vorkommnisse
                </h4>
                <p className="text-sm text-[var(--color-text-primary)] bg-[var(--color-surface-secondary)] rounded-lg p-3">
                  {protocol.incidents || "Keine besonderen Vorkommnisse."}
                </p>
              </div>
              {protocol.notes && (
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                    Anmerkungen
                  </h4>
                  <p className="text-sm text-[var(--color-text-primary)] bg-[var(--color-surface-secondary)] rounded-lg p-3">
                    {protocol.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-[var(--color-primary-600)]" />
            Schichtübergabe
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Übergabeprotokolle erstellen und einsehen
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Protokoll erstellen
        </button>
      </div>

      {/* My Protocols */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
          Meine Protokolle ({myProtocols.length})
        </h2>
        <div className="space-y-3">
          {myProtocols.map((p) => renderProtocol(p))}
          {myProtocols.length === 0 && (
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-12 text-center">
              <ClipboardList className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4" />
              <p className="text-[var(--color-text-muted)]">Noch keine Übergabeprotokolle erstellt.</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Protocols (for managers/admins) */}
      {teamProtocols.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
            Team-Protokolle ({teamProtocols.length})
          </h2>
          <div className="space-y-3">
            {teamProtocols.map((p) => renderProtocol(p, true))}
          </div>
        </div>
      )}

      {/* New Protocol Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-50)] flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-[var(--color-primary-600)]" />
                </div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Übergabeprotokoll</h2>
              </div>
              <button
                onClick={() => { setShowForm(false); setFormError(""); }}
                className="h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center"
              >
                <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Datum *</label>
                  <input
                    type="date"
                    value={formData.shiftDate}
                    onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Schichttyp *</label>
                  <select
                    value={formData.shiftType}
                    onChange={(e) => {
                      const val = e.target.value as ShiftType;
                      if (SHIFT_TYPES.includes(val)) {
                        setFormData({ ...formData, shiftType: val });
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  >
                    <option value="frueh">Frühschicht</option>
                    <option value="spaet">Spätschicht</option>
                    <option value="nacht">Nachtschicht</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Maschinenstatus *</label>
                <textarea
                  value={formData.machineStatus}
                  onChange={(e) => setFormData({ ...formData, machineStatus: e.target.value })}
                  maxLength={1000}
                  rows={3}
                  placeholder="Zustand der Maschinen, durchgeführte Wartungen, etc."
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Offene Aufgaben *</label>
                <textarea
                  value={formData.openTasks}
                  onChange={(e) => setFormData({ ...formData, openTasks: e.target.value })}
                  maxLength={1000}
                  rows={3}
                  placeholder="Was muss die nächste Schicht erledigen?"
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Vorkommnisse</label>
                <textarea
                  value={formData.incidents}
                  onChange={(e) => setFormData({ ...formData, incidents: e.target.value })}
                  maxLength={1000}
                  rows={2}
                  placeholder="Besondere Vorkommnisse während der Schicht"
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Anmerkungen</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  maxLength={1000}
                  rows={2}
                  placeholder="Weitere Anmerkungen für die nächste Schicht"
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowForm(false); setFormError(""); }}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ClipboardList className="h-4 w-4" />
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
