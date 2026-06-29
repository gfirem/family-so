import Link from "next/link";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { getCurrentWeek, weekHabitStats, recentWeights } from "@/lib/week";
import { formatDateEs } from "@/lib/dates";

export default async function Dashboard() {
  const week = await getCurrentWeek();
  const { stats } = await weekHabitStats(week.weekOf);
  const weights = await recentWeights();

  const trainedActivities = week.activities.filter((a) => a.type === "entreno");

  return (
    <>
      <PageHeader
        emoji="📊"
        title="Tablero de la semana"
        subtitle={`Semana del ${formatDateEs(week.weekOf)}`}
      />

      {week.northStar && (
        <div className="mb-6 rounded-2xl bg-[var(--color-brand-600)] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand-100)]">
            Nuestro norte
          </p>
          <p className="mt-1 text-lg font-semibold">{week.northStar}</p>
        </div>
      )}

      {/* % de hábitos por persona */}
      <Card className="mb-5">
        <SectionTitle>Hábitos cumplidos esta semana</SectionTitle>
        <div className="space-y-4">
          {stats.map((s) => (
            <div key={s.user.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{s.user.name}</span>
                <span className="text-[var(--color-muted)]">
                  {s.pct}% · {s.doneCount}/{s.possible}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                <div
                  className="h-full rounded-full bg-[var(--color-brand-500)]"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/habitos"
          className="mt-4 inline-block text-sm font-medium text-[var(--color-brand-700)]"
        >
          Abrir el tracker →
        </Link>
      </Card>

      {/* Peso */}
      <Card className="mb-5">
        <SectionTitle>Peso</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          {weights.map(({ user, logs }) => {
            const last = logs.at(-1);
            const prev = logs.at(-2);
            const delta = last && prev ? +(last.weightKg - prev.weightKg).toFixed(1) : null;
            return (
              <div key={user.id} className="rounded-xl bg-[var(--color-bg)] p-3">
                <p className="text-sm font-medium">{user.name}</p>
                {last ? (
                  <p className="mt-1 text-2xl font-bold">
                    {last.weightKg}
                    <span className="ml-1 text-sm font-normal text-[var(--color-muted)]">kg</span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[var(--color-muted)]">Sin registro</p>
                )}
                {delta !== null && (
                  <p
                    className={`text-xs font-medium ${
                      delta <= 0 ? "text-[var(--color-brand-700)]" : "text-[var(--color-warm-500)]"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta} kg vs. anterior
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <Link
          href="/habitos"
          className="mt-4 inline-block text-sm font-medium text-[var(--color-brand-700)]"
        >
          Registrar peso →
        </Link>
      </Card>

      {/* Qué nos descarriló */}
      <Card className="mb-5">
        <SectionTitle>¿Qué nos descarriló?</SectionTitle>
        {week.notes ? (
          <p className="whitespace-pre-wrap text-sm">{week.notes}</p>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">
            Lo anotás en el planning del domingo, bloque 1 (mirar atrás). Sin reproches: buscamos el patrón.
          </p>
        )}
      </Card>

      {/* Resumen de la semana */}
      <Card>
        <SectionTitle>La semana de un vistazo</SectionTitle>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat n={week.activities.length} label="Actividades" />
          <Stat n={trainedActivities.length} label="Entrenos" />
          <Stat n={week.shoppingItems.length} label="Compras" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/planning" className="btn-primary">
            🗓️ Planning del domingo
          </Link>
          <Link href="/alimentacion" className="btn-ghost">
            🥗 Plan de comida
          </Link>
        </div>
      </Card>
    </>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl bg-[var(--color-bg)] p-3">
      <p className="text-2xl font-bold">{n}</p>
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
    </div>
  );
}
