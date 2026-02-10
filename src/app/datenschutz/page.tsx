import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>

        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          Datenschutzerklärung
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Stand: Februar 2026
        </p>

        <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 space-y-8 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              1. Verantwortlicher
            </h2>
            <p>
              Hellbeck GmbH<br />
              Musterstraße 1<br />
              80331 München<br />
              Deutschland
            </p>
            <p className="mt-2">
              E-Mail: datenschutz@hellbeck.de<br />
              Telefon: +49 89 123456-0
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              2. Datenschutzbeauftragter
            </h2>
            <p>
              Unser Datenschutzbeauftragter ist erreichbar unter:{" "}
              <span className="font-medium">datenschutz@hellbeck.de</span>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              3. Zweck und Rechtsgrundlage der Datenverarbeitung
            </h2>
            <p>Wir verarbeiten personenbezogene Daten unserer Mitarbeitenden für folgende Zwecke:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Authentifizierung &amp; Zugang:</strong> Anmeldung am HR-Portal
                (Art. 6 Abs. 1 lit. b DSGVO — Erfüllung des Arbeitsvertrags)
              </li>
              <li>
                <strong>Personalverwaltung:</strong> Verwaltung persönlicher Daten, Urlaubsanträge
                (Art. 6 Abs. 1 lit. b DSGVO)
              </li>
              <li>
                <strong>Unternehmensinformation:</strong> Bereitstellung von News und Mitteilungen
                (Art. 6 Abs. 1 lit. f DSGVO — Berechtigtes Interesse)
              </li>
              <li>
                <strong>Technischer Betrieb:</strong> Session-Cookies für die Funktionalität
                (Art. 6 Abs. 1 lit. f DSGVO)
              </li>
              <li>
                <strong>Analyse (optional):</strong> Nutzungsstatistiken zur Verbesserung des Portals
                (Art. 6 Abs. 1 lit. a DSGVO — Einwilligung)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              4. Kategorien verarbeiteter Daten
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Stammdaten (Name, Geburtsdatum, Mitarbeiter-ID)</li>
              <li>Kontaktdaten (E-Mail, Telefon, Adresse)</li>
              <li>Beschäftigungsdaten (Position, Abteilung, Eintrittsdatum)</li>
              <li>Urlaubsdaten (Anträge, Kontingent, Genehmigungsstatus)</li>
              <li>Technische Daten (IP-Adresse, Browser-Typ, Session-ID)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              5. Cookies
            </h2>
            <p>Dieses Portal verwendet folgende Cookie-Kategorien:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Notwendige Cookies:</strong> Erforderlich für Login und Session-Verwaltung.
                Können nicht deaktiviert werden.
              </li>
              <li>
                <strong>Funktionale Cookies:</strong> Speichern Benutzereinstellungen (z.B. Sprache).
                Einwilligungsbasiert.
              </li>
              <li>
                <strong>Analyse-Cookies:</strong> Anonyme Nutzungsstatistiken.
                Nur mit ausdrücklicher Einwilligung.
              </li>
            </ul>
            <p className="mt-2">
              Du kannst deine Cookie-Einstellungen jederzeit über den Cookie-Banner
              ändern (erreichbar über den Link im Footer).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              6. Speicherdauer
            </h2>
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie es für den
              jeweiligen Zweck erforderlich ist:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Stamm- und Beschäftigungsdaten: Dauer des Arbeitsverhältnisses + gesetzliche Aufbewahrungsfristen</li>
              <li>Urlaubsdaten: 3 Jahre nach Ende des Kalenderjahres</li>
              <li>Session-Daten: Bis zum Logout bzw. max. 24 Stunden</li>
              <li>Cookie-Einwilligungen: 12 Monate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              7. Deine Rechte (Betroffenenrechte)
            </h2>
            <p>Als betroffene Person hast du folgende Rechte:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Auskunft</strong> (Art. 15 DSGVO) — Welche Daten über dich gespeichert sind</li>
              <li><strong>Berichtigung</strong> (Art. 16 DSGVO) — Korrektur unrichtiger Daten</li>
              <li><strong>Löschung</strong> (Art. 17 DSGVO) — Löschung deiner Daten (&bdquo;Recht auf Vergessenwerden&ldquo;)</li>
              <li><strong>Einschränkung</strong> (Art. 18 DSGVO) — Einschränkung der Verarbeitung</li>
              <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO) — Export deiner Daten in maschinenlesbarem Format</li>
              <li><strong>Widerspruch</strong> (Art. 21 DSGVO) — Widerspruch gegen die Verarbeitung</li>
              <li><strong>Widerruf der Einwilligung</strong> (Art. 7 Abs. 3 DSGVO) — Jederzeit möglich</li>
            </ul>
            <p className="mt-2">
              Du kannst diese Rechte direkt über dein Profil im HR-Portal ausüben
              (Datenexport und Löschanfrage) oder per E-Mail an{" "}
              <span className="font-medium">datenschutz@hellbeck.de</span>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              8. Empfänger der Daten
            </h2>
            <p>Deine Daten können an folgende Stellen weitergegeben werden:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Interne Abteilungen (HR, Vorgesetzte — im Rahmen der Urlaubsgenehmigung)</li>
              <li>IT-Dienstleister (Hosting bei Vercel Inc., USA — auf Basis von Standardvertragsklauseln gem. Art. 46 DSGVO)</li>
              <li>HR-Software-Anbieter (bei aktivierter Integration — Auftragsverarbeitungsvertrag gem. Art. 28 DSGVO)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              9. Drittlandtransfer
            </h2>
            <p>
              Das Hosting erfolgt über Vercel Inc. (USA). Die Datenübermittlung ist
              durch EU-Standardvertragsklauseln (SCC) abgesichert. Weitere
              Informationen findest du in der Datenschutzerklärung von Vercel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              10. Beschwerderecht
            </h2>
            <p>
              Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu
              beschweren. Die für uns zuständige Behörde ist:
            </p>
            <p className="mt-2">
              Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)<br />
              Promenade 18, 91522 Ansbach<br />
              poststelle@lda.bayern.de
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              11. Sicherheit
            </h2>
            <p>
              Wir setzen technische und organisatorische Maßnahmen ein, um deine
              Daten zu schützen, darunter:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Verschlüsselte Übertragung (HTTPS/TLS)</li>
              <li>Input-Sanitisierung gegen Injection-Angriffe</li>
              <li>Rate-Limiting bei der Anmeldung</li>
              <li>Regelmäßige Sicherheitsprüfungen</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
