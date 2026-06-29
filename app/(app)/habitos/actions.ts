"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

function refresh() {
  revalidatePath("/habitos");
  revalidatePath("/");
}

// Checks/unchecks a habit on a date. Creates the log if it does not exist.
export async function toggleHabitLog(habitId: string, ownerId: string, dateIso: string) {
  await requireUser();
  const date = new Date(dateIso);
  const existing = await db.habitLog.findUnique({
    where: { habitId_date: { habitId, date } },
  });
  if (existing) {
    if (existing.done) {
      await db.habitLog.delete({ where: { id: existing.id } });
    } else {
      await db.habitLog.update({ where: { id: existing.id }, data: { done: true } });
    }
  } else {
    await db.habitLog.create({ data: { habitId, ownerId, date, done: true } });
  }
  refresh();
}

export async function addHabit(formData: FormData) {
  await requireUser();
  const ownerId = String(formData.get("ownerId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const count = await db.habit.count({ where: { ownerId } });
  await db.habit.create({
    data: {
      ownerId,
      name,
      identityLink: (String(formData.get("identityLink") ?? "").trim() || null) as string | null,
      isKeystone: formData.get("isKeystone") === "on",
      order: count,
    },
  });
  refresh();
}

export async function deleteHabit(id: string) {
  await requireUser();
  await db.habit.update({ where: { id }, data: { active: false } });
  refresh();
}

export async function addWeight(formData: FormData) {
  await requireUser();
  const ownerId = String(formData.get("ownerId"));
  const weightKg = parseFloat(String(formData.get("weightKg") ?? ""));
  if (Number.isNaN(weightKg)) return;
  const dateStr = String(formData.get("date") ?? "");
  const date = dateStr ? new Date(dateStr) : new Date();
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  await db.weightLog.upsert({
    where: { ownerId_date: { ownerId, date: day } },
    update: { weightKg },
    create: { ownerId, date: day, weightKg },
  });
  refresh();
}
