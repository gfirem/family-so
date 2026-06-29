"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

function refresh() {
  revalidatePath("/alimentacion");
  revalidatePath("/planning");
  revalidatePath("/");
}

// --- Recipe bank ---
export async function addRecipe(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const proteinRaw = String(formData.get("proteinG") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  await db.recipe.create({
    data: {
      name,
      proteinG: proteinRaw ? Number(proteinRaw) : null,
      tags,
      prepStyle: String(formData.get("prepStyle") ?? "full"),
      isShake: formData.get("isShake") === "on",
      approved: formData.get("approved") === "on",
      notes: (String(formData.get("notes") ?? "").trim() || null) as string | null,
    },
  });
  refresh();
}

export async function toggleApproved(id: string) {
  await requireUser();
  const r = await db.recipe.findUnique({ where: { id } });
  if (!r) return;
  await db.recipe.update({ where: { id }, data: { approved: !r.approved } });
  refresh();
}

export async function deleteRecipe(id: string) {
  await requireUser();
  await db.recipe.delete({ where: { id } });
  refresh();
}

// --- Weekly plan ---
async function ensureMealPlan(weekId: string) {
  const mp = await db.mealPlan.findUnique({ where: { weekId } });
  if (mp) return mp;
  return db.mealPlan.create({ data: { weekId } });
}

const SLOT_FIELD = {
  shake: "shakeId",
  meal1: "meal1Id",
  meal2: "meal2Id",
} as const;

export async function setMealPlanDay(
  weekId: string,
  day: number,
  slot: "shake" | "meal1" | "meal2",
  recipeId: string,
) {
  await requireUser();
  const mp = await ensureMealPlan(weekId);
  const field = SLOT_FIELD[slot];
  const value = recipeId || null;
  await db.mealPlanDay.upsert({
    where: { mealPlanId_day: { mealPlanId: mp.id, day } },
    update: { [field]: value },
    create: { mealPlanId: mp.id, day, [field]: value },
  });
  refresh();
}

// Generates the market list from the recipes in the week plan.
export async function generateMarketList(weekId: string) {
  await requireUser();
  const week = await db.week.findUnique({
    where: { id: weekId },
    include: {
      shoppingItems: true,
      mealPlan: { include: { days: { include: { shake: true, meal1: true, meal2: true } } } },
    },
  });
  if (!week?.mealPlan) return;

  const names = new Set<string>();
  for (const d of week.mealPlan.days) {
    for (const r of [d.shake, d.meal1, d.meal2]) {
      if (r) names.add(r.name);
    }
  }
  const existing = new Set(
    week.shoppingItems.filter((i) => i.source === "receta").map((i) => i.name),
  );
  for (const name of names) {
    const line = `Ingredientes: ${name}`;
    if (!existing.has(line)) {
      await db.shoppingItem.create({
        data: { weekId, name: line, source: "receta", aisle: "del plan de comida" },
      });
    }
  }
  refresh();
}
