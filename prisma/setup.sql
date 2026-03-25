-- ============================================
-- Hellbeck HR Portal — Datenbank-Setup
-- Führe dieses SQL im Supabase SQL Editor aus:
-- Supabase Dashboard → SQL Editor → New Query → Einfügen → Run
-- ============================================

-- ============================================
-- 1. TABELLEN ERSTELLEN
-- ============================================

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT 'Ohne Abteilung',
    "role" TEXT NOT NULL DEFAULT 'benutzer',
    "phone" TEXT NOT NULL DEFAULT '',
    "street" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "zipCode" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT 'Deutschland',
    "birthDate" TEXT NOT NULL DEFAULT '',
    "startDate" TEXT NOT NULL DEFAULT '',
    "managerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalVacationDays" INTEGER NOT NULL DEFAULT 30,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headId" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-700 border-gray-200',
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VacationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'urlaub',
    "status" TEXT NOT NULL DEFAULT 'ausstehend',
    "reason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VacationRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VacationCancelRequest" (
    "id" TEXT NOT NULL,
    "vacationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ausstehend',
    "decidedBy" TEXT,
    "decidedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VacationCancelRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ShiftEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "note" TEXT,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "ShiftEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "likes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DisruptionReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'offen',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DisruptionReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HandoverProtocol" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "shiftDate" TEXT NOT NULL,
    "shiftType" TEXT NOT NULL,
    "machineStatus" TEXT NOT NULL,
    "openTasks" TEXT NOT NULL,
    "incidents" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HandoverProtocol_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- 2. UNIQUE INDEXES
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Department_name_key" ON "Department"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX IF NOT EXISTS "ChatMessage_senderId_receiverId_idx" ON "ChatMessage"("senderId", "receiverId");

-- ============================================
-- 3. FOREIGN KEYS
-- ============================================

DO $$ BEGIN
  ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "VacationRequest" ADD CONSTRAINT "VacationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "VacationCancelRequest" ADD CONSTRAINT "VacationCancelRequest_vacationId_fkey" FOREIGN KEY ("vacationId") REFERENCES "VacationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "VacationCancelRequest" ADD CONSTRAINT "VacationCancelRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ShiftEntry" ADD CONSTRAINT "ShiftEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ShiftEntry" ADD CONSTRAINT "ShiftEntry_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DisruptionReport" ADD CONSTRAINT "DisruptionReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DisruptionReport" ADD CONSTRAINT "DisruptionReport_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "HandoverProtocol" ADD CONSTRAINT "HandoverProtocol_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 4. ADMIN-USER ERSTELLEN
-- Passwort: Admin123!
-- (bcrypt hash von "Admin123!")
-- ============================================

INSERT INTO "User" ("id", "email", "firstName", "lastName", "position", "department", "role", "phone", "street", "city", "zipCode", "country", "birthDate", "startDate", "isActive", "totalVacationDays", "passwordHash", "name")
VALUES (
  'admin-001',
  'p.sagemueller@hellbeck.info',
  'Patrick',
  'Sagemüller',
  'HR-Administrator',
  'HR',
  'admin',
  '',
  '',
  '',
  '',
  'Deutschland',
  '',
  '2024-01-01',
  true,
  30,
  '$2b$10$wNCe3z.fYH3a.GczsBY3NOuP52GBBO.xVAu6CbomQB5ZPGvBOom9S',
  'Patrick Sagemüller'
)
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- 5. HR ABTEILUNG ERSTELLEN
-- ============================================

INSERT INTO "Department" ("id", "name", "headId", "color")
VALUES (
  'dept-hr',
  'HR',
  'admin-001',
  'bg-blue-100 text-blue-700 border-blue-200'
)
ON CONFLICT ("name") DO NOTHING;

-- ============================================
-- FERTIG! Jetzt in Vercel:
-- 1. NEXT_PUBLIC_MOCK_AUTH = false
-- 2. Redeploy
-- ============================================
