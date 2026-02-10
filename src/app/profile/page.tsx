"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Save,
  Pencil,
  X,
} from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    phone: user?.phone || "",
    street: user?.street || "",
    city: user?.city || "",
    zipCode: user?.zipCode || "",
    country: user?.country || "",
  });

  if (!user) return null;

  const handleSave = () => {
    updateUser(formData);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setFormData({
      phone: user.phone,
      street: user.street,
      city: user.city,
      zipCode: user.zipCode,
      country: user.country,
    });
    setEditing(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Meine Daten
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Verwalte deine persönlichen Informationen
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Bearbeiten
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium py-2.5 px-4 rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              <X className="h-4 w-4" />
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              Speichern
            </button>
          </div>
        )}
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          Deine Daten wurden erfolgreich gespeichert.
        </div>
      )}

      {/* Profile header card */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-700)] flex items-center justify-center text-white text-2xl font-bold">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              {user.position}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Abteilung: {user.department}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal info */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-[var(--color-primary-600)]" />
            Persönliche Daten
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Vorname
              </label>
              <p className="text-sm text-[var(--color-text-primary)] mt-1">
                {user.firstName}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Nachname
              </label>
              <p className="text-sm text-[var(--color-text-primary)] mt-1">
                {user.lastName}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Geburtsdatum
              </label>
              <p className="text-sm text-[var(--color-text-primary)] mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
                {formatDate(user.birthDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-[var(--color-primary-600)]" />
            Kontaktdaten
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                E-Mail
              </label>
              <p className="text-sm text-[var(--color-text-primary)] mt-1 flex items-center gap-2">
                <Mail className="h-4 w-4 text-[var(--color-text-muted)]" />
                {user.email}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Telefon
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              ) : (
                <p className="text-sm text-[var(--color-text-primary)] mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[var(--color-text-muted)]" />
                  {user.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[var(--color-primary-600)]" />
            Adresse
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Straße
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              ) : (
                <p className="text-sm text-[var(--color-text-primary)] mt-1">
                  {user.street}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  PLZ
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                ) : (
                  <p className="text-sm text-[var(--color-text-primary)] mt-1">
                    {user.zipCode}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Stadt
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                ) : (
                  <p className="text-sm text-[var(--color-text-primary)] mt-1">
                    {user.city}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Land
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              ) : (
                <p className="text-sm text-[var(--color-text-primary)] mt-1">
                  {user.country}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Employment info */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--color-primary-600)]" />
            Beschäftigungsdaten
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Position
              </label>
              <p className="text-sm text-[var(--color-text-primary)] mt-1">
                {user.position}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Abteilung
              </label>
              <p className="text-sm text-[var(--color-text-primary)] mt-1">
                {user.department}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Eintrittsdatum
              </label>
              <p className="text-sm text-[var(--color-text-primary)] mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
                {formatDate(user.startDate)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Mitarbeiter-ID
              </label>
              <p className="text-sm text-[var(--color-text-primary)] mt-1">
                {user.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
