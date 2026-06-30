import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 moves the connection URL out of the schema. The CLI (migrate, diff,
// resolve, db pull/push) reads it from here; the app runtime uses the pg driver
// adapter in lib/db.ts with the pooled DATABASE_URL.
//
// On Neon, schema/migration operations MUST use the DIRECT (non-pooler) endpoint
// — PgBouncer transaction pooling breaks the schema engine (prepared statements,
// advisory locks). So the CLI url prefers DIRECT_DATABASE_URL and falls back to
// DATABASE_URL (keeps CI's dummy url and unconfigured envs working).

if (!process.env.DATABASE_URL || !process.env.DIRECT_DATABASE_URL) {
  // Load .env locally without relying on dotenv as a production dependency.
  try {
    const fs = require("node:fs");
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
      }
    }
  } catch {
    // without .env (e.g. on Vercel) the variables already come from the environment
  }
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
    // Only used when AUTHORING migrations with `prisma migrate dev` (on a Neon dev
    // branch). Not needed by `migrate deploy`/`resolve`. Spread conditionally so an
    // unset value never reaches defineConfig validation as `undefined`.
    ...(process.env.SHADOW_DATABASE_URL
      ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }
      : {}),
  },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
