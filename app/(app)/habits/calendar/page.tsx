import { Card, SectionTitle, EmptyState } from "@/components/ui";
import { HabitCheck } from "../HabitCheck";
import { getPartners } from "@/lib/session";
import { startOfWeek, addDays, isoDate, DAY_SHORT } from "@/lib/dates";
import {
  getHabits,
  getDoneMap,
  automationProgress,
  currentStreak,
  AUTOMATION_TARGET,
} from "@/lib/habits";

const WEEKS = 26; // ~6 months of history in the heatmap (kept mobile-friendly).

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const users = await getPartners();
  const selected = users.find((u) => u.id === p) ?? users[0];

  const today = new Date();
  const todayIso = isoDate(today);
  const weekOf = startOfWeek();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekOf, i));

  const [habits, doneMap] = await Promise.all([
    getHabits(selected.id),
    getDoneMap(selected.id, WEEKS * 7 + 7),
  ]);

  // Heatmap columns start on the Monday WEEKS-1 weeks ago.
  const heatStart = addDays(weekOf, -(WEEKS - 1) * 7);

  if (habits.length === 0) {
    return (
      <EmptyState
        text={`${selected.name} todavía no tiene hábitos.`}
        cta={{ href: `/habits/manage?p=${selected.id}`, label: "Gestionar hábitos" }}
      />
    );
  }

  return (
    <>
      {/* Editable current week — quick fix for a day you forgot to check. */}
      <Card className="mb-5 overflow-x-auto">
        <SectionTitle>Esta semana</SectionTitle>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-1/2" />
              {weekDays.map((d, i) => (
                <th key={i} className="px-1 pb-2 text-xs font-medium text-[var(--color-muted)]">
                  {DAY_SHORT[i]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => {
              const set = doneMap.get(h.id) ?? new Set<string>();
              return (
                <tr key={h.id} className="border-t border-[var(--color-line)]">
                  <td className="py-2 pr-2 align-top">
                    <span className={`text-sm ${h.isKeystone ? "font-semibold" : ""}`}>{h.name}</span>
                  </td>
                  {weekDays.map((d, i) => (
                    <td key={i} className="px-0.5 py-1 text-center">
                      <div className="flex justify-center">
                        <HabitCheck
                          habitId={h.id}
                          ownerId={selected.id}
                          date={isoDate(d)}
                          done={set.has(isoDate(d))}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Per-habit heatmap + automaticity progress (Lally: ~66 days). */}
      <div className="space-y-4">
        {habits.map((h) => {
          const set = doneMap.get(h.id) ?? new Set<string>();
          const auto = automationProgress(set);
          const streak = currentStreak(set, today);
          return (
            <Card key={h.id}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    {h.name}
                    {h.isKeystone && <span className="pill-keystone">pilar</span>}
                  </p>
                  {streak > 0 && (
                    <p className="text-xs text-[var(--color-muted)]">🔥 {streak} días seguidos</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">
                    {auto.total}
                    <span className="font-normal text-[var(--color-muted)]">/{auto.target}</span>
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)]">hacia el automatismo</p>
                </div>
              </div>

              {/* Automaticity bar */}
              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                <div
                  className={`h-full rounded-full ${auto.reached ? "bg-[var(--color-brand-600)]" : "bg-[var(--color-brand-400)]"}`}
                  style={{ width: `${auto.pct}%` }}
                />
              </div>

              {/* Heatmap: columns = weeks, rows = weekdays (Mon→Sun). */}
              <div className="overflow-x-auto">
                <div className="flex gap-[3px]">
                  {Array.from({ length: WEEKS }, (_, w) => (
                    <div key={w} className="flex flex-col gap-[3px]">
                      {Array.from({ length: 7 }, (_, d) => {
                        const date = addDays(heatStart, w * 7 + d);
                        const iso = isoDate(date);
                        const future = iso > todayIso;
                        const done = set.has(iso);
                        return (
                          <div
                            key={d}
                            title={iso}
                            className={`h-2.5 w-2.5 rounded-[2px] ${
                              future
                                ? "bg-transparent"
                                : done
                                  ? "bg-[var(--color-brand-500)]"
                                  : "bg-[var(--color-line)]"
                            }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-[var(--color-muted)]">
        La barra mide los días cumplidos hacia los ~{AUTOMATION_TARGET} días que, en promedio, tarda
        un hábito en volverse automático (Lally et al., 2010). Un día suelto no borra el progreso.
      </p>
    </>
  );
}
