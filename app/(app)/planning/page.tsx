import Link from "next/link";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { SubmitButton } from "@/components/actions-ui";
import { requireUser } from "@/lib/session";
import {
  visiblePlanningsForWeek,
  listVisibleWeeks,
  PLANNING_SCOPES,
} from "@/lib/week";
import { parseWeekOf, isoDate, addDays, formatWeekRange } from "@/lib/dates";
import { createPlanning } from "./actions";

export default async function PlanningIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const me = await requireUser();
  const weekOf = parseWeekOf(week);
  const weekIso = isoDate(weekOf);
  const thisWeekIso = isoDate(parseWeekOf(undefined));
  const isCurrentWeek = weekIso === thisWeekIso;

  const plannings = await visiblePlanningsForWeek(weekOf, me.id);
  const history = await listVisibleWeeks(me.id);

  // Map each scope to the planning slot the current user would use.
  function slotFor(scope: string, isPrivate: boolean) {
    return plannings.find(
      (p) => p.scope === scope && (isPrivate ? p.ownerId === me.id : p.ownerId === null),
    );
  }

  // Group history by week (most recent first), keeping only the scopes present.
  const byWeek = new Map<string, typeof history>();
  for (const p of history) {
    const key = isoDate(p.weekOf);
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(p);
  }

  return (
    <>
      <PageHeader
        emoji="🗓️"
        title="Planning"
        subtitle="Planificá la semana: la de la familia (compartida) y las tuyas privadas."
      />

      {/* Week navigation */}
      <Card className="mb-5">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/planning?week=${isoDate(addDays(weekOf, -7))}`}
            className="btn-ghost"
            aria-label="Semana anterior"
          >
            ←
          </Link>
          <div className="text-center">
            <p className="font-semibold">Semana del {formatWeekRange(weekOf)}</p>
            {!isCurrentWeek && (
              <Link href="/planning" className="text-xs font-medium text-[var(--color-brand-700)]">
                Volver a esta semana
              </Link>
            )}
            {isCurrentWeek && (
              <p className="text-xs text-[var(--color-muted)]">Semana en curso</p>
            )}
          </div>
          <Link
            href={`/planning?week=${isoDate(addDays(weekOf, 7))}`}
            className="btn-ghost"
            aria-label="Semana siguiente"
          >
            →
          </Link>
        </div>
      </Card>

      {/* Planning slots for the selected week */}
      <div className="mb-6 space-y-3">
        {PLANNING_SCOPES.map((s) => {
          const slot = slotFor(s.scope, s.private);
          return (
            <Card key={s.scope}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 font-bold">
                    <span aria-hidden>{s.emoji}</span>
                    {s.label}
                    <span className="chip">{s.private ? "privada" : "pública"}</span>
                  </h2>
                  {slot ? (
                    <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                      {slot._count.activities} actividades · {slot._count.shoppingItems} compras ·{" "}
                      {slot._count.events} baches
                    </p>
                  ) : (
                    <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                      {s.private ? "Solo vos la ves." : "La ven y editan todos en la familia."}
                    </p>
                  )}
                </div>
                {slot ? (
                  <Link href={`/planning/${slot.id}`} className="btn-primary shrink-0">
                    Abrir →
                  </Link>
                ) : (
                  <form action={createPlanning} className="shrink-0">
                    <input type="hidden" name="scope" value={s.scope} />
                    <input type="hidden" name="weekOf" value={weekIso} />
                    <SubmitButton className="btn-ghost">Crear</SubmitButton>
                  </form>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* History / calendar of past weeks */}
      <Card>
        <SectionTitle>Semanas planificadas</SectionTitle>
        {byWeek.size === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Todavía no planificaste ninguna semana.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-line)]">
            {[...byWeek.entries()].map(([key, items]) => (
              <li key={key} className="flex items-center justify-between gap-3 py-2.5">
                <Link
                  href={`/planning?week=${key}`}
                  className={`text-sm font-medium ${
                    key === weekIso ? "text-[var(--color-brand-700)]" : ""
                  }`}
                >
                  Semana del {formatWeekRange(parseWeekOf(key))}
                  {key === thisWeekIso && " · en curso"}
                </Link>
                <div className="flex shrink-0 flex-wrap gap-1">
                  {items.map((p) => {
                    const def = PLANNING_SCOPES.find((s) => s.scope === p.scope);
                    return (
                      <Link key={p.id} href={`/planning/${p.id}`} className="chip">
                        {def?.emoji} {def?.label ?? p.scope}
                      </Link>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
