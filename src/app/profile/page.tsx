"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { uploadFile } from "@/lib/upload";
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
  Download,
  Trash2,
  Shield,
  Camera,
  ImageOff,
} from "lucide-react";
import { sanitizeAndLimit, isValidPhone, isValidZipCode } from "@/lib/sanitize";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    phone: user?.phone || "",
    street: user?.street || "",
    city: user?.city || "",
    zipCode: user?.zipCode || "",
    country: user?.country || "",
  });

  if (!user) return null;

  const [saveError, setSaveError] = useState("");

  const handleSave = () => {
    setSaveError("");

    if (formData.phone && !isValidPhone(formData.phone)) {
      setSaveError("Bitte eine gültige Telefonnummer eingeben.");
      return;
    }
    if (formData.zipCode && !isValidZipCode(formData.zipCode)) {
      setSaveError("Bitte eine gültige PLZ eingeben.");
      return;
    }

    const sanitized = {
      phone: sanitizeAndLimit(formData.phone, 30),
      street: sanitizeAndLimit(formData.street, 200),
      city: sanitizeAndLimit(formData.city, 100),
      zipCode: sanitizeAndLimit(formData.zipCode, 10),
      country: sanitizeAndLimit(formData.country, 100),
    };

    updateUser(sanitized);
    setFormData(sanitized);
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError("Nur JPG, PNG, GIF oder WebP erlaubt.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("Das Bild darf maximal 2 MB groß sein.");
      return;
    }

    // Upload to Supabase Storage
    const url = await uploadFile(file, "avatars");
    if (url) {
      updateUser({ avatar: url });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      // Fallback to data URL if upload fails (e.g. Supabase not configured)
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl && dataUrl.startsWith("data:image/")) {
          updateUser({ avatar: dataUrl });
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAvatar = () => {
    updateUser({ avatar: undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.6px] mb-1 md:hidden">
            Personalwesen
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
            Meine Daten
          </h1>
          <p className="text-sm md:text-base text-[var(--color-text-secondary)] mt-1">
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

      {saveError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {saveError}
        </div>
      )}

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          Deine Daten wurden erfolgreich gespeichert.
        </div>
      )}

      {/* Profile header card */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar with upload */}
          <div className="relative group flex-shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-20 w-20 rounded-full object-cover border-2 border-[var(--color-border)]"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-700)] flex items-center justify-center text-white text-2xl font-bold">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Foto hochladen"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              {user.position}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Abteilung: {user.department}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] font-medium flex items-center gap-1"
              >
                <Camera className="h-3 w-3" />
                Foto ändern
              </button>
              {user.avatar && (
                <button
                  onClick={removeAvatar}
                  className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                >
                  <ImageOff className="h-3 w-3" />
                  Foto entfernen
                </button>
              )}
            </div>
            {avatarError && (
              <p className="text-xs text-red-600 mt-1">{avatarError}</p>
            )}
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
                  maxLength={30}
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
                  maxLength={200}
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
                    maxLength={10}
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
                    maxLength={100}
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
                  maxLength={100}
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

      {/* DSGVO Betroffenenrechte */}
      <div className="mt-6 bg-white rounded-xl border border-[var(--color-border)] p-6">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
          <Shield className="h-5 w-5 text-[var(--color-primary-600)]" />
          Datenschutz &amp; Betroffenenrechte
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Gem. Art. 15-21 DSGVO hast du das Recht auf Auskunft, Berichtigung,
          Löschung und Datenübertragbarkeit deiner personenbezogenen Daten.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              const data = JSON.stringify(user, null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `meine-daten-${user.id}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
          >
            <Download className="h-4 w-4" />
            Meine Daten exportieren (JSON)
          </button>
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Möchtest du wirklich die Löschung deiner Daten beantragen? " +
                    "Diese Anfrage wird an die HR-Abteilung weitergeleitet und gem. Art. 17 DSGVO bearbeitet."
                )
              ) {
                alert(
                  "Deine Löschanfrage wurde an datenschutz@hellbeck.de gesendet. " +
                    "Du erhältst innerhalb von 30 Tagen eine Bestätigung."
                );
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Datenlöschung beantragen
          </button>
        </div>
      </div>
    </div>
  );
}
