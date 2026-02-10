import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ImpressumPage() {
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

        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-8">
          Impressum
        </h1>

        <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 space-y-8 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Angaben gemäß § 5 TMG
            </h2>
            <p>
              Hellbeck GmbH<br />
              Musterstraße 1<br />
              80331 München<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Vertreten durch
            </h2>
            <p>Geschäftsführer: [Name des Geschäftsführers]</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Kontakt
            </h2>
            <p>
              Telefon: +49 89 123456-0<br />
              E-Mail: info@hellbeck.de
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Registereintrag
            </h2>
            <p>
              Eintragung im Handelsregister.<br />
              Registergericht: Amtsgericht München<br />
              Registernummer: HRB XXXXXX
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Umsatzsteuer-ID
            </h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a
              Umsatzsteuergesetz:<br />
              DE XXX XXX XXX
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <p>
              [Name des Verantwortlichen]<br />
              Hellbeck GmbH<br />
              Musterstraße 1<br />
              80331 München
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Streitschlichtung
            </h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit. Wir sind nicht verpflichtet
              und nicht bereit, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
