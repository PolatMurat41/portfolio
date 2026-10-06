-- Idempotent on purpose: production databases already received the *En
-- columns (and may already have these tables) from the runtime schema sync
-- in src/lib/schema-sync.ts, which runs the same statements. Keep the two
-- in step when editing either.

-- AlterTable (bilingual columns)
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "summaryEn" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "titleEn" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT;
ALTER TABLE "WorkExperience" ADD COLUMN IF NOT EXISTS "titleEn" TEXT;
ALTER TABLE "WorkExperience" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "titleEn" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "summaryEn" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "contentEn" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChatbotSettings" (
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
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChatConversation" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'tr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChatConversation_ipHash_idx" ON "ChatConversation"("ipHash");
CREATE INDEX IF NOT EXISTS "ChatConversation_updatedAt_idx" ON "ChatConversation"("updatedAt");
CREATE INDEX IF NOT EXISTS "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "ContactMessage_ipHash_createdAt_idx" ON "ContactMessage"("ipHash", "createdAt");
