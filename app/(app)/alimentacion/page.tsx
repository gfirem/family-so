import { PageHeader, Card, SectionTitle, HealthNote } from "@/components/ui";
import { ActionButton, SubmitButton } from "@/components/actions-ui";
import { MealSelect } from "./MealSelect";
import { db } from "@/lib/db";
import { getCurrentWeek } from "@/lib/week";
import { DAY_NAMES } from "@/lib/dates";
import { addRecipe, toggleApproved, deleteRecipe, generateMarketList } from "./actions";

export default async function AlimentacionPage() {
  const week = await getCurrentWeek();
  const recipes = await db.recipe.findMany({ orderBy: [{ isShake: "desc" }, { name: "asc" }] });

  const shakes = recipes.filter((r) => r.approved && r.isShake);
  const meals = recipes.filter((r) => r.approved && !r.isShake);

  const dayMap = new Map(week.mealPlan?.days.map((d) => [d.day, d]) ?? []);
  const recipeItems = week.shoppingItems.filter((i) => i.source === "receta").length;

  return (
    <>
      <PageHeader
        emoji="🥗"
        title="Alimentación 1-2-12"
        subtitle="1 licuado + 2 comidas reales (≥30 g proteína) · ventana 8 AM – 6 PM."
      />

      {/* Week plan */}
      <Card className="mb-5 overflow-x-auto">
        <SectionTitle>Plan de la semana</SectionTitle>
        {shakes.length === 0 && meals.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Primero aprobá recetas en el banco de abajo para poder armar el plan.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--color-muted)]">
                <th className="pb-2 pr-2">Día</th>
                <th className="pb-2 pr-2">Licuado</th>
                <th className="pb-2 pr-2">Comida 1</th>
                <th className="pb-2">Comida 2</th>
              </tr>
            </thead>
            <tbody>
              {DAY_NAMES.map((dn, day) => {
                const d = dayMap.get(day);
                return (
                  <tr key={day} className="border-t border-[var(--color-line)]">
                    <td className="py-2 pr-2 font-medium">{dn}</td>
                    <td className="py-2 pr-2">
                      <MealSelect weekId={week.id} day={day} slot="shake" current={d?.shakeId ?? null} options={shakes} />
                    </td>
                    <td className="py-2 pr-2">
                      <MealSelect weekId={week.id} day={day} slot="meal1" current={d?.meal1Id ?? null} options={meals} />
                    </td>
                    <td className="py-2">
                      <MealSelect weekId={week.id} day={day} slot="meal2" current={d?.meal2Id ?? null} options={meals} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="mt-4 flex items-center gap-3">
          <ActionButton id={week.id} action={generateMarketList} className="btn-primary">
            🛒 Generar lista del mercado
          </ActionButton>
          <span className="text-xs text-[var(--color-muted)]">
            {recipeItems} items de receta en la lista
          </span>
        </div>
      </Card>

      <div className="mb-5">
        <HealthNote>
          El marco 1-2-12 es terreno seguro (dietista-respaldado). El suero con sal del protocolo
          Unani y las «limpiezas»/ayunos NO vienen activados: validalos con tu médico antes de
          adoptarlos. Esto no es consejo médico.
        </HealthNote>
      </div>

      {/* Recipe bank */}
      <Card>
        <SectionTitle>Banco de recetas</SectionTitle>
        <ul className="divide-y divide-[var(--color-line)]">
          {recipes.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 py-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium">{r.name}</span>
                  {r.isShake && <span className="chip">licuado</span>}
                  {r.proteinG && <span className="chip">{r.proteinG} g prot</span>}
                  {r.tags.map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                </div>
                {r.notes && <p className="mt-0.5 text-xs text-[var(--color-muted)]">{r.notes}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <ActionButton
                  id={r.id}
                  action={toggleApproved}
                  className={`text-xs font-semibold ${
                    r.approved ? "text-[var(--color-brand-700)]" : "text-[var(--color-muted)]"
                  }`}
                >
                  {r.approved ? "✓ aprobada" : "aprobar"}
                </ActionButton>
                <ActionButton id={r.id} action={deleteRecipe} confirm="¿Borrar receta?">
                  ✕
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>

        <form action={addRecipe} className="mt-3 space-y-2 border-t border-[var(--color-line)] pt-3">
          <input name="name" placeholder="Nombre de la receta" className="input" required />
          <div className="flex flex-wrap gap-2">
            <input name="proteinG" type="number" placeholder="Proteína (g)" className="input w-36" />
            <select name="prepStyle" className="input flex-1" defaultValue="full">
              <option value="minimalist">minimalista</option>
              <option value="batch">por lotes</option>
              <option value="full">receta completa</option>
            </select>
          </div>
          <input name="tags" placeholder="Etiquetas separadas por coma (ej: sin-lacteos)" className="input" />
          <input name="notes" placeholder="Nota (opcional)" className="input" />
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isShake" className="h-4 w-4 accent-[var(--color-brand-600)]" />
              Es un licuado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="approved" defaultChecked className="h-4 w-4 accent-[var(--color-brand-600)]" />
              Aprobada
            </label>
          </div>
          <SubmitButton className="btn-ghost">Agregar receta</SubmitButton>
        </form>

        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Pendiente: cargar el recetario 1-2-12 completo (PDF, 70+ recetas) para poblar el banco.
        </p>
      </Card>
    </>
  );
}
