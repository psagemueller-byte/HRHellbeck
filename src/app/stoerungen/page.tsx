"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  AlertTriangle,
  Plus,
  X,
  Camera,
  Clock,
  CheckCircle2,
  Loader2,
  MapPin,
  User,
  Filter,
} from "lucide-react";
import { DisruptionCategory, DISRUPTION_CATEGORIES } from "@/types";
import { sanitizeAndLimit } from "@/lib/sanitize";

const categoryLabels: Record<DisruptionCategory, { label: string; color: string; bg: string }> = {
  maschinenstillstand: { label: "Maschinenstillstand", color: "text-red-700", bg: "bg-red-100 border-red-200" },
  materialfehler: { label: "Materialfehler", color: "text-orange-700", bg: "bg-orange-100 border-orange-200" },
  qualitaetsmangel: { label: "Qualitätsmangel", color: "text-amber-700", bg: "bg-amber-100 border-amber-200" },
  sicherheitsvorfall: { label: "Sicherheitsvorfall", color: "text-rose-700", bg: "bg-rose-100 border-rose-200" },
  "it-stoerung": { label: "IT-Störung", color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
  sonstiges: { label: "Sonstiges", color: "text-gray-700", bg: "bg-gray-100 border-gray-200" },
};

const statusConfig = {
  offen: { label: "Offen", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: AlertTriangle },
  in_bearbeitung: { label: "In Bearbeitung", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Loader2 },
  erledigt: { label: "Erledigt", color: "text-green-600", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
};

export default function StoerungenPage() {
  const { user, allUsers, disruptionReports, addDisruption, updateDisruptionStatus, hasRole } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"alle" | "offen" | "in_bearbeitung" | "erledigt">("alle");
  const [formData, setFormData] = useState({
    category: "maschinenstillstand" as DisruptionCategory,
    title: "",
    description: "",
    location: "",
    imageUrls: [] as string[],
  });
  const [formError, setFormError] = useState("");

  // Determine which reports to show
  const visibleReports = useMemo(() => {
    if (!user) return [];
    let reports = disruptionReports;
    // Admin sees all, managers see their team's, others see their own
    if (user.role !== "admin") {
      const teamIds = allUsers.filter((u) => u.managerId === user.id).map((u) => u.id);
      reports = reports.filter(
        (r) => r.reporterId === user.id || r.assignedTo === user.id || teamIds.includes(r.reporterId)
      );
    }
    if (statusFilter !== "alle") {
      reports = reports.filter((r) => r.status === statusFilter);
    }
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [user, disruptionReports, allUsers, statusFilter]);

  const canChangeStatus = (reporterId: string, assignedTo?: string) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (assignedTo === user.id) return true;
    return false;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) return; // max 5MB
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setFormData((prev) => ({
            ...prev,
            imageUrls: [...prev.imageUrls, reader.result as string].slice(0, 5),
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = () => {
    setFormError("");
    const cleaned = {
      category: formData.category,
      title: sanitizeAndLimit(formData.title, 200),
      description: sanitizeAndLimit(formData.description, 2000),
      location: sanitizeAndLimit(formData.location, 200),
      imageUrls: formData.imageUrls,
    };

    if (!cleaned.title) {
      setFormError("Bitte einen Titel eingeben.");
      return;
    }
    if (!cleaned.description) {
      setFormError("Bitte eine Beschreibung eingeben.");
      return;
    }
    if (!DISRUPTION_CATEGORIES.includes(cleaned.category)) {
      setFormError("Ungültige Kategorie.");
      return;
    }

    // Auto-assign to supervisor (managerId)
    const supervisor = user?.managerId || (user?.role === "admin" ? user?.id : undefined);

    addDisruption({
      reporterId: user!.id,
      ...cleaned,
      assignedTo: supervisor,
    });

    setFormData({
      category: "maschinenstillstand",
      title: "",
      description: "",
      location: "",
      imageUrls: [],
    });
    setShowForm(false);
  };

  const getUserName = (id: string) => {
    const u = allUsers.find((usr) => usr.id === id);
    return u ? `${u.firstName} ${u.lastName}` : "Unbekannt";
  };

  const stats = {
    offen: disruptionReports.filter((r) => r.status === "offen").length,
    inBearbeitung: disruptionReports.filter((r) => r.status === "in_bearbeitung").length,
    erledigt: disruptionReports.filter((r) => r.status === "erledigt").length,
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-red-500" />
            Störungsmeldungen
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Störungen melden und verfolgen
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Störung melden
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.offen}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Offen</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.inBearbeitung}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">In Bearbeitung</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.erledigt}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Erledigt</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
        {(["alle", "offen", "in_bearbeitung", "erledigt"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-[var(--color-primary-600)] text-white"
                : "bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-50)]"
            }`}
          >
            {s === "alle" ? "Alle" : s === "in_bearbeitung" ? "In Bearbeitung" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Reports list */}
      <div className="space-y-4">
        {visibleReports.map((report) => {
          const catConfig = categoryLabels[report.category];
          const statConfig = statusConfig[report.status];
          const StatIcon = statConfig.icon;

          return (
            <div key={report.id} className="bg-white rounded-xl border border-[var(--color-border)] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${catConfig.bg} ${catConfig.color}`}>
                      {catConfig.label}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border flex items-center gap-1 ${statConfig.bg} ${statConfig.color}`}>
                      <StatIcon className="h-3 w-3" />
                      {statConfig.label}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{report.title}</h3>
                </div>
                {canChangeStatus(report.reporterId, report.assignedTo) && report.status !== "erledigt" && (
                  <select
                    value={report.status}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "offen" || val === "in_bearbeitung" || val === "erledigt") {
                        updateDisruptionStatus(report.id, val);
                      }
                    }}
                    className="px-2 py-1 border border-[var(--color-border)] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  >
                    <option value="offen">Offen</option>
                    <option value="in_bearbeitung">In Bearbeitung</option>
                    <option value="erledigt">Erledigt</option>
                  </select>
                )}
              </div>

              <p className="text-sm text-[var(--color-text-secondary)] mb-3">{report.description}</p>

              {report.imageUrls.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {report.imageUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Störung Bild ${i + 1}`}
                      className="h-20 w-20 object-cover rounded-lg border border-[var(--color-border)]"
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {getUserName(report.reporterId)}
                </span>
                {report.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {report.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(report.createdAt).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {report.assignedTo && (
                  <span className="flex items-center gap-1">
                    Zugewiesen: {getUserName(report.assignedTo)}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {visibleReports.length === 0 && (
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4" />
            <p className="text-[var(--color-text-muted)]">Keine Störungsmeldungen gefunden.</p>
          </div>
        )}
      </div>

      {/* New Disruption Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Störung melden</h2>
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
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Kategorie</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(categoryLabels) as [DisruptionCategory, typeof categoryLabels.maschinenstillstand][]).map(([cat, config]) => (
                    <button
                      key={cat}
                      onClick={() => {
                        if (DISRUPTION_CATEGORIES.includes(cat)) {
                          setFormData({ ...formData, category: cat });
                        }
                      }}
                      className={`text-xs font-medium px-3 py-2 rounded-lg border-2 transition-colors text-left ${
                        formData.category === cat
                          ? `${config.bg} border-current ${config.color}`
                          : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]"
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Titel *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={200}
                  placeholder="Kurze Beschreibung der Störung"
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Beschreibung *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={2000}
                  rows={4}
                  placeholder="Detaillierte Beschreibung der Störung, Fehlermeldungen, etc."
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Ort (optional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    maxLength={200}
                    placeholder="z.B. Halle 2, Maschine CNC-F02"
                    className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Fotos (max. 5, je max. 5 MB)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.imageUrls.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt={`Foto ${i + 1}`} className="h-16 w-16 object-cover rounded-lg border" />
                      <button
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            imageUrls: prev.imageUrls.filter((_, idx) => idx !== i),
                          }))
                        }
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {formData.imageUrls.length < 5 && (
                  <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[var(--color-border)] rounded-lg cursor-pointer hover:border-[var(--color-primary-400)] transition-colors">
                    <Camera className="h-5 w-5 text-[var(--color-text-muted)]" />
                    <span className="text-sm text-[var(--color-text-muted)]">Fotos hinzufügen</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
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
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Melden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
