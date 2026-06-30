"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import type { GoalVisibility } from "@prisma/client";

function refresh() {
  revalidatePath("/goals");
}

// Normalizes the visibility coming from a form into a valid enum value.
function parseVisibility(value: FormDataEntryValue | null): GoalVisibility {
  return value === "private" ? "private" : "family";
}

// Parses a quarter field: empty / "0" / "year" means an annual goal (null).
function parseQuarter(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 4 ? n : null;
}

export async function addGoal(formData: FormData) {
  const user = await requireUser();
  const text = String(formData.get("text") ?? "").trim();
  const pillarId = String(formData.get("pillarId"));
  if (!text || !pillarId) return;
  await db.goal.create({
    data: {
      text,
      pillarId,
      year: Number(formData.get("year")),
      quarter: parseQuarter(formData.get("quarter")),
      visibility: parseVisibility(formData.get("visibility")),
      ownerId: user.id,
    },
  });
  refresh();
}

// Loads a goal and verifies the current user is allowed to mutate it.
// Private goals can only be touched by their owner.
async function loadOwnedGoal(id: string) {
  const user = await requireUser();
  const goal = await db.goal.findUnique({ where: { id } });
  if (!goal) return null;
  if (goal.visibility === "private" && goal.ownerId !== user.id) return null;
  return goal;
}

export async function markDone(id: string) {
  const goal = await loadOwnedGoal(id);
  if (!goal) return;
  await db.goal.update({ where: { id }, data: { status: "done", closedAt: new Date() } });
  refresh();
}

export async function reopen(id: string) {
  const goal = await loadOwnedGoal(id);
  if (!goal) return;
  await db.goal.update({ where: { id }, data: { status: "open", closedAt: null } });
  refresh();
}

export async function deleteGoal(id: string) {
  const goal = await loadOwnedGoal(id);
  if (!goal) return;
  await db.goal.delete({ where: { id } });
  refresh();
}

// Carries a quarterly goal to the next quarter: marks it "carried" and creates a
// new open one, keeping the same visibility and owner. Annual goals don't carry.
export async function carryToNextQuarter(id: string) {
  const goal = await loadOwnedGoal(id);
  if (!goal || goal.quarter == null) return;
  let year = goal.year;
  let quarter = goal.quarter + 1;
  if (quarter > 4) {
    quarter = 1;
    year += 1;
  }
  await db.goal.update({ where: { id }, data: { status: "carried", closedAt: new Date() } });
  await db.goal.create({
    data: {
      text: goal.text,
      pillarId: goal.pillarId,
      year,
      quarter,
      status: "open",
      visibility: goal.visibility,
      ownerId: goal.ownerId,
    },
  });
  refresh();
}

// Saves (creates or updates) the closing/retrospective for a period. The period
// is identified by year + quarter (null = annual) + visibility, and — for
// private reviews — the current user as owner.
export async function saveReview(formData: FormData) {
  const user = await requireUser();
  const year = Number(formData.get("year"));
  const quarter = parseQuarter(formData.get("quarter"));
  const visibility = parseVisibility(formData.get("visibility"));
  const ownerId = visibility === "private" ? user.id : null;

  const data = {
    wins: String(formData.get("wins") ?? "").trim() || null,
    challenges: String(formData.get("challenges") ?? "").trim() || null,
    learnings: String(formData.get("learnings") ?? "").trim() || null,
    nextFocus: String(formData.get("nextFocus") ?? "").trim() || null,
  };

  // No native upsert: the period key includes a nullable quarter/owner, so we
  // resolve the existing row by hand to keep one review per period + scope.
  const existing = await db.quarterReview.findFirst({
    where: { year, quarter, visibility, ownerId },
  });
  if (existing) {
    await db.quarterReview.update({ where: { id: existing.id }, data });
  } else {
    await db.quarterReview.create({
      data: { year, quarter, visibility, ownerId, ...data },
    });
  }
  refresh();
}
