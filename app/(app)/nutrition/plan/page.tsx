import Link from "next/link";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { ActionButton } from "@/components/actions-ui";
import { MealSelect } from "../MealSelect";
import { NutritionTabs } from "../Tabs";
import { db } from "@/lib/db";
import { getCurrentWeek } from "@/lib/week";
import { DAY_NAMES } from "@/lib/dates";
import { generateMarketList } from "../actions";

export default async function PlanPage() {
  const week = await getCurrentWeek();
  const recipes = await db.recipe.findMany({
    where: { approved: true },
    orderBy: [{ isShake: "desc" }, { name: "asc" }],
  });

  // Every slot can hold any recipe — a licuado or a comida — so the four columns
  // share a single option list (licuados marked with 🥤 to tell them apart).
  const options = recipes.map((r) => ({
    id: r.id,
    name: `${r.isShake ? "🥤" : "🍽️"} ${r.name}`,
  }));

  const dayMap = new Map(week.mealPlan?.days.map((d) => [d.day, d]) ?? []);
  const recipeItems = week.shoppingItems.filter((i) => i.source === "receta").length;

  return (
    <>
      <PageHeader
        emoji="🗓️"
        title="Plan de la semana"
        subtitle="Hasta 4 ingestas por día · poné el licuado donde mejor te funcione · ventana 8 AM – 6 PM."
      />
      <NutritionTabs />

      <Card className="mb-5 overflow-x-auto">
        <SectionTitle>Semana en curso</SectionTitle>
        {options.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Primero aprobá recetas en{" "}
            <Link href="/nutrition/recipes" className="text-[var(--color-brand-700)] underline">
              Recetas
            </Link>{" "}
            para poder armar el plan.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--color-muted)]">
                <th className="pb-2 pr-2">Día</th>
                <th className="pb-2 pr-2">Comida 1</th>
                <th className="pb-2 pr-2">Comida 2</th>
                <th className="pb-2 pr-2">Comida 3</th>
                <th className="pb-2">Comida 4</th>
              </tr>
            </thead>
            <tbody>
              {DAY_NAMES.map((dn, day) => {
                const d = dayMap.get(day);
                return (
                  <tr key={day} className="border-t border-[var(--color-line)]">
                    <td className="py-2 pr-2 font-medium">{dn}</td>
                    <td className="py-2 pr-2">
                      <MealSelect weekId={week.id} day={day} slot="meal1" current={d?.meal1Id ?? null} options={options} />
                    </td>
                    <td className="py-2 pr-2">
                      <MealSelect weekId={week.id} day={day} slot="meal2" current={d?.meal2Id ?? null} options={options} />
                    </td>
                    <td className="py-2 pr-2">
                      <MealSelect weekId={week.id} day={day} slot="meal3" current={d?.meal3Id ?? null} options={options} />
                    </td>
                    <td className="py-2">
                      <MealSelect weekId={week.id} day={day} slot="meal4" current={d?.meal4Id ?? null} options={options} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ActionButton id={week.id} action={generateMarketList} className="btn-primary">
            🛒 Generar lista del mercado
          </ActionButton>
          <Link href="/nutrition/shopping" className="text-sm text-[var(--color-brand-700)] underline">
            Ver lista ({recipeItems} items del plan)
          </Link>
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          La lista se arma con los ingredientes de las recetas elegidas (se combinan cantidades
          iguales). Volvé a generarla cuando cambies el plan.
        </p>
      </Card>
    </>
  );
}
