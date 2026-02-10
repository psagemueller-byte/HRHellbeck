"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, X } from "lucide-react";

const CONSENT_KEY = "hr-portal-cookie-consent";

interface ConsentState {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  consentedAt: string;
}

function getStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const saveConsent = (consent: ConsentState) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setVisible(false);
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      functional: true,
      analytics: true,
      consentedAt: new Date().toISOString(),
    });
  };

  const acceptSelected = () => {
    saveConsent({
      necessary: true,
      functional,
      analytics,
      consentedAt: new Date().toISOString(),
    });
  };

  const rejectOptional = () => {
    saveConsent({
      necessary: true,
      functional: false,
      analytics: false,
      consentedAt: new Date().toISOString(),
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-50)] flex items-center justify-center">
                <Shield className="h-5 w-5 text-[var(--color-primary-600)]" />
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                Cookie-Einstellungen
              </h2>
            </div>
            <button
              onClick={rejectOptional}
              className="h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center"
            >
              <X className="h-5 w-5 text-[var(--color-text-muted)]" />
            </button>
          </div>

          <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
            Wir verwenden Cookies, um dir die bestmögliche Erfahrung zu bieten.
            Weitere Informationen findest du in unserer{" "}
            <Link
              href="/datenschutz"
              className="text-[var(--color-primary-600)] underline"
            >
              Datenschutzerklärung
            </Link>
            .
          </p>

          {showDetails && (
            <div className="space-y-3 mb-4 bg-[var(--color-surface-tertiary)] rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-not-allowed">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="mt-0.5 h-4 w-4 rounded"
                />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Notwendige Cookies
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Erforderlich für die Grundfunktionen (Login, Session).
                    Können nicht deaktiviert werden.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={functional}
                  onChange={(e) => setFunctional(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary-600)]"
                />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Funktionale Cookies
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Speichern Einstellungen wie Sprache und
                    Darstellungspräferenzen.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary-600)]"
                />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Analyse-Cookies
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Helfen uns, die Nutzung des Portals zu verstehen und zu
                    verbessern.
                  </p>
                </div>
              </label>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={rejectOptional}
              className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              Nur notwendige
            </button>
            {!showDetails ? (
              <button
                onClick={() => setShowDetails(true)}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
              >
                Einstellungen
              </button>
            ) : (
              <button
                onClick={acceptSelected}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
              >
                Auswahl bestätigen
              </button>
            )}
            <button
              onClick={acceptAll}
              className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Alle akzeptieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
