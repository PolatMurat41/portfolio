-- Idempotent for the same reason as 20261006120000_chatbot_contact_i18n:
-- production creates this table at runtime (src/lib/schema-sync.ts), where
-- it is also seeded with a first note.

-- CreateTable
CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Note_pinned_updatedAt_idx" ON "Note"("pinned", "updatedAt");
