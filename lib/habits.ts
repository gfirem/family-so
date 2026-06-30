// Shared habit queries and the science-backed metrics the section is built on.
//
// The numbers here map to specific findings so the UI can cite them:
//  - AUTOMATION_TARGET (66 days): Lally et al. 2010 measured a ~66-day average
//    (range 18–254) for a behaviour to become automatic. A single missed day
//    does not reset that progress, which is why streaks and automaticity are
//    forgiving of one miss.
//  - "Never miss twice" (Atomic Habits): missing once is an accident; missing
//    twice starts a new (bad) habit — so we flag the second day as non-negotiable.

import { db } from "@/lib/db";
import { addDays, isoDate } from "@/lib/dates";

// Lally et al. (2010): ~66 days on average to reach automaticity.
export const AUTOMATION_TARGET = 66;

// App-wide weekday index: 0=Mon .. 6=Sun (matches DAY_SHORT and startOfWeek).
export function weekdayIndex(d: Date): number {
  const day = d.getUTCDay(); // 0=Sun .. 6=Sat
  return day === 0 ? 6 : day - 1;
}

export const WEEKDAY_RRULE = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;

export async function getHabits(ownerId: string) {
  return db.habit.findMany({
    where: { ownerId, active: true },
    orderBy: [{ isKeystone: "desc" }, { order: "asc" }],
    include: { schedule: true },
  });
}

export async function getSchedules(ownerId: string) {
  return db.habitSchedule.findMany({
    where: { ownerId },
    orderBy: [{ order: "asc" }, { atTime: "asc" }],
  });
}

// Map<habitId, Set<isoDate>> of completed days within the last `days` days.
export async function getDoneMap(ownerId: string, days = 400): Promise<Map<string, Set<string>>> {
  const since = addDays(new Date(), -days);
  const logs = await db.habitLog.findMany({
    where: { ownerId, done: true, date: { gte: since } },
    select: { habitId: true, date: true },
  });
  const map = new Map<string, Set<string>>();
  for (const l of logs) {
    if (!map.has(l.habitId)) map.set(l.habitId, new Set());
    map.get(l.habitId)!.add(isoDate(l.date));
  }
  return map;
}

// A habit is scheduled on a day if it has no day restriction (every day) or the
// weekday is in its list. Mirrors the flexible frequency from apps like Streaks.
export function isScheduledOn(daysOfWeek: number[], d: Date): boolean {
  if (!daysOfWeek || daysOfWeek.length === 0) return true;
  return daysOfWeek.includes(weekdayIndex(d));
}

// Current streak counting back from today. One missed day does not break it
// (we start at yesterday when today is not done yet), matching Lally's finding.
export function currentStreak(done: Set<string>, today: Date = new Date()): number {
  let n = 0;
  let cursor = done.has(isoDate(today)) ? new Date(today) : addDays(today, -1);
  while (done.has(isoDate(cursor))) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

// Longest run of consecutive completed calendar days ever recorded.
export function longestStreak(done: Set<string>): number {
  if (done.size === 0) return 0;
  const sorted = [...done].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00Z`).getTime();
    const cur = new Date(`${sorted[i]}T00:00:00Z`).getTime();
    const diffDays = Math.round((cur - prev) / 86_400_000);
    run = diffDays === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

// Completion rate over a window, counting only the days the habit was scheduled.
export function completionRate(
  done: Set<string>,
  daysOfWeek: number[],
  windowDays: number,
  today: Date = new Date(),
): { scheduled: number; completed: number; pct: number } {
  let scheduled = 0;
  let completed = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = addDays(today, -i);
    if (!isScheduledOn(daysOfWeek, d)) continue;
    scheduled++;
    if (done.has(isoDate(d))) completed++;
  }
  return { scheduled, completed, pct: scheduled ? Math.round((completed / scheduled) * 100) : 0 };
}

// "Today is non-negotiable": missed yesterday AND not done yet today.
// Atomic Habits' "never miss twice".
export function isNonNegotiable(done: Set<string>, today: Date = new Date()): boolean {
  const missedYesterday = !done.has(isoDate(addDays(today, -1)));
  const notDoneToday = !done.has(isoDate(today));
  return missedYesterday && notDoneToday;
}

// Progress toward automaticity. Total completed days is a forgiving proxy: one
// miss does not erase progress (Lally), capped at the 66-day target.
export function automationProgress(done: Set<string>): {
  total: number;
  target: number;
  pct: number;
  reached: boolean;
} {
  const total = done.size;
  const pct = Math.min(100, Math.round((total / AUTOMATION_TARGET) * 100));
  return { total, target: AUTOMATION_TARGET, pct, reached: total >= AUTOMATION_TARGET };
}
