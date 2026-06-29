import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Devuelve el usuario logueado (Guille / China) o redirige a /login.
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  return user;
}

// Lista de las dos personas, para selectores y vistas comparadas.
export async function getPartners() {
  return db.user.findMany({ orderBy: { createdAt: "asc" } });
}
