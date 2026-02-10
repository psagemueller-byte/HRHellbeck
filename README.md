# HR Portal — Hellbeck

Modernes Mitarbeiterportal (inspiriert von [Personio](https://personio.de)), gebaut mit **Next.js 16**, **TypeScript** und **Tailwind CSS 4**.

## Features

- **Login** — Anmeldung mit E-Mail & Passwort, Split-Layout mit Unternehmens-Branding
- **Dashboard** — Tagesaktueller Überblick mit Urlaubskonto, Schnellaktionen und Unternehmens-News
- **Meine Daten** — Persönliche Informationen, Kontaktdaten und Adresse bearbeiten
- **Urlaubsverwaltung** — Anträge stellen, Resturlaub einsehen, Statusverfolgung

## Schnellstart

```bash
npm install
npm run dev
```

Die Anwendung startet unter [http://localhost:3000](http://localhost:3000).

Zum Einloggen eine beliebige E-Mail und ein Passwort eingeben (Mock-Login).

## HR-Tool Integration

Die API-Schicht (`src/lib/hr-api.ts`) ist für die Anbindung an ein externes HR-System vorbereitet.

Umgebungsvariablen für die Integration (`.env.local`):

```env
NEXT_PUBLIC_HR_API_URL=https://api.euer-hr-tool.de/v1
HR_API_KEY=euer-api-key
NEXT_PUBLIC_HR_INTEGRATION_ENABLED=true
```

## Projektstruktur

```
src/
├── app/
│   ├── dashboard/    # Dashboard mit News & Urlaubsübersicht
│   ├── login/        # Login-Seite
│   ├── profile/      # Persönliche Daten
│   ├── vacation/     # Urlaubsverwaltung
│   ├── globals.css   # Tailwind + Design-Tokens
│   ├── layout.tsx    # Root-Layout mit Auth-Provider
│   └── page.tsx      # Redirect → Login/Dashboard
├── components/
│   ├── AppShell.tsx   # Layout-Wrapper mit Auth-Guard
│   └── Sidebar.tsx    # Navigationsleiste
├── lib/
│   ├── auth-context.tsx  # Auth-State (React Context)
│   ├── hr-api.ts         # HR-Tool API-Abstraktionsschicht
│   └── mock-data.ts      # Testdaten
└── types/
    └── index.ts       # TypeScript-Interfaces
```

## Tech-Stack

| Technologie | Version |
|-------------|---------|
| Next.js     | 16      |
| React       | 19      |
| TypeScript  | 5.9     |
| Tailwind CSS| 4       |
| Lucide Icons| 0.563   |
