import type { NextAuthConfig } from "next-auth";

// Config edge-safe (sin DB ni bcrypt) para el middleware. La lógica de
// credenciales vive en auth.ts, que corre en Node.
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
      // El endpoint MCP se autentica con su propio token, no con sesión.
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
