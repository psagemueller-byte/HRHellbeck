import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white mt-12">
      <div className="max-w-6xl mx-auto px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[var(--color-text-muted)]">
          &copy; {new Date().getFullYear()} Hellbeck GmbH. Alle Rechte
          vorbehalten.
        </p>
        <nav className="flex items-center gap-6">
          <Link
            href="/datenschutz"
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Datenschutzerklärung
          </Link>
          <Link
            href="/impressum"
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Impressum
          </Link>
        </nav>
      </div>
    </footer>
  );
}
