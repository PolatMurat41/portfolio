import { prisma } from "@/lib/prisma";

// Production deploys run `prisma generate && next build` only — migrations
// are never applied there — so tables and columns added after the initial
// migration are created at runtime instead. Every statement is idempotent
// and mirrors prisma/migrations/20261006120000_chatbot_contact_i18n; keep
// the two in step when editing either. Prisma's raw executor uses prepared
// statements, so each statement has to be sent on its own.
const STATEMENTS = [
  `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT`,
  `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "summaryEn" TEXT`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "titleEn" TEXT`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT`,
  `ALTER TABLE "WorkExperience" ADD COLUMN IF NOT EXISTS "titleEn" TEXT`,
  `ALTER TABLE "WorkExperience" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT`,
  `ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "titleEn" TEXT`,
  `ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "summaryEn" TEXT`,
  `ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "contentEn" TEXT`,
  `CREATE TABLE IF NOT EXISTS "ChatbotSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'anthropic',
    "model" TEXT NOT NULL DEFAULT 'claude-opus-5-5',
    "apiKey" TEXT,
    "baseUrl" TEXT,
    "botName" TEXT NOT NULL DEFAULT 'AI Asistan',
    "systemPrompt" TEXT NOT NULL,
    "includeContext" BOOLEAN NOT NULL DEFAULT true,
    "effort" TEXT NOT NULL DEFAULT 'low',
    "temperature" DOUBLE PRECISION,
    "maxTokens" INTEGER NOT NULL DEFAULT 8192,
    "welcomeMessage" TEXT NOT NULL,
    "welcomeMessageEn" TEXT,
    "suggestions" TEXT[],
    "suggestionsEn" TEXT[],
    "rateLimitPerHour" INTEGER NOT NULL DEFAULT 30,
    "dailyLimit" INTEGER NOT NULL DEFAULT 500,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChatbotSettings_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ChatConversation" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'tr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "ChatConversation_ipHash_idx" ON "ChatConversation"("ipHash")`,
  `CREATE INDEX IF NOT EXISTS "ChatConversation_updatedAt_idx" ON "ChatConversation"("updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ContactMessage_ipHash_createdAt_idx" ON "ContactMessage"("ipHash", "createdAt")`,
];

let schemaEnsured: Promise<void> | null = null;

async function runStatements() {
  for (const statement of STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (e) {
      console.error("Schema sync failed on statement:", statement, e);
    }
  }
}

// Shared across concurrent callers so a cold start runs the statements once.
export function ensureSchema(): Promise<void> {
  if (!schemaEnsured) schemaEnsured = runStatements();
  return schemaEnsured;
}
