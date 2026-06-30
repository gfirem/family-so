import { Card, SectionTitle, EmptyState } from "@/components/ui";
import { getPartners } from "@/lib/session";
import {
  getHabits,
  getDoneMap,
  currentStreak,
  longestStreak,
  completionRate,
  isNonNegotiable,
} from "@/lib/habits";

export default async function StreaksPage({
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
    getDoneMap(selected.id, 120),
  ]);

  if (habits.length === 0) {
    return (
      <EmptyState
        text={`${selected.name} todavía no tiene hábitos.`}
        cta={{ href: `/habits/manage?p=${selected.id}`, label: "Gestionar hábitos" }}
      />
    );
  }

  const rows = habits.map((h) => {
    const set = doneMap.get(h.id) ?? new Set<string>();
    return {
      habit: h,
      current: currentStreak(set, today),
      longest: longestStreak(set),
      rate30: completionRate(set, h.daysOfWeek, 30, today).pct,
      nonNegotiable: isNonNegotiable(set, today),
    };
  });

  const bestCurrent = Math.max(0, ...rows.map((r) => r.current));
  const atRisk = rows.filter((r) => r.nonNegotiable);

  return (
    <>
      {/* Headline numbers */}
      <div className="mb-5 grid grid-cols-3 gap-3 text-center">
        <Stat n={bestCurrent} label="Mejor racha activa" />
        <Stat n={Math.max(0, ...rows.map((r) => r.longest))} label="Racha récord" />
        <Stat
          n={rows.length ? Math.round(rows.reduce((a, r) => a + r.rate30, 0) / rows.length) : 0}
          label="% últimos 30 días"
          suffix="%"
        />
      </div>

      {atRisk.length > 0 && (
        <Card className="mb-5 border-[var(--color-danger)] bg-[#fdf1f0]">
          <p className="text-sm font-semibold text-[var(--color-danger)]">
            Hoy es innegociable en {atRisk.length} hábito{atRisk.length > 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-xs text-[var(--color-danger)]">
            Fallaste ayer. La regla es nunca fallar dos veces seguidas: hacé hoy aunque sea la
            versión mínima.
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {atRisk.map((r) => (
              <li
                key={r.habit.id}
                className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-danger)]"
              >
                {r.habit.name}
                {r.habit.tinyVersion ? ` · mínimo: ${r.habit.tinyVersion}` : ""}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <SectionTitle>Rachas por hábito</SectionTitle>
        <ul className="divide-y divide-[var(--color-line)]">
          {rows.map((r) => (
            <li key={r.habit.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <span className="truncate">{r.habit.name}</span>
                  {r.habit.isKeystone && <span className="pill-keystone">pilar</span>}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  Récord: {r.longest} días · {r.rate30}% últimos 30 días
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold">
                  {r.current > 0 ? `🔥 ${r.current}` : "—"}
                </p>
                <p className="text-[11px] text-[var(--color-muted)]">racha actual</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 text-xs text-[var(--color-muted)]">
        Un día fallido no rompe la racha; dos seguidos arrancan un mal hábito. Nunca falles dos
        veces (Atomic Habits, James Clear).
      </p>
    </>
  );
}

function Stat({ n, label, suffix = "" }: { n: number; label: string; suffix?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 shadow-sm">
      <p className="text-2xl font-bold">
        {n}
        {suffix}
      </p>
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
    </div>
  );
}
