import { Card, SectionTitle, EmptyState } from "@/components/ui";
import { getPartners } from "@/lib/session";
import { startOfWeek, addDays, isoDate, DAY_SHORT } from "@/lib/dates";
import { getHabits, getDoneMap, isScheduledOn, completionRate } from "@/lib/habits";

const WEEKS = 8;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const users = await getPartners();
  const selected = users.find((u) => u.id === p) ?? users[0];

  const today = new Date();
  const [habits, doneMap] = await Promise.all([
    getHabits(selected.id),
    getDoneMap(selected.id, WEEKS * 7 + 7),
  ]);

  if (habits.length === 0) {
    return (
      <EmptyState
        text={`${selected.name} todavía no tiene hábitos.`}
        cta={{ href: `/habits/manage?p=${selected.id}`, label: "Gestionar hábitos" }}
      />
    );
  }

  const setOf = (id: string) => doneMap.get(id) ?? new Set<string>();

  // Weekly completion % over the last WEEKS weeks (scheduled days only).
  const thisWeek = startOfWeek();
  const weekly = Array.from({ length: WEEKS }, (_, i) => {
    const wStart = addDays(thisWeek, -(WEEKS - 1 - i) * 7);
    let scheduled = 0;
    let completed = 0;
    for (let d = 0; d < 7; d++) {
      const day = addDays(wStart, d);
      if (day > today) continue;
      const iso = isoDate(day);
      for (const h of habits) {
        if (!isScheduledOn(h.daysOfWeek, day)) continue;
        scheduled++;
        if (setOf(h.id).has(iso)) completed++;
      }
    }
    return {
      label: `${wStart.getUTCDate()}/${wStart.getUTCMonth() + 1}`,
      pct: scheduled ? Math.round((completed / scheduled) * 100) : 0,
    };
  });

  // Per-habit 30-day rate → best and the one to refocus.
  const ranked = habits
    .map((h) => ({ habit: h, pct: completionRate(setOf(h.id), h.daysOfWeek, 30, today).pct }))
    .sort((a, b) => b.pct - a.pct);
  const best = ranked[0];
  const refocus = ranked[ranked.length - 1];

  // Keystone vs the rest — keystone habits should pull the others along.
  const avg = (list: typeof ranked) =>
    list.length ? Math.round(list.reduce((a, r) => a + r.pct, 0) / list.length) : 0;
  const keystoneAvg = avg(ranked.filter((r) => r.habit.isKeystone));
  const restAvg = avg(ranked.filter((r) => !r.habit.isKeystone));
  const hasKeystone = ranked.some((r) => r.habit.isKeystone);

  // Strongest / weakest weekday across the window.
  const dow = Array.from({ length: 7 }, () => ({ scheduled: 0, completed: 0 }));
  for (let i = 0; i < WEEKS * 7; i++) {
    const day = addDays(today, -i);
    const idx = (day.getUTCDay() + 6) % 7; // 0=Mon..6=Sun
    const iso = isoDate(day);
    for (const h of habits) {
      if (!isScheduledOn(h.daysOfWeek, day)) continue;
      dow[idx].scheduled++;
      if (setOf(h.id).has(iso)) dow[idx].completed++;
    }
  }
  const dowPct = dow.map((d) => (d.scheduled ? Math.round((d.completed / d.scheduled) * 100) : 0));

  return (
    <>
      {/* Weekly trend */}
      <Card className="mb-5">
        <SectionTitle>Cumplimiento por semana</SectionTitle>
        <div className="flex items-end justify-between gap-1.5" style={{ height: 120 }}>
          {weekly.map((w, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] text-[var(--color-muted)]">{w.pct}%</span>
              <div
                className="w-full rounded-t-md bg-[var(--color-brand-500)]"
                style={{ height: `${Math.max(4, w.pct)}%` }}
                title={`${w.pct}%`}
              />
              <span className="text-[10px] text-[var(--color-muted)]">{w.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Best & refocus */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Card>
          <SectionTitle>Lo que mejor sostenés</SectionTitle>
          <p className="text-sm font-semibold">{best.habit.name}</p>
          <p className="text-2xl font-bold text-[var(--color-brand-600)]">{best.pct}%</p>
          <p className="text-xs text-[var(--color-muted)]">últimos 30 días</p>
        </Card>
        <Card>
          <SectionTitle>Para reenfocar</SectionTitle>
          <p className="text-sm font-semibold">{refocus.habit.name}</p>
          <p className="text-2xl font-bold text-[var(--color-warm-500)]">{refocus.pct}%</p>
          <p className="text-xs text-[var(--color-muted)]">
            {refocus.habit.tinyVersion
              ? `Bajá el listón: ${refocus.habit.tinyVersion}`
              : "Definí una versión mínima de 2 minutos para no romper la cadena."}
          </p>
        </Card>
      </div>

      {/* Keystone impact */}
      {hasKeystone && (
        <Card className="mb-5">
          <SectionTitle>Impacto de los pilares</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Bar label="Hábitos pilares" pct={keystoneAvg} strong />
            <Bar label="Resto de hábitos" pct={restAvg} />
          </div>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Los hábitos pilares (keystone) arrastran a los demás. Si los pilares suben, lo demás
            tiende a seguirlos.
          </p>
        </Card>
      )}

      {/* Day-of-week pattern */}
      <Card>
        <SectionTitle>Tu patrón por día</SectionTitle>
        <div className="flex items-end justify-between gap-1.5" style={{ height: 100 }}>
          {dowPct.map((pct, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t-md bg-[var(--color-brand-400)]"
                style={{ height: `${Math.max(4, pct)}%` }}
                title={`${pct}%`}
              />
              <span className="text-[10px] text-[var(--color-muted)]">{DAY_SHORT[i]}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Mirá qué días flojean: ahí conviene reforzar la señal (un recordatorio) o apilar el hábito
          sobre algo que ya hacés ese día.
        </p>
      </Card>
    </>
  );
}

function Bar({ label, pct, strong = false }: { label: string; pct: number; strong?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className={strong ? "font-semibold" : ""}>{label}</span>
        <span className="text-[var(--color-muted)]">{pct}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
        <div
          className={`h-full rounded-full ${strong ? "bg-[var(--color-brand-600)]" : "bg-[var(--color-brand-400)]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
