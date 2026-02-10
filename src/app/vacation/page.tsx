"use client";

import { useState } from "react";
import { mockVacationBalance, mockVacationRequests } from "@/lib/mock-data";
import { VacationRequest } from "@/types";
import { sanitizeAndLimit, isValidDate, isValidVacationType } from "@/lib/sanitize";
import {
  Palmtree,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Plus,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

const statusConfig: Record<
  string,
  { icon: typeof Clock; color: string; bg: string; label: string }
> = {
  ausstehend: {
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "Ausstehend",
  },
  genehmigt: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Genehmigt",
  },
  abgelehnt: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    label: "Abgelehnt",
  },
};

const typeLabels: Record<string, string> = {
  urlaub: "Erholungsurlaub",
  sonderurlaub: "Sonderurlaub",
  unbezahlt: "Unbezahlter Urlaub",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calculateBusinessDays(start: string, end: string): number {
  let count = 0;
  const current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export default function VacationPage() {
  const balance = mockVacationBalance;
  const [requests, setRequests] = useState<VacationRequest[]>(mockVacationRequests);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    type: "urlaub" as "urlaub" | "sonderurlaub" | "unbezahlt",
    reason: "",
  });
  const [formError, setFormError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.startDate || !formData.endDate) {
      setFormError("Bitte Start- und Enddatum angeben.");
      return;
    }

    if (!isValidDate(formData.startDate) || !isValidDate(formData.endDate)) {
      setFormError("Bitte gültige Datumsangaben verwenden.");
      return;
    }

    if (!isValidVacationType(formData.type)) {
      setFormError("Ungültiger Urlaubstyp.");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setFormError("Das Startdatum muss vor dem Enddatum liegen.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (formData.startDate < today) {
      setFormError("Das Startdatum darf nicht in der Vergangenheit liegen.");
      return;
    }

    const days = calculateBusinessDays(formData.startDate, formData.endDate);

    if (days <= 0) {
      setFormError("Der gewählte Zeitraum enthält keine Arbeitstage.");
      return;
    }

    if (days > balance.remaining) {
      setFormError(
        `Nicht genügend Resturlaub. Du hast noch ${balance.remaining} Tage, beantragst aber ${days} Tage.`
      );
      return;
    }

    const sanitizedReason = formData.reason
      ? sanitizeAndLimit(formData.reason, 500)
      : undefined;

    const newRequest: VacationRequest = {
      id: `vac-${Date.now()}`,
      userId: "usr-001",
      startDate: formData.startDate,
      endDate: formData.endDate,
      days,
      type: formData.type,
      status: "ausstehend",
      reason: sanitizedReason,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setRequests([newRequest, ...requests]);
    setShowForm(false);
    setFormData({ startDate: "", endDate: "", type: "urlaub", reason: "" });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Urlaubsverwaltung
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Beantrage Urlaub und behalte deine Tage im Blick
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Urlaub beantragen
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Gesamturlaub
            </span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {balance.total} Tage
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Genommen
            </span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {balance.used} Tage
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Geplant
            </span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {balance.planned} Tage
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Palmtree className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Resturlaub
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {balance.remaining} Tage
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Urlaubsverbrauch {new Date().getFullYear()}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">
            {balance.used + balance.planned} von {balance.total} Tagen
          </span>
        </div>
        <div className="h-3 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
          <div className="h-full flex">
            <div
              className="bg-[var(--color-primary-600)] transition-all"
              style={{
                width: `${(balance.used / balance.total) * 100}%`,
              }}
            />
            <div
              className="bg-[var(--color-primary-300)] transition-all"
              style={{
                width: `${(balance.planned / balance.total) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-primary-600)]" />
            Genommen
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-primary-300)]" />
            Geplant
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-surface-tertiary)]" />
            Verfügbar
          </span>
        </div>
      </div>

      {/* New request form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                Neuer Urlaubsantrag
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center"
              >
                <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Art des Urlaubs
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as typeof formData.type,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="urlaub">Erholungsurlaub</option>
                  <option value="sonderurlaub">Sonderurlaub</option>
                  <option value="unbezahlt">Unbezahlter Urlaub</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                    Von
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                    Bis
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-[var(--color-surface-tertiary)] rounded-lg px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  Arbeitstage:{" "}
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {calculateBusinessDays(
                      formData.startDate,
                      formData.endDate
                    )}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Anmerkung (optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="z.B. Sommerurlaub, Familienfeier..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Antrag einreichen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests table */}
      <div className="bg-white rounded-xl border border-[var(--color-border)]">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Meine Anträge
          </h2>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {requests.length === 0 ? (
            <div className="px-5 py-12 text-center text-[var(--color-text-muted)]">
              Keine Urlaubsanträge vorhanden.
            </div>
          ) : (
            requests.map((req) => {
              const status = statusConfig[req.status];
              const StatusIcon = status.icon;
              return (
                <div
                  key={req.id}
                  className="px-5 py-4 flex items-center gap-4"
                >
                  <div
                    className={`h-10 w-10 rounded-lg ${status.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <StatusIcon className={`h-5 w-5 ${status.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {formatDate(req.startDate)} — {formatDate(req.endDate)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {typeLabels[req.type]} &middot; {req.days} Tag
                      {req.days !== 1 ? "e" : ""}
                      {req.reason && ` — ${req.reason}`}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">
                    Beantragt am {formatDate(req.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
