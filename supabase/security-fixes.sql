-- =============================================================
-- Supabase Security Fixes für HRHellbeck
-- =============================================================
-- Dieses Script im Supabase SQL Editor ausführen:
-- Dashboard → SQL Editor → New Query → Einfügen → Run
--
-- WICHTIG: Da die App über Prisma mit der `postgres`-Rolle
-- verbindet, umgeht sie RLS automatisch (Superuser).
-- RLS schützt aber gegen direkte API-Zugriffe über PostgREST.
-- =============================================================

-- 1) RLS auf allen Prisma-Tabellen aktivieren
-- -------------------------------------------------------------

ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- 2) Restriktive Policies: Kein Zugriff über Supabase API (anon/authenticated)
-- -------------------------------------------------------------
-- Da die App NUR über Prisma (postgres-Rolle) zugreift,
-- sperren wir den Zugriff über die Supabase API komplett.

-- User
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Deny all access via API') THEN
    CREATE POLICY "Deny all access via API" ON "User"
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- Account
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Account' AND policyname = 'Deny all access via API') THEN
    CREATE POLICY "Deny all access via API" ON "Account"
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- Session
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Session' AND policyname = 'Deny all access via API') THEN
    CREATE POLICY "Deny all access via API" ON "Session"
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- VerificationToken
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'VerificationToken' AND policyname = 'Deny all access via API') THEN
    CREATE POLICY "Deny all access via API" ON "VerificationToken"
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- PasswordResetToken
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'PasswordResetToken' AND policyname = 'Deny all access via API') THEN
    CREATE POLICY "Deny all access via API" ON "PasswordResetToken"
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- _prisma_migrations (interne Prisma-Tabelle)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '_prisma_migrations' AND policyname = 'Deny all access via API') THEN
    CREATE POLICY "Deny all access via API" ON "_prisma_migrations"
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- 3) Prüfen, dass alles korrekt ist
-- -------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
