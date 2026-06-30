import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { ActionButton, SubmitButton } from "@/components/actions-ui";
import { ImageUpload } from "@/components/ImageUpload";
import { db } from "@/lib/db";
import {
  updateRecipe,
  deleteRecipe,
  toggleApproved,
  addIngredient,
  deleteIngredient,
  setDirections,
} from "../../actions";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await db.recipe.findUnique({
    where: { id },
    include: { ingredients: { orderBy: { order: "asc" } } },
  });
  if (!recipe) notFound();

  return (
    <>
      <PageHeader
        emoji={recipe.isShake ? "🥤" : "🍽️"}
        title={recipe.name}
        subtitle={recipe.category ?? "Sin categoría"}
        action={
          <Link href="/nutrition/recipes" className="btn-ghost">
            ← Volver
          </Link>
        }
      />

      {recipe.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.photoUrl}
          alt=""
          className="mb-5 h-48 w-full rounded-2xl object-cover"
        />
      )}

      {/* Scalar fields */}
      <Card className="mb-5">
        <SectionTitle>Datos de la receta</SectionTitle>
        <form action={updateRecipe} className="space-y-2">
          <input type="hidden" name="id" value={recipe.id} />
          <input name="name" defaultValue={recipe.name} className="input" required />
          <div className="flex flex-wrap gap-2">
            <input name="category" defaultValue={recipe.category ?? ""} placeholder="Categoría" className="input flex-1" />
            <select name="prepStyle" className="input w-40" defaultValue={recipe.prepStyle}>
              <option value="minimalist">minimalista</option>
              <option value="batch">por lotes</option>
              <option value="full">receta completa</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <input name="prepMinutes" type="number" defaultValue={recipe.prepMinutes ?? ""} placeholder="Prep (min)" className="input w-32" />
            <input name="cookMinutes" type="number" defaultValue={recipe.cookMinutes ?? ""} placeholder="Cocción (min)" className="input w-32" />
            <input name="servings" type="number" defaultValue={recipe.servings ?? ""} placeholder="Porciones" className="input w-32" />
          </div>
          <div className="flex flex-wrap gap-2">
            <input name="calories" type="number" defaultValue={recipe.calories ?? ""} placeholder="Calorías" className="input w-32" />
            <input name="proteinG" type="number" defaultValue={recipe.proteinG ?? ""} placeholder="Proteína (g)" className="input w-32" />
            <input name="fatG" type="number" defaultValue={recipe.fatG ?? ""} placeholder="Grasa (g)" className="input w-32" />
            <input name="carbsG" type="number" defaultValue={recipe.carbsG ?? ""} placeholder="Carbs (g)" className="input w-32" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-muted)]">Foto de la receta</label>
            <ImageUpload name="photoUrl" defaultValue={recipe.photoUrl ?? ""} shape="wide" />
          </div>
          <input
            name="tags"
            defaultValue={recipe.tags.join(", ")}
            placeholder="Etiquetas separadas por coma"
            className="input"
          />
          <input name="notes" defaultValue={recipe.notes ?? ""} placeholder="Nota" className="input" />
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isShake" defaultChecked={recipe.isShake} className="h-4 w-4 accent-[var(--color-brand-600)]" />
              Es un licuado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="approved" defaultChecked={recipe.approved} className="h-4 w-4 accent-[var(--color-brand-600)]" />
              Aprobada
            </label>
          </div>
          <SubmitButton>Guardar cambios</SubmitButton>
        </form>
        {recipe.sourceUrl && (
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Importada de{" "}
            <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="underline">
              {recipe.sourceUrl}
            </a>
          </p>
        )}
      </Card>

      {/* Ingredients */}
      <Card className="mb-5">
        <SectionTitle>Ingredientes</SectionTitle>
        {recipe.ingredients.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Sin ingredientes. Agregá abajo (alimentan la lista de compras).
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-line)]">
            {recipe.ingredients.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  {[i.quantity, i.unit, i.name].filter(Boolean).join(" ")}
                  {i.aisle && <span className="ml-2 chip">{i.aisle}</span>}
                </span>
                <ActionButton id={i.id} action={deleteIngredient} confirm="¿Borrar ingrediente?">
                  ✕
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
        <form action={addIngredient} className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-3">
          <input type="hidden" name="recipeId" value={recipe.id} />
          <input name="quantity" placeholder="Cant." className="input w-20" />
          <input name="unit" placeholder="Unidad" className="input w-28" />
          <input name="name" placeholder="Ingrediente" className="input flex-1" required />
          <input name="aisle" placeholder="Góndola (ej: lacteos)" className="input w-44" />
          <SubmitButton className="btn-ghost">Agregar</SubmitButton>
        </form>
      </Card>

      {/* Directions */}
      <Card className="mb-5">
        <SectionTitle>Preparación</SectionTitle>
        <form action={setDirections} className="space-y-2">
          <input type="hidden" name="recipeId" value={recipe.id} />
          <textarea
            name="directions"
            defaultValue={recipe.directions.join("\n")}
            placeholder="Un paso por línea"
            rows={Math.max(4, recipe.directions.length + 1)}
            className="input"
          />
          <SubmitButton className="btn-ghost">Guardar pasos</SubmitButton>
        </form>
      </Card>

      {/* Danger zone */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <ActionButton
            id={recipe.id}
            action={toggleApproved}
            className={`text-sm font-semibold ${
              recipe.approved ? "text-[var(--color-brand-700)]" : "text-[var(--color-muted)]"
            }`}
          >
            {recipe.approved ? "✓ aprobada" : "aprobar"}
          </ActionButton>
          <ActionButton
            id={recipe.id}
            action={deleteRecipe}
            confirm="¿Borrar la receta completa?"
            className="text-sm font-semibold text-[var(--color-danger)]"
          >
            Borrar receta
          </ActionButton>
        </div>
      </Card>
    </>
  );
}
