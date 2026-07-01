import Link from "next/link";
import { PageHeader, Card, SectionTitle, HealthNote } from "@/components/ui";
import { SubmitButton } from "@/components/actions-ui";
import { ImageUpload } from "@/components/ImageUpload";
import { NutritionTabs } from "../Tabs";
import { db } from "@/lib/db";
import { recipePhotoSrc } from "@/lib/recipe-photo";
import { addRecipe } from "../actions";

function Macro({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  if (value == null) return null;
  return (
    <span className="text-xs text-[var(--color-muted)]">
      <span className="font-semibold text-[var(--color-ink)]">
        {value}
        {unit}
      </span>{" "}
      {label}
    </span>
  );
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string }>;
}) {
  const { imported } = await searchParams;
  const importedCount = Number(imported);
  const showImported = imported !== undefined && Number.isInteger(importedCount);
  const recipes = await db.recipe.findMany({
    orderBy: [{ category: "asc" }, { isShake: "desc" }, { name: "asc" }],
    include: { _count: { select: { ingredients: true } } },
  });

  // Group by category (recipes without category fall into "Sin categoría").
  const byCategory = new Map<string, typeof recipes>();
  for (const r of recipes) {
    const key = r.category?.trim() || "Sin categoría";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(r);
  }

  return (
    <>
      <PageHeader
        emoji="🥗"
        title="Recetas"
        subtitle="El recetario completo: categorías, tiempos, porciones, macros, ingredientes y pasos."
      />
      <NutritionTabs />

      {showImported && (
        <div className="mb-5 rounded-xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] px-3 py-2 text-sm text-[var(--color-brand-700)]">
          ✅ Se importaron {importedCount} receta(s). Revisalas y aprobalas para usarlas en el plan.
        </div>
      )}

      {recipes.length === 0 ? (
        <Card className="mb-5">
          <p className="text-sm text-[var(--color-muted)]">
            Todavía no hay recetas. Agregá una abajo o{" "}
            <Link href="/nutrition/import" className="text-[var(--color-brand-700)] underline">
              importá un PDF o una URL
            </Link>
            .
          </p>
        </Card>
      ) : (
        [...byCategory.entries()].map(([category, list]) => (
          <Card key={category} className="mb-5">
            <SectionTitle>{category}</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((r) => {
                const photo = recipePhotoSrc(r);
                return (
                <Link
                  key={r.id}
                  href={`/nutrition/recipes/${r.id}`}
                  className="flex gap-3 rounded-xl border border-[var(--color-line)] p-3 transition-colors hover:bg-[var(--color-bg)]"
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg)] text-2xl">
                      {r.isShake ? "🥤" : "🍽️"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{r.name}</span>
                      {!r.approved && <span className="chip">borrador</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      <Macro label="prot" value={r.proteinG} unit="g" />
                      <Macro label="kcal" value={r.calories} unit="" />
                      <Macro label="grasa" value={r.fatG} unit="g" />
                      <Macro label="carbs" value={r.carbsG} unit="g" />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-[var(--color-muted)]">
                      {(r.prepMinutes != null || r.cookMinutes != null) && (
                        <span>⏱ {(r.prepMinutes ?? 0) + (r.cookMinutes ?? 0)} min</span>
                      )}
                      {r.servings != null && <span>· {r.servings} porc.</span>}
                      {r._count.ingredients > 0 && <span>· {r._count.ingredients} ingr.</span>}
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          </Card>
        ))
      )}

      <div className="mb-5">
        <HealthNote>
          El marco 1-2-12 es terreno seguro (dietista-respaldado). El suero con sal del protocolo
          Unani y las «limpiezas»/ayunos NO vienen activados: validalos con tu médico antes de
          adoptarlos. Esto no es consejo médico.
        </HealthNote>
      </div>

      {/* Quick add. Full ingredients/directions are edited inside each recipe. */}
      <Card>
        <SectionTitle>Agregar receta</SectionTitle>
        <form action={addRecipe} className="space-y-2">
          <input name="name" placeholder="Nombre de la receta" className="input" required />
          <div className="flex flex-wrap gap-2">
            <input name="category" placeholder="Categoría (ej: Desayuno)" className="input flex-1" />
            <select name="prepStyle" className="input w-40" defaultValue="full">
              <option value="minimalist">minimalista</option>
              <option value="batch">por lotes</option>
              <option value="full">receta completa</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <input name="prepMinutes" type="number" placeholder="Prep (min)" className="input w-32" />
            <input name="cookMinutes" type="number" placeholder="Cocción (min)" className="input w-32" />
            <input name="servings" type="number" placeholder="Porciones" className="input w-32" />
          </div>
          <div className="flex flex-wrap gap-2">
            <input name="calories" type="number" placeholder="Calorías" className="input w-32" />
            <input name="proteinG" type="number" placeholder="Proteína (g)" className="input w-32" />
            <input name="fatG" type="number" placeholder="Grasa (g)" className="input w-32" />
            <input name="carbsG" type="number" placeholder="Carbs (g)" className="input w-32" />
          </div>
          <ImageUpload name="photoUrl" shape="wide" />
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
          Después de crearla, entrá a la receta para cargar ingredientes y pasos (los ingredientes
          alimentan la lista de compras).
        </p>
      </Card>
    </>
  );
}
