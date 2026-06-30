-- Data migration: give every existing person the three default moments
-- (Mañana / Mediodía / Noche) and place their current habits into one of them.
-- Organising habits by moment is the contextual cue behind habit stacking and
-- implementation intentions — the strongest lever in the habit-formation
-- literature. Runs once; new people get their schedules from the seed or the
-- "Gestionar" screen.

-- 1) Create the three default schedules for any user that has none yet.
INSERT INTO "HabitSchedule" ("id", "ownerId", "name", "emoji", "atTime", "order")
SELECT gen_random_uuid()::text, u."id", v.name, v.emoji, v.attime, v.ord
FROM "User" u
CROSS JOIN (VALUES
  ('Mañana',   '🌅', '07:30', 0),
  ('Mediodía', '☀️', '13:00', 1),
  ('Noche',    '🌙', '21:00', 2)
) AS v(name, emoji, attime, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM "HabitSchedule" s WHERE s."ownerId" = u."id"
);

-- 2) Place existing unscheduled habits into a moment by keyword.
UPDATE "Habit" h
SET "scheduleId" = s."id"
FROM "HabitSchedule" s
WHERE s."ownerId" = h."ownerId"
  AND h."scheduleId" IS NULL
  AND (
    (s."name" = 'Noche' AND (
      h."name" ILIKE '%dorm%' OR h."name" ILIKE '%10-3-2-1-0%' OR
      h."name" ILIKE '%alcohol%' OR h."name" ILIKE '%ventana%' OR
      h."name" ILIKE '%estudi%' OR h."name" ILIKE '%basura%' OR
      h."name" ILIKE '%familia%'
    ))
    OR (s."name" = 'Mañana' AND (
      h."name" ILIKE '%entren%' OR h."name" ILIKE '%pastilla%' OR
      h."name" ILIKE '%licuado%' OR h."name" ILIKE '%perro%'
    ))
    OR (s."name" = 'Mediodía' AND (
      h."name" ILIKE '%azúcar%' OR h."name" ILIKE '%azucar%' OR
      h."name" ILIKE '%chatarra%' OR h."name" ILIKE '%aspir%' OR
      h."name" ILIKE '%cant%'
    ))
  );

-- 3) Anything still unmatched goes to Mediodía — a sensible default the couple
--    can reorganise from the "Gestionar" screen.
UPDATE "Habit" h
SET "scheduleId" = s."id"
FROM "HabitSchedule" s
WHERE s."ownerId" = h."ownerId"
  AND s."name" = 'Mediodía'
  AND h."scheduleId" IS NULL
  AND h."active" = true;
