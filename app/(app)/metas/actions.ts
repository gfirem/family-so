"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

function refresh() {
  revalidatePath("/metas");
}

export async function addGoal(formData: FormData) {
  await requireUser();
  const text = String(formData.get("text") ?? "").trim();
  const pillarId = String(formData.get("pillarId"));
  if (!text || !pillarId) return;
  await db.goal.create({
    data: {
      text,
      pillarId,
      year: Number(formData.get("year")),
      quarter: Number(formData.get("quarter")),
    },
  });
  refresh();
}

export async function markDone(id: string) {
  await requireUser();
  await db.goal.update({ where: { id }, data: { status: "done", closedAt: new Date() } });
  refresh();
}

export async function reopen(id: string) {
  await requireUser();
  await db.goal.update({ where: { id }, data: { status: "open", closedAt: null } });
  refresh();
}

export async function deleteGoal(id: string) {
  await requireUser();
  await db.goal.delete({ where: { id } });
  refresh();
}

// Carries a goal to the next quarter: marks it "carried" and creates a new open one.
export async function carryToNextQuarter(id: string) {
  await requireUser();
  const goal = await db.goal.findUnique({ where: { id } });
  if (!goal) return;
  let year = goal.year;
  let quarter = goal.quarter + 1;
  if (quarter > 4) {
    quarter = 1;
    year += 1;
  }
  await db.goal.update({ where: { id }, data: { status: "carried", closedAt: new Date() } });
  await db.goal.create({
    data: { text: goal.text, pillarId: goal.pillarId, year, quarter, status: "open" },
  });
  refresh();
}
