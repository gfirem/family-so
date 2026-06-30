-- Planning: family/private plannings + Settings.
--
-- Made idempotent after this migration was recorded as failed in production
-- (P3009): several PRs merged to main at once each triggered a production
-- deploy, so multiple `prisma migrate deploy` runs raced on these statements.
-- The non-guarded original (`DROP INDEX`, `CREATE TABLE`, `ADD COLUMN`,
-- `ADD CONSTRAINT`) errored with "does not exist" / "already exists" on the
-- losing run. Every statement below is now safe to re-run, so applying this
-- migration again converges the schema whether the objects already exist,
-- partially exist, or are absent.

-- DropIndex
DROP INDEX IF EXISTS "Week_weekOf_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "familyId" TEXT;

-- AlterTable
ALTER TABLE "Week" ADD COLUMN IF NOT EXISTS "familyId" TEXT,
ADD COLUMN IF NOT EXISTS "ownerId" TEXT,
ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'familia';

-- CreateTable
CREATE TABLE IF NOT EXISTS "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Mi familia',
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Week_weekOf_idx" ON "Week"("weekOf");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Week_ownerId_scope_idx" ON "Week"("ownerId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Week_familyId_ownerId_scope_weekOf_key" ON "Week"("familyId", "ownerId", "scope", "weekOf");

-- AddForeignKey
-- `ADD CONSTRAINT` has no IF NOT EXISTS, so guard each one and ignore a
-- pre-existing constraint from a prior partial apply.
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Week" ADD CONSTRAINT "Week_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Week" ADD CONSTRAINT "Week_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
