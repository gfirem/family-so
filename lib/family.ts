import { db } from "@/lib/db";

// The app currently hosts a single family (the couple), but the model lets it
// grow. getFamily returns that family, creating it on first use and adopting any
// members that don't belong to one yet.
export async function getFamily() {
  let family = await db.family.findFirst({
    include: { members: { orderBy: { createdAt: "asc" } } },
  });
  if (!family) {
    family = await db.family.create({
      data: { name: "Mi familia" },
      include: { members: { orderBy: { createdAt: "asc" } } },
    });
  }

  // Adopt any members not linked to a family yet (e.g. existing seeded users).
  const orphans = await db.user.findMany({ where: { familyId: null } });
  if (orphans.length > 0) {
    await db.user.updateMany({
      where: { familyId: null },
      data: { familyId: family.id },
    });
    family = await db.family.findUnique({
      where: { id: family.id },
      include: { members: { orderBy: { createdAt: "asc" } } },
    });
  }

  return family!;
}
