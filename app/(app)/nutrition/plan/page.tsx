import Link from "next/link";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { ActionButton } from "@/components/actions-ui";
import { WeekMealPlan, type PlanDay } from "../WeekMealPlan";
import { NutritionTabs } from "../Tabs";
import { db } from "@/lib/db";
import { getCurrentWeek } from "@/lib/week";
import { generateMarketList } from "../actions";

export default async function PlanPage() {
  const week = await getCurrentWeek();
  // Only the lightweight fields the picker needs; sent to the client once instead
  // of once per <select>, so the page stays light with hundreds of recipes.
  const recipes = await db.recipe.findMany({
    where: { approved: true },
    orderBy: [{ isShake: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      isShake: true,
      category: true,
      photoUrl: true,
      calories: true,
      proteinG: true,
    },
  });

  const days: PlanDay[] =
    week.mealPlan?.days.map((d) => ({
      day: d.day,
      meal1Id: d.meal1Id,
      meal2Id: d.meal2Id,
      meal3Id: d.meal3Id,
      meal4Id: d.meal4Id,
    })) ?? [];

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
        {recipes.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Primero aprobá recetas en{" "}
            <Link href="/nutrition/recipes" className="text-[var(--color-brand-700)] underline">
              Recetas
            </Link>{" "}
            para poder armar el plan.
          </p>
        ) : (
          <WeekMealPlan weekId={week.id} days={days} recipes={recipes} />
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
