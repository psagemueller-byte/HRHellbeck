"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(
          data.error || "Ein Fehler ist aufgetreten. Bitte versuche es erneut."
        );
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Ungültiger Link
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Der Link ist ungültig. Bitte fordere einen neuen
          Passwort-Reset-Link an.
        </p>
        <Link
          href="/passwort-vergessen"
          className="inline-flex items-center gap-2 text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] font-medium"
        >
          Neuen Link anfordern
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div>
        <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Passwort geändert
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Dein Passwort wurde erfolgreich zurückgesetzt. Du kannst dich jetzt
          mit deinem neuen Passwort anmelden.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
        >
          Zur Anmeldung
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
        Neues Passwort setzen
      </h2>
      <p className="text-[var(--color-text-secondary)] mb-8">
        Wähle ein sicheres Passwort mit mindestens 8 Zeichen.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
          >
            Neues Passwort
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              maxLength={128}
              autoComplete="new-password"
              autoFocus
              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent transition pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
          >
            Passwort bestätigen
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Passwort wiederholen"
            maxLength={128}
            autoComplete="new-password"
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
            "Passwort speichern"
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
            Neues Passwort setzen
          </h1>
          <p className="text-lg text-primary-200 leading-relaxed">
            Wähle ein sicheres Passwort für dein Hellbeck HR Portal Konto.
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

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 border-2 border-[var(--color-primary-600)] border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>

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
