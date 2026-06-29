import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// El middleware usa la config edge-safe (sin DB) para proteger rutas.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api/auth|api/mcp|_next/static|_next/image|favicon.ico).*)"],
};
