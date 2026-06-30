"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ensurePlanning, PLANNING_SCOPES, type PlanningScope } from "@/lib/week";
import { parseWeekOf } from "@/lib/dates";

// Revalidate the planning index and any open planning ("layout" covers the
// nested /planning/[id] route too), plus the dashboard.
function refresh() {
  revalidatePath("/planning", "layout");
  revalidatePath("/");
}

// Creates (or opens, if it already exists) a planning for a week + scope and
// navigates to its editor. Private scopes are owned by the current user.
export async function createPlanning(formData: FormData) {
  const me = await requireUser();
  const scopeRaw = String(formData.get("scope") ?? "");
  const def = PLANNING_SCOPES.find((s) => s.scope === scopeRaw);
  if (!def) return;
  const scope = def.scope as PlanningScope;
  const weekOf = parseWeekOf(String(formData.get("weekOf") ?? ""));
  const planning = await ensurePlanning({
    weekOf,
    scope,
    ownerId: def.private ? me.id : null,
  });
  redirect(`/planning/${planning.id}`);
}

// Block 1 — look back: "what derailed us".
export async function saveLookback(formData: FormData) {
  await requireUser();
  const weekId = String(formData.get("weekId"));
  const notes = String(formData.get("notes") ?? "");
  await db.week.update({ where: { id: weekId }, data: { notes } });
  refresh();
}

// Block 2 — remember the north star.
export async function saveNorthStar(formData: FormData) {
  await requireUser();
  const weekId = String(formData.get("weekId"));
  const northStar = String(formData.get("northStar") ?? "");
  await db.week.update({ where: { id: weekId }, data: { northStar } });
  refresh();
}

// Blocks 3, 5 and 7 — activities (workout, connection, clear tasks).
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

// Block 4 — nutrition: shopping list items (manual).
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

// Block 6 — anticipate bumps: social event with a plan decided in advance.
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
