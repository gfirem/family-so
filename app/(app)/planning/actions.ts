"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

function refresh() {
  revalidatePath("/planning");
  revalidatePath("/");
}

// Bloque 1 — mirar atrás: "qué nos descarriló".
export async function saveLookback(formData: FormData) {
  await requireUser();
  const weekId = String(formData.get("weekId"));
  const notes = String(formData.get("notes") ?? "");
  await db.week.update({ where: { id: weekId }, data: { notes } });
  refresh();
}

// Bloque 2 — recordar el norte.
export async function saveNorthStar(formData: FormData) {
  await requireUser();
  const weekId = String(formData.get("weekId"));
  const northStar = String(formData.get("northStar") ?? "");
  await db.week.update({ where: { id: weekId }, data: { northStar } });
  refresh();
}

// Bloques 3, 5 y 7 — actividades (entreno, conexión, tareas claras).
export async function addActivity(formData: FormData) {
  await requireUser();
  const weekId = String(formData.get("weekId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await db.activity.create({
    data: {
      weekId,
      title,
      day: Number(formData.get("day") ?? 0),
      time: (String(formData.get("time") ?? "").trim() || null) as string | null,
      who: (String(formData.get("who") ?? "").trim() || null) as string | null,
      type: String(formData.get("type") ?? "tarea"),
    },
  });
  refresh();
}

export async function toggleActivity(id: string) {
  await requireUser();
  const a = await db.activity.findUnique({ where: { id } });
  if (!a) return;
  await db.activity.update({ where: { id }, data: { done: !a.done } });
  refresh();
}

export async function deleteActivity(id: string) {
  await requireUser();
  await db.activity.delete({ where: { id } });
  refresh();
}

// Bloque 4 — alimentación: items de la lista de compras (manuales).
export async function addShoppingItem(formData: FormData) {
  await requireUser();
  const weekId = String(formData.get("weekId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db.shoppingItem.create({
    data: {
      weekId,
      name,
      qty: (String(formData.get("qty") ?? "").trim() || null) as string | null,
      aisle: (String(formData.get("aisle") ?? "").trim() || null) as string | null,
      source: "manual",
    },
  });
  refresh();
}

export async function toggleShopping(id: string) {
  await requireUser();
  const it = await db.shoppingItem.findUnique({ where: { id } });
  if (!it) return;
  await db.shoppingItem.update({ where: { id }, data: { checked: !it.checked } });
  refresh();
}

export async function deleteShopping(id: string) {
  await requireUser();
  await db.shoppingItem.delete({ where: { id } });
  refresh();
}

// Bloque 6 — anticipar baches: evento social con plan decidido en frío.
export async function addEvent(formData: FormData) {
  await requireUser();
  const weekId = String(formData.get("weekId"));
  const dateStr = String(formData.get("date") ?? "");
  if (!dateStr) return;
  const invitees = String(formData.get("invitees") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  await db.event.create({
    data: {
      weekId,
      date: new Date(dateStr),
      type: String(formData.get("type") ?? "social"),
      place: (String(formData.get("place") ?? "").trim() || null) as string | null,
      plan: (String(formData.get("plan") ?? "").trim() || null) as string | null,
      invitees,
    },
  });
  refresh();
}

export async function deleteEvent(id: string) {
  await requireUser();
  await db.event.delete({ where: { id } });
  refresh();
}
