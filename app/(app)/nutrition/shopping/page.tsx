import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { CheckItem, ActionButton, SubmitButton } from "@/components/actions-ui";
import { NutritionTabs } from "../Tabs";
import { getCurrentWeek } from "@/lib/week";
import { toggleShoppingItem, addShoppingItem, deleteShoppingItem } from "../actions";

export default async function ShoppingPage() {
  const week = await getCurrentWeek();
  const items = [...week.shoppingItems].sort((a, b) =>
    (a.aisle ?? "").localeCompare(b.aisle ?? "") || a.name.localeCompare(b.name),
  );

  // Group by aisle for an easier in-store run.
  const byAisle = new Map<string, typeof items>();
  for (const it of items) {
    const key = it.aisle?.trim() || "Otros";
    if (!byAisle.has(key)) byAisle.set(key, []);
    byAisle.get(key)!.push(it);
  }

  const pending = items.filter((i) => !i.checked).length;

  return (
    <>
      <PageHeader
        emoji="🛒"
        title="Lista de compras"
        subtitle={`${pending} pendientes de ${items.length} · generada desde el plan de comida.`}
      />
      <NutritionTabs />

      {items.length === 0 ? (
        <Card className="mb-5">
          <p className="text-sm text-[var(--color-muted)]">
            La lista está vacía. Armá el plan de la semana y tocá «Generar lista del mercado», o
            agregá items manualmente abajo.
          </p>
        </Card>
      ) : (
        [...byAisle.entries()].map(([aisle, list]) => (
          <Card key={aisle} className="mb-5">
            <SectionTitle>{aisle}</SectionTitle>
            <ul className="divide-y divide-[var(--color-line)]">
              {list.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3">
                  <CheckItem
                    id={it.id}
                    checked={it.checked}
                    label={it.name}
                    sub={[it.qty, it.source === "receta" ? "del plan" : null].filter(Boolean).join(" · ") || undefined}
                    toggle={toggleShoppingItem}
                  />
                  <ActionButton id={it.id} action={deleteShoppingItem} confirm="¿Borrar item?">
                    ✕
                  </ActionButton>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}

      <Card>
        <SectionTitle>Agregar item manual</SectionTitle>
        <form action={addShoppingItem} className="flex flex-wrap gap-2">
          <input type="hidden" name="weekId" value={week.id} />
          <input name="name" placeholder="Producto" className="input flex-1" required />
          <input name="qty" placeholder="Cantidad" className="input w-32" />
          <SubmitButton className="btn-ghost">Agregar</SubmitButton>
        </form>
      </Card>
    </>
  );
}
