import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Returns the logged-in user (Guille / China) or redirects to /login.
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  return user;
}

// List of the two people, for selectors and comparison views.
export async function getPartners() {
  return db.user.findMany({ orderBy: { createdAt: "asc" } });
}
