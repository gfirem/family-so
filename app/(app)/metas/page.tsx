import Link from "next/link";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { ActionButton, SubmitButton } from "@/components/actions-ui";
import { db } from "@/lib/db";
import { quarterOf } from "@/lib/dates";
import { addGoal, markDone, reopen, deleteGoal, carryToNextQuarter } from "./actions";

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

export default async function MetasPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const now = quarterOf();
  const year = sp.y ? Number(sp.y) : now.year;
  const quarter = sp.q ? Number(sp.q) : now.quarter;

  const pillars = await db.pillar.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  const goals = await db.goal.findMany({
    where: { year, quarter },
    include: { pillar: true },
    orderBy: { createdAt: "asc" },
  });

  const byPillar = new Map<string, typeof goals>();
  for (const g of goals) {
    if (!byPillar.has(g.pillarId)) byPillar.set(g.pillarId, []);
    byPillar.get(g.pillarId)!.push(g);
  }

  const doneCount = goals.filter((g) => g.status === "done").length;
  const prev = shiftQuarter(year, quarter, -1);
  const next = shiftQuarter(year, quarter, 1);
  const isCurrent = year === now.year && quarter === now.quarter;

  return (
    <>
      <PageHeader
        emoji="🎯"
        title="Metas trimestrales"
        subtitle="Primero clavar los 3-4 hábitos clave; después expandir a los 12 pilares. No al revés."
      />

      {/* Navegación de trimestre */}
      <div className="mb-5 flex items-center justify-between">
        <Link href={`/metas?y=${prev.year}&q=${prev.quarter}`} className="btn-ghost">
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
        <Link href={`/metas?y=${next.year}&q=${next.quarter}`} className="btn-ghost">
          Q{next.quarter} {next.year} →
        </Link>
      </div>

      {/* Metas por pilar */}
      {goals.length === 0 ? (
        <Card className="mb-5">
          <p className="text-sm text-[var(--color-muted)]">
            Sin metas para este trimestre todavía. Escribí la primera abajo.
          </p>
        </Card>
      ) : (
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
                            g.status === "done"
                              ? "text-[var(--color-muted)] line-through"
                              : ""
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
      )}

      {/* Nueva meta */}
      <Card>
        <SectionTitle>Escribir una meta</SectionTitle>
        <form action={addGoal} className="space-y-2">
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="quarter" value={quarter} />
          <textarea name="text" rows={2} placeholder="Ej: Guille a 83 kg y listo para FIV" className="input" required />
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
          <SubmitButton>Agregar meta a Q{quarter} {year}</SubmitButton>
        </form>
      </Card>
    </>
  );
}
