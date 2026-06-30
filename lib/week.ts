import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { startOfWeek, addDays, isoDate } from "@/lib/dates";
import { getFamily } from "@/lib/family";

// Scopes a planning can have. "familia" is the shared/public one; the rest are
// private to the owner.
export type PlanningScope = "familia" | "personal" | "empresa";

export const PLANNING_SCOPES: { scope: PlanningScope; label: string; emoji: string; private: boolean }[] = [
  { scope: "familia", label: "Familia", emoji: "👨‍👩‍👧", private: false },
  { scope: "personal", label: "Personal", emoji: "🧍", private: true },
  { scope: "empresa", label: "Empresa", emoji: "💼", private: true },
];

const PLANNING_INCLUDE = {
  shoppingItems: true,
  activities: { orderBy: [{ day: "asc" }, { time: "asc" }] },
  events: true,
  mealPlan: { include: { days: true } },
  owner: true,
} satisfies Prisma.WeekInclude;

// Finds (and if missing, creates) a planning for a week, scope and owner.
// The family planning has ownerId = null; private ones are owned by a member.
export async function ensurePlanning(params: {
  weekOf: Date;
  scope: PlanningScope;
  ownerId: string | null;
}) {
  const { weekOf, scope, ownerId } = params;
  const family = await getFamily();

  const existing = await db.week.findFirst({
    where: { weekOf, scope, ownerId },
    include: PLANNING_INCLUDE,
  });
  if (existing) {
    // Backfill familyId on weeks created before families existed.
    if (!existing.familyId) {
      await db.week.update({ where: { id: existing.id }, data: { familyId: family.id } });
    }
    return existing;
  }

  const created = await db.week.create({
    data: { weekOf, scope, ownerId, familyId: family.id },
  });
  return db.week.findUniqueOrThrow({
    where: { id: created.id },
    include: PLANNING_INCLUDE,
  });
}

// The shared family planning for a given week (creating it if needed).
export async function ensureWeek(weekOf: Date) {
  return ensurePlanning({ weekOf, scope: "familia", ownerId: null });
}

// The current shared family planning — drives the dashboard, nutrition and chat.
export async function getCurrentWeek() {
  return ensureWeek(startOfWeek());
}

// Loads a planning by id, only if the user is allowed to see it:
// the shared family planning, or one they own. Returns null otherwise.
export async function getPlanningForUser(id: string, userId: string) {
  const planning = await db.week.findUnique({ where: { id }, include: PLANNING_INCLUDE });
  if (!planning) return null;
  const isShared = planning.scope === "familia" && planning.ownerId === null;
  const isOwn = planning.ownerId === userId;
  if (!isShared && !isOwn) return null;
  return planning;
}

// Existing plannings for a specific week that the user can see, with counts.
export async function visiblePlanningsForWeek(weekOf: Date, userId: string) {
  return db.week.findMany({
    where: {
      weekOf,
      OR: [
        { scope: "familia", ownerId: null },
        { ownerId: userId },
      ],
    },
    include: {
      _count: { select: { activities: true, shoppingItems: true, events: true } },
    },
  });
}

// Lightweight list of the weeks a user can see (shared family ones + their own
// private ones), most recent first. Used for the planning history / calendar.
export async function listVisibleWeeks(userId: string, take = 16) {
  return db.week.findMany({
    where: {
      OR: [
        { scope: "familia", ownerId: null },
        { ownerId: userId },
      ],
    },
    orderBy: { weekOf: "desc" },
    take,
    include: {
      _count: { select: { activities: true, shoppingItems: true, events: true } },
    },
  });
}

// % of habits completed per person in the given week.
export async function weekHabitStats(weekOf: Date) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekOf, i));
  const from = days[0];
  const to = addDays(weekOf, 7);

  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  const stats = [];
  for (const user of users) {
    const habitCount = await db.habit.count({
      where: { ownerId: user.id, active: true },
    });
    const doneCount = await db.habitLog.count({
      where: { ownerId: user.id, done: true, date: { gte: from, lt: to } },
    });
    const possible = habitCount * 7;
    stats.push({
      user,
      habitCount,
      doneCount,
      possible,
      pct: possible > 0 ? Math.round((doneCount / possible) * 100) : 0,
    });
  }
  return { days: days.map(isoDate), stats };
}

// Last N weights per person, for the dashboard trend.
export async function recentWeights(limit = 8) {
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  const result = [];
  for (const user of users) {
    const logs = await db.weightLog.findMany({
      where: { ownerId: user.id },
      orderBy: { date: "desc" },
      take: limit,
    });
    result.push({ user, logs: logs.reverse() });
  }
  return result;
}
