"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { regenerateMarketList } from "@/lib/shopping";
import {
  extractRecipesFromUrl,
  extractRecipesFromPdf,
  saveExtractedRecipes,
} from "@/lib/recipe-import";

function refresh() {
  revalidatePath("/nutrition/recipes");
  revalidatePath("/nutrition/plan");
  revalidatePath("/nutrition/shopping");
  revalidatePath("/planning");
  revalidatePath("/");
}

// Parses the scalar recipe fields shared by create and update forms.
function recipeScalarsFromForm(formData: FormData) {
  const num = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    return raw ? Number(raw) : null;
  };
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: (String(formData.get("category") ?? "").trim() || null) as string | null,
    prepMinutes: num("prepMinutes"),
    cookMinutes: num("cookMinutes"),
    servings: num("servings"),
    calories: num("calories"),
    proteinG: num("proteinG"),
    fatG: num("fatG"),
    carbsG: num("carbsG"),
    prepStyle: String(formData.get("prepStyle") ?? "full"),
    isShake: formData.get("isShake") === "on",
    approved: formData.get("approved") === "on",
    photoUrl: (String(formData.get("photoUrl") ?? "").trim() || null) as string | null,
    notes: (String(formData.get("notes") ?? "").trim() || null) as string | null,
    tags,
  };
}

// --- Recipe bank ---
export async function addRecipe(formData: FormData) {
  await requireUser();
  const data = recipeScalarsFromForm(formData);
  if (!data.name) return;
  await db.recipe.create({ data });
  refresh();
}

export async function updateRecipe(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const data = recipeScalarsFromForm(formData);
  if (!data.name) return;
  await db.recipe.update({ where: { id }, data });
  revalidatePath(`/nutrition/recipes/${id}`);
  refresh();
}

export async function toggleApproved(id: string) {
  await requireUser();
  const r = await db.recipe.findUnique({ where: { id } });
  if (!r) return;
  await db.recipe.update({ where: { id }, data: { approved: !r.approved } });
  revalidatePath(`/nutrition/recipes/${id}`);
  refresh();
}

export async function deleteRecipe(id: string) {
  await requireUser();
  await db.recipe.delete({ where: { id } });
  refresh();
  redirect("/nutrition/recipes");
}

// --- Ingredients (structured, feed the shopping list) ---
export async function addIngredient(formData: FormData) {
  await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!recipeId || !name) return;
  const count = await db.recipeIngredient.count({ where: { recipeId } });
  await db.recipeIngredient.create({
    data: {
      recipeId,
      name,
      quantity: (String(formData.get("quantity") ?? "").trim() || null) as string | null,
      unit: (String(formData.get("unit") ?? "").trim() || null) as string | null,
      aisle: (String(formData.get("aisle") ?? "").trim() || null) as string | null,
      order: count,
    },
  });
  revalidatePath(`/nutrition/recipes/${recipeId}`);
}

export async function deleteIngredient(id: string) {
  await requireUser();
  const ing = await db.recipeIngredient.findUnique({ where: { id } });
  if (!ing) return;
  await db.recipeIngredient.delete({ where: { id } });
  revalidatePath(`/nutrition/recipes/${ing.recipeId}`);
}

// Directions edited as one step per line.
export async function setDirections(formData: FormData) {
  await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  if (!recipeId) return;
  const directions = String(formData.get("directions") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  await db.recipe.update({ where: { id: recipeId }, data: { directions } });
  revalidatePath(`/nutrition/recipes/${recipeId}`);
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

// Regenerates the market list from the structured ingredients of the week's recipes.
export async function generateMarketList(weekId: string) {
  await requireUser();
  await regenerateMarketList(weekId);
  refresh();
}

// --- Shopping list ---
export async function toggleShoppingItem(id: string) {
  await requireUser();
  const item = await db.shoppingItem.findUnique({ where: { id } });
  if (!item) return;
  await db.shoppingItem.update({ where: { id }, data: { checked: !item.checked } });
  revalidatePath("/nutrition/shopping");
  revalidatePath("/planning");
}

export async function addShoppingItem(formData: FormData) {
  await requireUser();
  const weekId = String(formData.get("weekId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!weekId || !name) return;
  await db.shoppingItem.create({
    data: {
      weekId,
      name,
      qty: (String(formData.get("qty") ?? "").trim() || null) as string | null,
      source: "manual",
    },
  });
  revalidatePath("/nutrition/shopping");
  revalidatePath("/planning");
}

export async function deleteShoppingItem(id: string) {
  await requireUser();
  await db.shoppingItem.delete({ where: { id } });
  revalidatePath("/nutrition/shopping");
  revalidatePath("/planning");
}

// --- Import (URL / PDF) ---
export async function importRecipeFromUrl(formData: FormData) {
  await requireUser();
  const url = String(formData.get("url") ?? "").trim();
  if (!url) redirect("/nutrition/import?error=falta-url");
  let host = "web";
  try {
    host = new URL(url).host;
  } catch {
    redirect("/nutrition/import?error=url-invalida");
  }
  let count = 0;
  try {
    const recipes = await extractRecipesFromUrl(url);
    const saved = await saveExtractedRecipes(recipes, { source: host, sourceUrl: url });
    count = saved.length;
  } catch {
    redirect("/nutrition/import?error=import");
  }
  if (count === 0) redirect("/nutrition/import?error=sin-recetas");
  refresh();
  redirect(`/nutrition/recipes?imported=${count}`);
}

export async function importRecipeFromPdf(formData: FormData) {
  await requireUser();
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) redirect("/nutrition/import?error=falta-pdf");
  const pdf = file as File;
  if (pdf.type !== "application/pdf") redirect("/nutrition/import?error=no-pdf");
  if (pdf.size > 32 * 1024 * 1024) redirect("/nutrition/import?error=pdf-grande");

  let count = 0;
  try {
    const base64 = Buffer.from(await pdf.arrayBuffer()).toString("base64");
    const recipes = await extractRecipesFromPdf({ base64 });
    const saved = await saveExtractedRecipes(recipes, { source: `pdf: ${pdf.name}` });
    count = saved.length;
  } catch {
    redirect("/nutrition/import?error=import");
  }
  if (count === 0) redirect("/nutrition/import?error=sin-recetas");
  refresh();
  redirect(`/nutrition/recipes?imported=${count}`);
}
