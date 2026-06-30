import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 is Rust-free: the runtime talks to Postgres through a driver adapter.
// PrismaPg takes the connection string from DATABASE_URL (Neon in prod, local
// Postgres in dev) and manages the pool — ideal for serverless on Vercel.
//
// The client is created lazily (on first use), not at import time. This keeps
// the build from constructing it, and turns a missing DATABASE_URL into a clear
// error instead of the driver silently defaulting to 127.0.0.1:5432.

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// `pg` warns that sslmode=require|prefer|verify-ca are currently aliased to
// verify-full and will change meaning in pg v9. We rely on the current behavior
// (full verification — Neon presents a valid cert), so make it explicit. This is
// behavior-preserving and silences the deprecation warning.
function explicitSslMode(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const mode = url.searchParams.get("sslmode");
    if (mode && ["require", "prefer", "verify-ca"].includes(mode)) {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return connectionString; // not a URL we can parse — leave it untouched
  }
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set in this environment. On Vercel, add the Neon connection string to the Production environment and redeploy.",
    );
  }
  const adapter = new PrismaPg({ connectionString: explicitSslMode(connectionString) });
  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient();
  return globalForPrisma.prisma;
}

// Lazy proxy: the real client is built on first property access (request time).
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
}) as PrismaClient;
