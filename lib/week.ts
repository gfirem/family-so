import { db } from "@/lib/db";
import { startOfWeek, addDays, isoDate } from "@/lib/dates";

// Crea (si no existe) y devuelve la semana de una fecha, con todo lo que cuelga.
export async function ensureWeek(weekOf: Date) {
  const existing = await db.week.findUnique({
    where: { weekOf },
    include: {
      shoppingItems: true,
      activities: { orderBy: [{ day: "asc" }, { time: "asc" }] },
      events: true,
      mealPlan: { include: { days: true } },
    },
  });
  if (existing) return existing;

  await db.week.create({ data: { weekOf } });
  return ensureWeek(weekOf);
}

export async function getCurrentWeek() {
  return ensureWeek(startOfWeek());
}

// % de hábitos cumplidos por persona en la semana dada.
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

// Últimos N pesos por persona, para la tendencia del tablero.
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
