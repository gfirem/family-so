"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getFamily } from "@/lib/family";

function refresh() {
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

// Family name + photo.
export async function updateFamily(formData: FormData) {
  await requireUser();
  const family = await getFamily();
  const name = String(formData.get("name") ?? "").trim() || "Mi familia";
  const image = String(formData.get("image") ?? "").trim() || null;
  await db.family.update({ where: { id: family.id }, data: { name, image } });
  refresh();
}

// Adds a new member to the family. Email is how Google sign-in links the person.
export async function addMember(formData: FormData) {
  await requireUser();
  const family = await getFamily();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!name || !email) return;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Re-link an existing person to this family instead of failing.
    await db.user.update({ where: { id: existing.id }, data: { name, familyId: family.id } });
  } else {
    await db.user.create({ data: { name, email, role: "member", familyId: family.id } });
  }
  refresh();
}

// Renames a member.
export async function updateMember(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await db.user.update({ where: { id }, data: { name } });
  refresh();
}

// Removes a member from the family. Guards: you can't remove yourself, and the
// family must keep at least one member. This deletes the person and their
// individual data (habits, weights, private plannings) — used with confirmation.
export async function removeMember(id: string) {
  const me = await requireUser();
  if (id === me.id) return;
  const family = await getFamily();
  const memberCount = await db.user.count({ where: { familyId: family.id } });
  if (memberCount <= 1) return;
  await db.user.delete({ where: { id } });
  refresh();
}
