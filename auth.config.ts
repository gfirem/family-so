import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no DB or bcrypt) for the middleware. The credentials
// logic lives in auth.ts, which runs on Node.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLogin = nextUrl.pathname.startsWith("/login");
      // The MCP endpoint authenticates with its own token, not with a session.
      const isMcp = nextUrl.pathname.startsWith("/api/mcp");
      if (isMcp) return true;
      if (isLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      if (token.name) session.user.name = token.name as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
