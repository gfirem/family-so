-- Make the daily meal plan flexible: 4 optional intakes (comida 1..4), each able
-- to hold any recipe (licuado or comida). Replaces the fixed "shake + meal1 +
-- meal2" layout. Written idempotently so a re-run after a failed deploy (P3009)
-- recovers cleanly.

-- 1) Add the two new slot columns.
ALTER TABLE "MealPlanDay" ADD COLUMN IF NOT EXISTS "meal3Id" TEXT;
ALTER TABLE "MealPlanDay" ADD COLUMN IF NOT EXISTS "meal4Id" TEXT;

-- 2) Shift existing data and drop the legacy "shakeId" column — only while it
--    still exists, so re-running this migration never shifts the data twice.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'MealPlanDay' AND column_name = 'shakeId'
  ) THEN
    -- licuado -> comida 1, comida 1 -> comida 2, comida 2 -> comida 3.
    -- Postgres evaluates every right-hand side against the pre-UPDATE row,
    -- so this performs a clean one-shot shift.
    UPDATE "MealPlanDay"
      SET "meal3Id" = "meal2Id",
          "meal2Id" = "meal1Id",
          "meal1Id" = "shakeId";

    ALTER TABLE "MealPlanDay" DROP CONSTRAINT IF EXISTS "MealPlanDay_shakeId_fkey";
    ALTER TABLE "MealPlanDay" DROP COLUMN "shakeId";
  END IF;
END $$;

-- 3) Foreign keys for the new slots (drop-then-add keeps this idempotent).
ALTER TABLE "MealPlanDay" DROP CONSTRAINT IF EXISTS "MealPlanDay_meal3Id_fkey";
ALTER TABLE "MealPlanDay" ADD CONSTRAINT "MealPlanDay_meal3Id_fkey" FOREIGN KEY ("meal3Id") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MealPlanDay" DROP CONSTRAINT IF EXISTS "MealPlanDay_meal4Id_fkey";
ALTER TABLE "MealPlanDay" ADD CONSTRAINT "MealPlanDay_meal4Id_fkey" FOREIGN KEY ("meal4Id") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
