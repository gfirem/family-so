-- Habits redesign: time-of-day schedules + science-backed habit fields.
-- All changes are additive (new nullable/defaulted columns + a new table), so
-- existing rows and the previous app version keep working unchanged.
--
-- Made idempotent (IF NOT EXISTS / guarded constraints) so it stays safe to
-- re-run if production deploys ever race again — the same failure mode that
-- left the preceding planning migration half-applied (P3009).

-- AlterTable
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "calendarEventId" TEXT,
ADD COLUMN IF NOT EXISTS "cue" TEXT,
ADD COLUMN IF NOT EXISTS "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN IF NOT EXISTS "reminderAt" TEXT,
ADD COLUMN IF NOT EXISTS "scheduleId" TEXT,
ADD COLUMN IF NOT EXISTS "tinyVersion" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "HabitSchedule" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🕒',
    "atTime" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HabitSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "HabitSchedule_ownerId_order_idx" ON "HabitSchedule"("ownerId", "order");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Habit_scheduleId_idx" ON "Habit"("scheduleId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Habit" ADD CONSTRAINT "Habit_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "HabitSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "HabitSchedule" ADD CONSTRAINT "HabitSchedule_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
