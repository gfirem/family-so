import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 mueve la URL de conexión fuera del schema. La CLI (migrate, db push,
// introspect) la lee desde acá; el runtime usa el driver adapter en lib/db.ts.
// La connection string vive en DATABASE_URL (.env local / variables de Vercel-Neon).

if (!process.env.DATABASE_URL) {
  // Carga .env en local sin depender de dotenv como dependencia de producción.
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
    // sin .env (p. ej. en Vercel) las variables ya vienen del entorno
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
