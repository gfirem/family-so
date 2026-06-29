import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    // Google access token for Calendar API calls; error is set if refresh failed.
    accessToken?: string;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number; // seconds since epoch
    error?: string;
  }
}
