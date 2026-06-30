// Builds the week's shopping list from the structured ingredients of every
// recipe in the meal plan. Ingredients with the same name + unit are merged
// (numeric quantities are summed). Shared by the nutrition action and the MCP tool.

import { db } from "@/lib/db";

type Agg = { name: string; unit: string | null; aisle: string | null; qty: number | null; rawQtys: string[] };

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

// Parses "1", "¼", "1 1/2", "0.5" into a number; null when not parseable.
function parseQty(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const fractions: Record<string, number> = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };
  let total = 0;
  let matched = false;
  for (const part of raw.trim().split(/\s+/)) {
    if (fractions[part] !== undefined) {
      total += fractions[part];
      matched = true;
    } else if (/^\d+\/\d+$/.test(part)) {
      const [a, b] = part.split("/").map(Number);
      if (b) {
        total += a / b;
        matched = true;
      }
    } else if (/^\d*\.?\d+$/.test(part)) {
      total += Number(part);
      matched = true;
    }
  }
  return matched ? total : null;
}

function fmtQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

// Returns the merged shopping lines for a week's meal plan (does not write to the DB).
export async function buildShoppingLines(weekId: string) {
  const week = await db.week.findUnique({
    where: { id: weekId },
    include: {
      mealPlan: {
        include: {
          days: {
            include: {
              shake: { include: { ingredients: true } },
              meal1: { include: { ingredients: true } },
              meal2: { include: { ingredients: true } },
            },
          },
        },
      },
    },
  });
  if (!week?.mealPlan) return [];

  const map = new Map<string, Agg>();
  for (const d of week.mealPlan.days) {
    for (const recipe of [d.shake, d.meal1, d.meal2]) {
      if (!recipe) continue;
      for (const ing of recipe.ingredients) {
        const unit = ing.unit ? normalize(ing.unit) : null;
        const key = `${normalize(ing.name)}|${unit ?? ""}`;
        const parsed = parseQty(ing.quantity);
        const existing = map.get(key);
        if (existing) {
          if (parsed !== null) existing.qty = (existing.qty ?? 0) + parsed;
          if (ing.quantity) existing.rawQtys.push(ing.quantity);
        } else {
          map.set(key, {
            name: ing.name.trim(),
            unit: ing.unit?.trim() ?? null,
            aisle: ing.aisle?.trim() ?? null,
            qty: parsed,
            rawQtys: ing.quantity ? [ing.quantity] : [],
          });
        }
      }
    }
  }

  return [...map.values()].map((a) => {
    let qty: string | null = null;
    if (a.qty !== null) qty = `${fmtQty(a.qty)}${a.unit ? " " + a.unit : ""}`;
    else if (a.rawQtys.length) qty = [...new Set(a.rawQtys)].join(" + ") + (a.unit ? " " + a.unit : "");
    else if (a.unit) qty = a.unit;
    return { name: a.name, qty, aisle: a.aisle };
  });
}

// Regenerates the recipe-sourced shopping items for the week from the meal plan.
// Manual items are left untouched; previous "receta" items are replaced.
export async function regenerateMarketList(weekId: string): Promise<number> {
  const lines = await buildShoppingLines(weekId);
  // Atomic so a failed createMany cannot leave the week without its recipe items.
  await db.$transaction(async (tx) => {
    await tx.shoppingItem.deleteMany({ where: { weekId, source: "receta" } });
    if (lines.length > 0) {
      await tx.shoppingItem.createMany({
        data: lines.map((l) => ({
          weekId,
          name: l.name,
          qty: l.qty,
          aisle: l.aisle ?? "del plan de comida",
          source: "receta",
        })),
      });
    }
  });
  return lines.length;
}
