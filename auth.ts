import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";

// Google Workspace is the only sign-in method. We request Calendar scopes so the
// app can create/read events on the user's calendar, and we keep the Google
// access/refresh tokens in the JWT (encrypted by AUTH_SECRET) so server actions
// can call the Calendar API. Refresh is handled in the jwt callback.

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
];

// Only these people may sign in. Set ALLOWED_EMAILS (comma-separated) and/or
// ALLOWED_GOOGLE_DOMAIN in the environment. With neither set, sign-in is denied.
function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowList = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const allowedDomain = (process.env.ALLOWED_GOOGLE_DOMAIN ?? "").trim().toLowerCase();
  const normalized = email.toLowerCase();
  if (allowList.includes(normalized)) return true;
  if (allowedDomain && normalized.endsWith(`@${allowedDomain}`)) return true;
  return false;
}

// Exchange the refresh token for a fresh access token when the current one expires.
async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error("No se pudo refrescar el token de Google");
  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES.join(" "),
          access_type: "offline", // ask for a refresh token
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Restrict sign-in to the allowed people.
    signIn({ profile }) {
      return isAllowedEmail(profile?.email);
    },
    async jwt({ token, account, profile }) {
      // Initial sign-in: store Google tokens and link to our User row.
      if (account && profile?.email) {
        const user = await db.user.upsert({
          where: { email: profile.email },
          update: { name: profile.name ?? undefined, image: (profile as { picture?: string }).picture },
          create: {
            email: profile.email,
            name: profile.name ?? profile.email,
            image: (profile as { picture?: string }).picture,
            role: "owner",
          },
        });
        token.uid = user.id;
        token.name = user.name;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at; // seconds since epoch
        return token;
      }

      // Subsequent calls: refresh the access token if it has expired.
      const expiresAt = token.expiresAt as number | undefined;
      if (expiresAt && Date.now() < expiresAt * 1000 - 60_000) {
        return token; // still valid
      }
      if (token.refreshToken) {
        try {
          const refreshed = await refreshGoogleToken(token.refreshToken as string);
          token.accessToken = refreshed.access_token;
          token.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
          if (refreshed.refresh_token) token.refreshToken = refreshed.refresh_token;
          delete token.error;
        } catch {
          token.error = "RefreshTokenError";
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      if (token.name) session.user.name = token.name as string;
      session.accessToken = token.accessToken as string | undefined;
      session.error = token.error as string | undefined;
      return session;
    },
  },
});
