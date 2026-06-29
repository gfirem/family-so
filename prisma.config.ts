import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 moves the connection URL out of the schema. The CLI (migrate, db push,
// introspect) reads it from here; the runtime uses the driver adapter in lib/db.ts.
// The connection string lives in DATABASE_URL (local .env / Vercel-Neon variables).

if (!process.env.DATABASE_URL) {
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
    url: process.env.DATABASE_URL ?? "",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
