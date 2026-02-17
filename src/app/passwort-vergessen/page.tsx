"use client";

import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Bitte eine E-Mail-Adresse eingeben.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-900)] p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo_hellbeck.svg"
            alt="Hellbeck"
            className="h-12 brightness-0 invert"
          />
          <span className="text-2xl font-bold text-white">HR Portal</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Passwort vergessen?
          </h1>
          <p className="text-lg text-primary-200 leading-relaxed">
            Kein Problem. Gib deine E-Mail-Adresse ein und wir senden dir einen
            Link zum Zurücksetzen deines Passworts.
          </p>
        </div>
        <p className="text-sm text-primary-300">
          &copy; {new Date().getFullYear()} Hellbeck GmbH. Alle Rechte
          vorbehalten.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--color-surface-secondary)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/logo_hellbeck.svg" alt="Hellbeck" className="h-10" />
            <span className="text-xl font-bold text-[var(--color-text-primary)]">
              HR Portal
            </span>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Anmeldung
          </Link>

          {sent ? (
            <div>
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                E-Mail gesendet
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Falls ein Konto mit der Adresse <strong>{email}</strong>{" "}
                existiert, haben wir dir einen Link zum Zurücksetzen deines
                Passworts gesendet. Prüfe auch deinen Spam-Ordner.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück zur Anmeldung
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                Passwort zurücksetzen
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-8">
                Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum
                Zurücksetzen deines Passworts.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
                  >
                    E-Mail-Adresse
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@hellbeck.de"
                    maxLength={254}
                    autoComplete="email"
                    autoFocus
                    className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Link senden"
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
            Probleme? Kontaktiere{" "}
            <span className="text-[var(--color-primary-600)] font-medium">
              hr@hellbeck.de
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
