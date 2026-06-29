import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { ActionButton, SubmitButton } from "@/components/actions-ui";
import { db } from "@/lib/db";
import {
  addPlanIdea,
  toggleFavorite,
  deletePlanIdea,
  addNoScript,
  deleteNoScript,
} from "./actions";

const CATEGORIES = ["parque", "rio", "salida", "conexion"];

export default async function PlanesPage() {
  const ideas = await db.planIdea.findMany({
    orderBy: [{ favorite: "desc" }, { title: "asc" }],
  });
  const scripts = await db.noScript.findMany({ orderBy: { order: "asc" } });

  return (
    <>
      <PageHeader
        emoji="🌳"
        title="Planes y conexión"
        subtitle="Si tenemos nuestro propio plan, no hay nada que resistir. Que el finde nunca quede en blanco."
      />

      {/* Banco de planes */}
      <Card className="mb-5">
        <SectionTitle>Banco de planes</SectionTitle>
        <ul className="divide-y divide-[var(--color-line)]">
          {ideas.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {p.category} · {p.cost}
                  {p.notes ? ` · ${p.notes}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <ActionButton
                  id={p.id}
                  action={toggleFavorite}
                  className={`text-lg ${p.favorite ? "" : "opacity-30 grayscale"}`}
                >
                  ⭐
                </ActionButton>
                <ActionButton id={p.id} action={deletePlanIdea}>
                  ✕
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
        <form action={addPlanIdea} className="mt-3 space-y-2 border-t border-[var(--color-line)] pt-3">
          <input name="title" placeholder="Nueva idea de plan" className="input" required />
          <div className="flex flex-wrap gap-2">
            <select name="category" className="input flex-1" defaultValue="salida">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input name="cost" placeholder="Costo (ej: gratis)" className="input flex-1" defaultValue="gratis" />
          </div>
          <input name="notes" placeholder="Nota (opcional)" className="input" />
          <SubmitButton className="btn-ghost">Agregar plan</SubmitButton>
        </form>
      </Card>

      {/* Guion del "no" */}
      <Card>
        <SectionTitle>Guion del «no» (decidido en frío)</SectionTitle>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          Respuestas ya escritas para declinar sin pelear con el momento. Decidir en frío es mil
          veces más fácil.
        </p>
        <ul className="space-y-2">
          {scripts.map((s) => (
            <li key={s.id} className="rounded-xl bg-[var(--color-bg)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{s.trigger}</p>
                  <p className="mt-0.5 text-sm text-[var(--color-brand-700)]">→ {s.reply}</p>
                </div>
                <ActionButton id={s.id} action={deleteNoScript}>
                  ✕
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
        <form action={addNoScript} className="mt-3 space-y-2 border-t border-[var(--color-line)] pt-3">
          <input name="trigger" placeholder="Situación (ej: te ofrecen cerveza)" className="input" required />
          <input name="reply" placeholder="Tu respuesta decidida" className="input" required />
          <SubmitButton className="btn-ghost">Agregar respuesta</SubmitButton>
        </form>
      </Card>
    </>
  );
}
