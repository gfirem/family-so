-- Habits redesign: time-of-day schedules + science-backed habit fields.
-- All changes are additive (new nullable/defaulted columns + a new table), so
-- existing rows and the previous app version keep working unchanged.

-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "calendarEventId" TEXT,
ADD COLUMN     "cue" TEXT,
ADD COLUMN     "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "reminderAt" TEXT,
ADD COLUMN     "scheduleId" TEXT,
ADD COLUMN     "tinyVersion" TEXT;

-- CreateTable
CREATE TABLE "HabitSchedule" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🕒',
    "atTime" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HabitSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HabitSchedule_ownerId_order_idx" ON "HabitSchedule"("ownerId", "order");

-- CreateIndex
CREATE INDEX "Habit_scheduleId_idx" ON "Habit"("scheduleId");

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "HabitSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitSchedule" ADD CONSTRAINT "HabitSchedule_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
