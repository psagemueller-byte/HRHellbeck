"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const authError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Bitte E-Mail und Passwort eingeben.");
      setLoading(false);
      return;
    }

    if (!privacyAccepted) {
      setError("Bitte stimme der Datenschutzerklärung zu.");
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      router.push(callbackUrl);
    } else {
      setError(result.error || "Ungültige Anmeldedaten.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!privacyAccepted) {
      setError("Bitte stimme der Datenschutzerklärung zu.");
      return;
    }
    setGoogleLoading(true);
    await loginWithGoogle();
  };

  const displayError =
    authError === "NoAccount"
      ? "Kein Konto mit dieser Google-E-Mail gefunden. Bitte kontaktiere die HR-Abteilung."
      : authError === "Deactivated"
        ? "Dein Konto wurde deaktiviert. Kontaktiere hr@hellbeck.de."
        : error;

  return (
    <>
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
        Anmelden
      </h2>
      <p className="text-[var(--color-text-secondary)] mb-8">
        Melde dich mit deinen Unternehmensdaten an.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {displayError && (
          <div
            className={`text-sm px-4 py-3 rounded-lg ${
              authError === "NoAccount"
                ? "bg-amber-50 border border-amber-200 text-amber-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {displayError}
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
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent transition"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
          >
            Passwort
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort eingeben"
              maxLength={128}
              autoComplete="current-password"
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

        <div className="space-y-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]"
            />
            <span className="text-sm text-[var(--color-text-secondary)]">
              Ich habe die{" "}
              <Link
                href="/datenschutz"
                className="text-[var(--color-primary-600)] underline hover:text-[var(--color-primary-700)]"
                target="_blank"
              >
                Datenschutzerklärung
              </Link>{" "}
              gelesen und stimme der Verarbeitung meiner Daten zu.
            </span>
          </label>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">
                Angemeldet bleiben
              </span>
            </label>
            <Link
              href="/passwort-vergessen"
              className="text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] font-medium"
            >
              Passwort vergessen?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Anmelden
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--color-border)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
            oder
          </span>
        </div>
      </div>

      {/* Google Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {googleLoading ? (
          <div className="h-5 w-5 border-2 border-[var(--color-primary-600)] border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <GoogleIcon className="h-5 w-5" />
            Mit Google anmelden
          </>
        )}
      </button>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side — Branding */}
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
            Willkommen bei Hellbeck
          </h1>
          <p className="text-lg text-primary-200 leading-relaxed">
            Verwalte deine persönlichen Daten, stelle Urlaubsanträge und bleibe
            über alle Neuigkeiten im Unternehmen informiert — alles an einem
            Ort.
          </p>
        </div>
        <p className="text-sm text-primary-300">
          &copy; {new Date().getFullYear()} Hellbeck GmbH. Alle Rechte
          vorbehalten.
        </p>
      </div>

      {/* Right side — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--color-surface-secondary)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/logo_hellbeck.svg" alt="Hellbeck" className="h-10" />
            <span className="text-xl font-bold text-[var(--color-text-primary)]">
              HR Portal
            </span>
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 border-2 border-[var(--color-primary-600)] border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>

          <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
            Probleme beim Anmelden? Kontaktiere{" "}
            <span className="text-[var(--color-primary-600)] font-medium">
              hr@hellbeck.de
            </span>
          </p>

          <div className="mt-4 flex items-center justify-center gap-4">
            <Link
              href="/datenschutz"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] underline"
            >
              Datenschutzerklärung
            </Link>
            <Link
              href="/impressum"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] underline"
            >
              Impressum
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
