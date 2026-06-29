"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

function refresh() {
  revalidatePath("/planes");
}

export async function addPlanIdea(formData: FormData) {
  await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await db.planIdea.create({
    data: {
      title,
      category: String(formData.get("category") ?? "salida"),
      cost: String(formData.get("cost") ?? "gratis"),
      notes: (String(formData.get("notes") ?? "").trim() || null) as string | null,
    },
  });
  refresh();
}

export async function toggleFavorite(id: string) {
  await requireUser();
  const p = await db.planIdea.findUnique({ where: { id } });
  if (!p) return;
  await db.planIdea.update({ where: { id }, data: { favorite: !p.favorite } });
  refresh();
}

export async function deletePlanIdea(id: string) {
  await requireUser();
  await db.planIdea.delete({ where: { id } });
  refresh();
}

export async function addNoScript(formData: FormData) {
  await requireUser();
  const trigger = String(formData.get("trigger") ?? "").trim();
  const reply = String(formData.get("reply") ?? "").trim();
  if (!trigger || !reply) return;
  const count = await db.noScript.count();
  await db.noScript.create({ data: { trigger, reply, order: count } });
  refresh();
}

export async function deleteNoScript(id: string) {
  await requireUser();
  await db.noScript.delete({ where: { id } });
  refresh();
}
