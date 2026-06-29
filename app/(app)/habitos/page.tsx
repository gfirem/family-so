import Link from "next/link";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { ActionButton, SubmitButton } from "@/components/actions-ui";
import { HabitCheck } from "./HabitCheck";
import { db } from "@/lib/db";
import { getPartners } from "@/lib/session";
import { startOfWeek, addDays, isoDate, DAY_SHORT } from "@/lib/dates";
import { addHabit, deleteHabit, addWeight } from "./actions";

export default async function HabitosPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const users = await getPartners();
  const selected = users.find((u) => u.id === p) ?? users[0];

  const weekOf = startOfWeek();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekOf, i));
  const todayIso = isoDate(new Date());
  const yesterdayIso = isoDate(addDays(new Date(), -1));

  const habits = await db.habit.findMany({
    where: { ownerId: selected.id, active: true },
    orderBy: [{ isKeystone: "desc" }, { order: "asc" }],
  });

  // Logs de los últimos 35 días para derivar racha y "dos veces seguidas".
  const since = addDays(new Date(), -35);
  const logs = await db.habitLog.findMany({
    where: { ownerId: selected.id, done: true, date: { gte: since } },
  });
  const doneByHabit = new Map<string, Set<string>>();
  for (const l of logs) {
    const key = l.habitId;
    if (!doneByHabit.has(key)) doneByHabit.set(key, new Set());
    doneByHabit.get(key)!.add(isoDate(l.date));
  }

  const weights = await db.weightLog.findMany({
    where: { ownerId: selected.id },
    orderBy: { date: "desc" },
    take: 6,
  });

  function streak(habitId: string): number {
    const set = doneByHabit.get(habitId) ?? new Set();
    let n = 0;
    // arranca en hoy si está hecho, si no en ayer (un día no rompe la cadena al contar)
    let cursor = set.has(todayIso) ? new Date() : addDays(new Date(), -1);
    while (set.has(isoDate(cursor))) {
      n++;
      cursor = addDays(cursor, -1);
    }
    return n;
  }

  return (
    <>
      <PageHeader
        emoji="✅"
        title="Hábitos"
        subtitle="Nunca falles dos veces seguidas. Un día fallido no rompe nada; dos seguidos arrancan un hábito nuevo."
      />

      {/* Tabs de persona */}
      <div className="mb-5 flex gap-2">
        {users.map((u) => (
          <Link
            key={u.id}
            href={`/habitos?p=${u.id}`}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              u.id === selected.id
                ? "bg-[var(--color-brand-600)] text-white"
                : "border border-[var(--color-line)] bg-white text-[var(--color-muted)]"
            }`}
          >
            {u.name}
          </Link>
        ))}
      </div>

      {/* Ancla de identidad */}
      <Card className="mb-5 bg-[var(--color-brand-50)]">
        <p className="text-sm font-medium text-[var(--color-brand-700)]">
          Somos personas que duermen bien, entrenan y comen para estar fuertes — listos para ser
          papás. Cada marca de abajo es un voto por esa persona.
        </p>
        <Link href="/metas" className="mt-2 inline-block text-sm font-semibold text-[var(--color-brand-700)]">
          Ver nuestras metas →
        </Link>
      </Card>

      {/* Grilla semanal */}
      <Card className="mb-5 overflow-x-auto">
        <SectionTitle>Semana</SectionTitle>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-1/2" />
              {weekDays.map((d, i) => (
                <th key={i} className="px-1 pb-2 text-xs font-medium text-[var(--color-muted)]">
                  {DAY_SHORT[i]}
                </th>
              ))}
              <th className="px-1 pb-2 text-xs font-medium text-[var(--color-muted)]">Σ</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => {
              const set = doneByHabit.get(h.id) ?? new Set();
              const total = weekDays.filter((d) => set.has(isoDate(d))).length;
              const failedYesterday = !set.has(yesterdayIso);
              const notDoneToday = !set.has(todayIso);
              const innegociable = failedYesterday && notDoneToday;
              return (
                <tr key={h.id} className="border-t border-[var(--color-line)]">
                  <td className="py-2 pr-2 align-top">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm ${h.isKeystone ? "font-semibold" : ""}`}>{h.name}</span>
                      {h.isKeystone && <span className="pill-keystone">clave</span>}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                      {streak(h.id) > 0 && <span>🔥 {streak(h.id)} días</span>}
                      {innegociable && (
                        <span className="font-semibold text-[var(--color-danger)]">
                          ¡Hoy es innegociable!
                        </span>
                      )}
                    </div>
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
                  <td className="px-1 text-center text-sm font-semibold">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {habits.length === 0 && (
          <p className="py-3 text-sm text-[var(--color-muted)]">
            {selected.name} todavía no tiene hábitos. Agregá uno abajo.
          </p>
        )}
      </Card>

      {/* Lista de hábitos con identidad + borrar */}
      <Card className="mb-5">
        <SectionTitle>Hábitos de {selected.name}</SectionTitle>
        <ul className="divide-y divide-[var(--color-line)]">
          {habits.map((h) => (
            <li key={h.id} className="flex items-start justify-between py-2">
              <div>
                <p className="text-sm font-medium">{h.name}</p>
                {h.identityLink && (
                  <p className="text-xs text-[var(--color-muted)]">{h.identityLink}</p>
                )}
              </div>
              <ActionButton id={h.id} action={deleteHabit} confirm="¿Archivar este hábito?">
                Archivar
              </ActionButton>
            </li>
          ))}
        </ul>
        <form action={addHabit} className="mt-3 space-y-2 border-t border-[var(--color-line)] pt-3">
          <input type="hidden" name="ownerId" value={selected.id} />
          <input name="name" placeholder="Nuevo hábito" className="input" required />
          <input name="identityLink" placeholder="Ancla de identidad (opcional)" className="input" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isKeystone" className="h-4 w-4 accent-[var(--color-brand-600)]" />
            Es un hábito clave (keystone)
          </label>
          <SubmitButton className="btn-ghost">Agregar hábito</SubmitButton>
        </form>
      </Card>

      {/* Peso */}
      <Card>
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
