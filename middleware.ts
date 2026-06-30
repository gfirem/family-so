import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// The middleware uses the edge-safe config (no DB) to protect routes.
export default NextAuth(authConfig).auth;

// Run on everything EXCEPT the auth/mcp endpoints, Next internals, and any
// static file (anything with a dot, e.g. /icon-192.png, /manifest.webmanifest).
// Without the dot exclusion the auth check redirects static asset requests to
// /login, which breaks the logo and the PWA manifest.
export const config = {
  matcher: ["/((?!api/auth|api/mcp|_next|.*\\..*).*)"],
};
