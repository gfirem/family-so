import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// The middleware uses the edge-safe config (no DB) to protect routes.
export default NextAuth(authConfig).auth;

// Run on everything EXCEPT the auth/mcp/blob endpoints, Next internals, and any
// static file (anything with a dot, e.g. /icon-192.png, /manifest.webmanifest).
// Without the dot exclusion the auth check redirects static asset requests to
// /login, which breaks the logo and the PWA manifest.
//
// `api/blob` is excluded: it issues Vercel Blob client-upload tokens and does
// its OWN auth in onBeforeGenerateToken. Two requests hit it and neither should
// be redirected to /login: the browser's token request (a 307 to /login returns
// HTML, which the @vercel/blob client then fails to parse as JSON — the upload
// dies with "Failed to retrieve the client token"), and Vercel Blob's
// server-to-server `blob.upload-completed` webhook, which carries no session
// cookie and would otherwise be bounced to /login.
//
// `nutrition/import` is also excluded: it hosts the PDF recipe-book upload,
// whose Server Action POSTs a multipart/form-data body. Running the NextAuth
// middleware over that streamed body corrupts it and Next.js throws "Unexpected
// end of form" before the action runs. Skipping middleware here is safe — the
// route stays authenticated by the (app) layout's requireUser() and by the
// import actions, which call requireUser() themselves.
export const config = {
  matcher: ["/((?!api/auth|api/mcp|api/blob|_next|nutrition/import|.*\\..*).*)"],
};
