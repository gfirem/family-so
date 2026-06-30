import Link from "next/link";
import { Card, SectionTitle, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/actions-ui";
import { HabitToggle } from "./HabitToggle";
import { db } from "@/lib/db";
import { getPartners } from "@/lib/session";
import { isoDate } from "@/lib/dates";
import {
  getHabits,
  getSchedules,
  getDoneMap,
  isScheduledOn,
  currentStreak,
  isNonNegotiable,
} from "@/lib/habits";
import { addWeight } from "./actions";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const users = await getPartners();
  const selected = users.find((u) => u.id === p) ?? users[0];

  const today = new Date();
  const todayIso = isoDate(today);

  const [habits, schedules, doneMap] = await Promise.all([
    getHabits(selected.id),
    getSchedules(selected.id),
    getDoneMap(selected.id, 90),
  ]);

  // Only the habits scheduled for today (empty daysOfWeek = every day).
  const todays = habits.filter((h) => isScheduledOn(h.daysOfWeek, today));
  const doneCount = todays.filter((h) => (doneMap.get(h.id) ?? new Set()).has(todayIso)).length;

  // Group by schedule, preserving schedule order; ungrouped habits go last.
  const groups: { key: string; emoji: string; name: string; atTime?: string | null; items: typeof todays }[] =
    schedules.map((s) => ({
      key: s.id,
      emoji: s.emoji,
      name: s.name,
      atTime: s.atTime,
      items: todays.filter((h) => h.scheduleId === s.id),
    }));
  const ungrouped = todays.filter((h) => !h.scheduleId || !schedules.some((s) => s.id === h.scheduleId));
  if (ungrouped.length > 0) {
    groups.push({ key: "none", emoji: "📌", name: "Sin horario", atTime: null, items: ungrouped });
  }
  const visibleGroups = groups.filter((g) => g.items.length > 0);

  const weights = await db.weightLog.findMany({
    where: { ownerId: selected.id },
    orderBy: { date: "desc" },
    take: 6,
  });

  let cheerCounter = 0;

  return (
    <>
      {/* Identity anchor — identity-based habits: each check is a vote. */}
      <Card className="mb-5 bg-[var(--color-brand-50)]">
        <p className="text-sm font-medium text-[var(--color-brand-700)]">
          Somos personas que duermen bien, entrenan y comen para estar fuertes — listos para ser
          papás. Cada marca de hoy es un voto por esa persona.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-[var(--color-brand-700)]">
            Hoy: {doneCount}/{todays.length} votos
          </span>
          <Link href="/goals" className="text-sm font-semibold text-[var(--color-brand-700)]">
            Ver nuestras metas →
          </Link>
        </div>
      </Card>

      {todays.length === 0 ? (
        <EmptyState
          text={`${selected.name} no tiene hábitos para hoy. Creá los primeros y organizalos por momento del día.`}
          cta={{ href: `/habits/manage?p=${selected.id}`, label: "Gestionar hábitos" }}
        />
      ) : (
        <div className="space-y-5">
          {visibleGroups.map((g) => (
            <Card key={g.key}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <span aria-hidden>{g.emoji}</span>
                  {g.name}
                </h2>
                {g.atTime && (
                  <span className="text-xs text-[var(--color-muted)]">{g.atTime}</span>
                )}
              </div>
              <ul className="space-y-3">
                {g.items.map((h) => {
                  const set = doneMap.get(h.id) ?? new Set<string>();
                  const isDone = set.has(todayIso);
                  const streak = currentStreak(set, today);
                  const nonNegotiable = isNonNegotiable(set, today);
                  return (
                    <li key={h.id} className="flex items-start gap-3">
                      <HabitToggle
                        habitId={h.id}
                        ownerId={selected.id}
                        date={todayIso}
                        done={isDone}
                        cheerIndex={cheerCounter++}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-sm ${h.isKeystone ? "font-semibold" : "font-medium"} ${
                              isDone ? "text-[var(--color-muted)] line-through" : ""
                            }`}
                          >
                            {h.name}
                          </span>
                          {h.isKeystone && <span className="pill-keystone">pilar</span>}
                        </div>
                        {h.tinyVersion && (
                          <p className="text-xs text-[var(--color-muted)]">
                            Mínimo: {h.tinyVersion}
                          </p>
                        )}
                        {h.cue && (
                          <p className="text-xs italic text-[var(--color-muted)]">“{h.cue}”</p>
                        )}
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--color-muted)]">
                          {streak > 0 && <span>🔥 {streak} días</span>}
                          {h.reminderAt && <span>🔔 {h.reminderAt}</span>}
                          {h.calendarEventId && <span>📅 en Calendar</span>}
                          {nonNegotiable && (
                            <span className="font-semibold text-[var(--color-danger)]">
                              ¡Hoy es innegociable!
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {/* Compact weight log — kept handy for the daily/weekly check-in. */}
      <Card className="mt-5">
        <SectionTitle>Peso de {selected.name}</SectionTitle>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            {weights[0] ? (
              <p className="text-3xl font-bold">
                {weights[0].weightKg}
                <span className="ml-1 text-base font-normal text-[var(--color-muted)]">kg</span>
              </p>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">Sin registro</p>
            )}
          </div>
          <ul className="flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
            {weights.slice(1).map((w) => (
              <li key={w.id} className="chip">
                {isoDate(w.date)}: {w.weightKg} kg
              </li>
            ))}
          </ul>
        </div>
        <form action={addWeight} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="ownerId" value={selected.id} />
          <input
            name="weightKg"
            type="number"
            step="0.1"
            placeholder="Peso (kg)"
            className="input w-32"
            required
          />
          <input name="date" type="date" className="input w-40" defaultValue={todayIso} />
          <SubmitButton className="btn-ghost">Registrar peso</SubmitButton>
        </form>
      </Card>
    </>
  );
}
