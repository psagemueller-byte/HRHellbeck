"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Building2, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Bitte E-Mail und Passwort eingeben.");
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Ungültige Anmeldedaten.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-900)] p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-10 w-10 text-white" />
          <span className="text-2xl font-bold text-white">HR Portal</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Willkommen bei Hellbeck
          </h1>
          <p className="text-lg text-primary-200 leading-relaxed">
            Verwalte deine persönlichen Daten, stelle Urlaubsanträge und
            bleibe über alle Neuigkeiten im Unternehmen informiert — alles
            an einem Ort.
          </p>
        </div>
        <p className="text-sm text-primary-300">
          &copy; {new Date().getFullYear()} Hellbeck GmbH. Alle Rechte vorbehalten.
        </p>
      </div>

      {/* Right side — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--color-surface-secondary)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <Building2 className="h-8 w-8 text-[var(--color-primary-600)]" />
            <span className="text-xl font-bold text-[var(--color-text-primary)]">
              HR Portal
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Anmelden
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Melde dich mit deinen Unternehmensdaten an.
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
              <button
                type="button"
                className="text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] font-medium"
              >
                Passwort vergessen?
              </button>
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

          <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
            Probleme beim Anmelden? Kontaktiere{" "}
            <span className="text-[var(--color-primary-600)] font-medium">
              hr@hellbeck.de
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
