import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// The middleware uses the edge-safe config (no DB) to protect routes.
export default NextAuth(authConfig).auth;

// Run on everything EXCEPT the auth/mcp endpoints, Next internals, and any
// static file (anything with a dot, e.g. /icon-192.png, /manifest.webmanifest).
// Without the dot exclusion the auth check redirects static asset requests to
// /login, which breaks the logo and the PWA manifest.
//
// `nutrition/import` is also excluded: it hosts the PDF recipe-book upload,
// whose Server Action POSTs a multipart/form-data body. Running the NextAuth
// middleware over that streamed body corrupts it and Next.js throws "Unexpected
// end of form" before the action runs. Skipping middleware here is safe — the
// route stays authenticated by the (app) layout's requireUser() and by the
// import actions, which call requireUser() themselves.
export const config = {
  matcher: ["/((?!api/auth|api/mcp|_next|nutrition/import|.*\\..*).*)"],
};
