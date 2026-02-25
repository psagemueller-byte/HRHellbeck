# Supabase Security Checklist — HRHellbeck

## Überblick

Der Supabase Security Advisor hat 8 Sicherheitsprobleme gemeldet.
Diese Anleitung erklärt, wie du alle behebst.

---

## Teil 1: SQL-Fixes (Row Level Security)

> **Datei:** `supabase/security-fixes.sql`

### Was wird gemacht?
- RLS wird auf allen 6 Tabellen aktiviert (`User`, `Account`, `Session`, `VerificationToken`, `PasswordResetToken`, `_prisma_migrations`)
- Restriktive Policies sperren den Zugriff über die Supabase API (anon/authenticated Rollen)
- Prisma funktioniert weiterhin, da es über die `postgres`-Rolle verbindet (umgeht RLS)

### Ausführung:
1. Öffne dein Supabase Dashboard → **SQL Editor**
2. Klicke auf **New Query**
3. Kopiere den Inhalt von `supabase/security-fixes.sql` und füge ihn ein
4. Klicke auf **Run**
5. Prüfe die Ausgabe — alle Tabellen sollten `rowsecurity = true` zeigen

---

## Teil 2: Dashboard-Einstellungen

### 2.1 Leaked Password Protection
> Dashboard → **Authentication** → **Attack Protection**

- Aktiviere **"Enable Leaked Password Protection"**
- Dies prüft bei Registrierung/Passwortänderung, ob das Passwort in bekannten Datenlecks vorkommt

> **Hinweis:** Da HRHellbeck eigene Auth über NextAuth/Prisma nutzt (nicht Supabase Auth),
> betrifft dies nur eventuelle direkte Supabase Auth-Nutzung. Trotzdem empfohlen zu aktivieren.

### 2.2 Enable Email Confirmation
> Dashboard → **Authentication** → **Auth Providers** → **Email**

- Stelle sicher, dass **"Confirm Email"** aktiviert ist
- Betrifft nur Supabase Auth (nicht deine NextAuth-Implementierung)

### 2.3 Network Restrictions
> Dashboard → **Settings** → **Database** → **Network Restrictions**

- Füge nur die IPs hinzu, die Zugriff brauchen:
  - Dein Vercel/Hosting-Provider IP-Range
  - Deine Entwicklungs-IP (für lokale Entwicklung)
- **Achtung:** Bei dynamischen IPs (z.B. Vercel Serverless) ggf. schwierig

### 2.4 PITR (Point-in-Time Recovery)
> Dashboard → **Settings** → **Database** → **Backups**

- PITR aktivieren (erfordert mindestens **Pro Plan**)
- Ermöglicht Wiederherstellung zu jedem Zeitpunkt

### 2.5 MFA (Multi-Factor Authentication) für Dashboard
> Dashboard → **Account** (oben rechts) → **Security**

- Aktiviere MFA/2FA für deinen Supabase-Account
- Schützt das Dashboard vor unbefugtem Zugriff

---

## Verifizierung

Nach allen Fixes:
1. Gehe zu Dashboard → **Advisors** → **Security**
2. Klicke auf **"Rerun checks"**
3. Die Fehleranzahl sollte auf 0 sinken

---

## Hinweise

- **Prisma wird NICHT beeinträchtigt** — die `postgres`-Rolle umgeht RLS
- **Supabase API ist gesperrt** — Tabellen sind nicht über `supabase.from('User')` erreichbar
- Falls du später Supabase Client SDK nutzen willst, musst du die Policies anpassen
