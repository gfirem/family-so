import Link from "next/link";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { ActionButton, SubmitButton } from "@/components/actions-ui";
import { db } from "@/lib/db";
import { quarterOf } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import type { GoalVisibility, Prisma } from "@prisma/client";
import { addGoal, markDone, reopen, deleteGoal, carryToNextQuarter, saveReview } from "./actions";

type Scope = GoalVisibility;
type View = "year" | "quarter";

function shiftQuarter(year: number, quarter: number, delta: number) {
  let q = quarter + delta;
  let y = year;
  while (q > 4) {
    q -= 4;
    y += 1;
  }
  while (q < 1) {
    q += 4;
    y -= 1;
  }
  return { year: y, quarter: q };
}

// Builds a /goals link preserving the current scope/view/period context.
function goalsHref(params: { scope: Scope; view: View; y: number; q?: number }) {
  const sp = new URLSearchParams({
    scope: params.scope,
    view: params.view,
    y: String(params.y),
  });
  if (params.view === "quarter" && params.q) sp.set("q", String(params.q));
  return `/goals?${sp.toString()}`;
}

export default async function MetasPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; view?: string; y?: string; q?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const now = quarterOf();

  const scope: Scope = sp.scope === "private" ? "private" : "family";
  const view: View = sp.view === "year" ? "year" : "quarter";
  const year = sp.y ? Number(sp.y) : now.year;
  const quarter = sp.q ? Number(sp.q) : now.quarter;

  // Private goals are scoped to the logged-in person; family goals are shared.
  const ownerFilter: Prisma.GoalWhereInput =
    scope === "private" ? { visibility: "private", ownerId: user.id } : { visibility: "family" };

  const pillars = await db.pillar.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  // The period this view is closing: a quarter, or the whole year.
  const reviewQuarter = view === "quarter" ? quarter : null;
  const review = await db.quarterReview.findFirst({
    where: {
      year,
      quarter: reviewQuarter,
      visibility: scope,
      ownerId: scope === "private" ? user.id : null,
    },
  });

  return (
    <>
      <PageHeader
        emoji="🎯"
        title="Metas"
        subtitle="Una meta sin trimestre que la empuje es un deseo. Revisá y ajustá cada trimestre."
      />

      {/* Scope + view toggles */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Toggle
          options={[
            { key: "family", label: "👨‍👩‍👧 Familiar", href: goalsHref({ scope: "family", view, y: year, q: quarter }) },
            { key: "private", label: "🔒 Personal", href: goalsHref({ scope: "private", view, y: year, q: quarter }) },
          ]}
          active={scope}
        />
        <Toggle
          options={[
            { key: "year", label: "Año", href: goalsHref({ scope, view: "year", y: year }) },
            { key: "quarter", label: "Trimestre", href: goalsHref({ scope, view: "quarter", y: year, q: quarter }) },
          ]}
          active={view}
        />
      </div>

      {scope === "private" && (
        <p className="mb-4 text-xs text-[var(--color-muted)]">
          🔒 Tus metas personales. Solo vos las ves; tu pareja no.
        </p>
      )}

      {view === "year" ? (
        <YearView
          scope={scope}
          year={year}
          ownerFilter={ownerFilter}
          pillars={pillars}
          review={review}
        />
      ) : (
        <QuarterView
          scope={scope}
          year={year}
          quarter={quarter}
          now={now}
          ownerFilter={ownerFilter}
          pillars={pillars}
          review={review}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

async function QuarterView({
  scope,
  year,
  quarter,
  now,
  ownerFilter,
  pillars,
  review,
}: {
  scope: Scope;
  year: number;
  quarter: number;
  now: { year: number; quarter: number };
  ownerFilter: Prisma.GoalWhereInput;
  pillars: { id: string; name: string }[];
  review: { wins: string | null; challenges: string | null; learnings: string | null; nextFocus: string | null } | null;
}) {
  const goals = await db.goal.findMany({
    where: { ...ownerFilter, year, quarter },
    include: { pillar: true },
    orderBy: { createdAt: "asc" },
  });

  const doneCount = goals.filter((g) => g.status === "done").length;
  const prev = shiftQuarter(year, quarter, -1);
  const next = shiftQuarter(year, quarter, 1);
  const isCurrent = year === now.year && quarter === now.quarter;

  return (
    <>
      {/* Quarter navigation */}
      <div className="mb-5 flex items-center justify-between">
        <Link href={goalsHref({ scope, view: "quarter", y: prev.year, q: prev.quarter })} className="btn-ghost">
          ← Q{prev.quarter} {prev.year}
        </Link>
        <div className="text-center">
          <p className="text-lg font-bold">
            Q{quarter} {year}
          </p>
          <p className="text-xs text-[var(--color-muted)]">
            {doneCount}/{goals.length} cumplidas {isCurrent && "· trimestre actual"}
          </p>
        </div>
        <Link href={goalsHref({ scope, view: "quarter", y: next.year, q: next.quarter })} className="btn-ghost">
          Q{next.quarter} {next.year} →
        </Link>
      </div>

      <GoalsByPillar
        goals={goals}
        pillars={pillars}
        emptyText="Sin metas para este trimestre todavía. Escribí la primera abajo."
      />

      <NewGoalForm scope={scope} year={year} quarter={quarter} pillars={pillars} />

      <ReviewForm
        scope={scope}
        year={year}
        quarter={quarter}
        review={review}
        title={`Cierre de Q${quarter} ${year}`}
        subtitle="Analizá el trimestre antes de abrir el siguiente. Sin reproches: buscamos el patrón."
      />
    </>
  );
}

// ---------------------------------------------------------------------------

async function YearView({
  scope,
  year,
  ownerFilter,
  pillars,
  review,
}: {
  scope: Scope;
  year: number;
  ownerFilter: Prisma.GoalWhereInput;
  pillars: { id: string; name: string }[];
  review: { wins: string | null; challenges: string | null; learnings: string | null; nextFocus: string | null } | null;
}) {
  // Annual goals (no quarter) + a roll-up of the quarterly goals for the year.
  const annualGoals = await db.goal.findMany({
    where: { ...ownerFilter, year, quarter: null },
    include: { pillar: true },
    orderBy: { createdAt: "asc" },
  });
  const quarterGoals = await db.goal.findMany({
    where: { ...ownerFilter, year, quarter: { not: null } },
    select: { quarter: true, status: true },
  });

  const perQuarter = [1, 2, 3, 4].map((q) => {
    const gs = quarterGoals.filter((g) => g.quarter === q);
    return { q, total: gs.length, done: gs.filter((g) => g.status === "done").length };
  });

  const annualDone = annualGoals.filter((g) => g.status === "done").length;

  return (
    <>
      {/* Year navigation */}
      <div className="mb-5 flex items-center justify-between">
        <Link href={goalsHref({ scope, view: "year", y: year - 1 })} className="btn-ghost">
          ← {year - 1}
        </Link>
        <div className="text-center">
          <p className="text-lg font-bold">{year}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {annualDone}/{annualGoals.length} metas del año cumplidas
          </p>
        </div>
        <Link href={goalsHref({ scope, view: "year", y: year + 1 })} className="btn-ghost">
          {year + 1} →
        </Link>
      </div>

      {/* Quarter roll-up */}
      <Card className="mb-5">
        <SectionTitle>Los 4 trimestres</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {perQuarter.map(({ q, total, done }) => (
            <Link
              key={q}
              href={goalsHref({ scope, view: "quarter", y: year, q })}
              className="rounded-xl bg-[var(--color-bg)] p-3 text-center transition-colors hover:bg-[var(--color-brand-50)]"
            >
              <p className="text-sm font-semibold">Q{q}</p>
              <p className="mt-1 text-2xl font-bold">
                {done}
                <span className="text-sm font-normal text-[var(--color-muted)]">/{total}</span>
              </p>
              <p className="text-xs text-[var(--color-muted)]">cumplidas</p>
            </Link>
          ))}
        </div>
      </Card>

      <GoalsByPillar
        goals={annualGoals}
        pillars={pillars}
        emptyText="Sin metas grandes para el año todavía. Escribí la primera abajo y después bajala a trimestres."
      />

      <NewGoalForm scope={scope} year={year} quarter={null} pillars={pillars} />

      <ReviewForm
        scope={scope}
        year={year}
        quarter={null}
        review={review}
        title={`Cierre del año ${year}`}
        subtitle="El cierre anual: qué pasó este año y qué te llevás para el próximo."
      />
    </>
  );
}

// ---------------------------------------------------------------------------

type GoalWithPillar = {
  id: string;
  text: string;
  status: string;
  pillarId: string;
};

function GoalsByPillar({
  goals,
  pillars,
  emptyText,
}: {
  goals: GoalWithPillar[];
  pillars: { id: string; name: string }[];
  emptyText: string;
}) {
  if (goals.length === 0) {
    return (
      <Card className="mb-5">
        <p className="text-sm text-[var(--color-muted)]">{emptyText}</p>
      </Card>
    );
  }

  const byPillar = new Map<string, GoalWithPillar[]>();
  for (const g of goals) {
    if (!byPillar.has(g.pillarId)) byPillar.set(g.pillarId, []);
    byPillar.get(g.pillarId)!.push(g);
  }

  return (
    <div className="mb-5 space-y-4">
      {pillars
        .filter((p) => byPillar.has(p.id))
        .map((p) => (
          <Card key={p.id}>
            <SectionTitle>{p.name}</SectionTitle>
            <ul className="divide-y divide-[var(--color-line)]">
              {byPillar.get(p.id)!.map((g) => (
                <li key={g.id} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p
                      className={`text-sm ${
                        g.status === "done" ? "text-[var(--color-muted)] line-through" : ""
                      }`}
                    >
                      {g.text}
                    </p>
                    {g.status === "carried" && (
                      <span className="text-xs text-[var(--color-warm-500)]">
                        arrastrada al próximo trimestre
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {g.status === "done" ? (
                      <ActionButton
                        id={g.id}
                        action={reopen}
                        className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                      >
                        Reabrir
                      </ActionButton>
                    ) : (
                      <ActionButton
                        id={g.id}
                        action={markDone}
                        className="text-xs font-semibold text-[var(--color-brand-700)]"
                      >
                        ✓ Cumplida
                      </ActionButton>
                    )}
                    {g.status === "open" && (
                      <ActionButton
                        id={g.id}
                        action={carryToNextQuarter}
                        className="text-xs text-[var(--color-muted)] hover:text-[var(--color-warm-500)]"
                      >
                        Arrastrar →
                      </ActionButton>
                    )}
                    <ActionButton id={g.id} action={deleteGoal} confirm="¿Borrar esta meta?">
                      ✕
                    </ActionButton>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

function NewGoalForm({
  scope,
  year,
  quarter,
  pillars,
}: {
  scope: Scope;
  year: number;
  quarter: number | null;
  pillars: { id: string; name: string }[];
}) {
  const periodLabel = quarter ? `Q${quarter} ${year}` : `el año ${year}`;
  return (
    <Card className="mb-5">
      <SectionTitle>Escribir una meta</SectionTitle>
      <form action={addGoal} className="space-y-2">
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="quarter" value={quarter ?? ""} />
        <input type="hidden" name="visibility" value={scope} />
        <textarea
          name="text"
          rows={2}
          placeholder={quarter ? "Ej: Guille a 83 kg y listo para FIV" : "Ej: Tener una cuenta de ahorro con 100k USD"}
          className="input"
          required
        />
        <select name="pillarId" className="input" required defaultValue="">
          <option value="" disabled>
            Asignar a un pilar…
          </option>
          {pillars.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <SubmitButton>Agregar meta a {periodLabel}</SubmitButton>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function ReviewForm({
  scope,
  year,
  quarter,
  review,
  title,
  subtitle,
}: {
  scope: Scope;
  year: number;
  quarter: number | null;
  review: { wins: string | null; challenges: string | null; learnings: string | null; nextFocus: string | null } | null;
  title: string;
  subtitle: string;
}) {
  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <p className="-mt-2 mb-3 text-xs text-[var(--color-muted)]">{subtitle}</p>
      <form action={saveReview} className="space-y-3">
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="quarter" value={quarter ?? ""} />
        <input type="hidden" name="visibility" value={scope} />
        <ReviewField
          name="wins"
          label="✅ Lo que salió bien"
          placeholder="Logros, lo que celebramos…"
          defaultValue={review?.wins ?? ""}
        />
        <ReviewField
          name="challenges"
          label="🌧️ Lo más difícil / qué nos descarriló"
          placeholder="Sin reproches: ¿cuál fue el patrón?"
          defaultValue={review?.challenges ?? ""}
        />
        <ReviewField
          name="learnings"
          label="💡 Aprendizajes"
          placeholder="¿Qué nos llevamos?"
          defaultValue={review?.learnings ?? ""}
        />
        <ReviewField
          name="nextFocus"
          label="🎯 Foco para el próximo período"
          placeholder="¿Dónde ponemos la energía ahora?"
          defaultValue={review?.nextFocus ?? ""}
        />
        <SubmitButton>Guardar cierre</SubmitButton>
      </form>
    </Card>
  );
}

function ReviewField({
  name,
  label,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <textarea name={name} rows={2} placeholder={placeholder} defaultValue={defaultValue} className="input" />
    </label>
  );
}

// ---------------------------------------------------------------------------

function Toggle<T extends string>({
  options,
  active,
}: {
  options: { key: T; label: string; href: string }[];
  active: T;
}) {
  return (
    <div className="inline-flex rounded-xl border border-[var(--color-line)] bg-white p-1">
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            o.key === active
              ? "bg-[var(--color-brand-600)] text-white"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
