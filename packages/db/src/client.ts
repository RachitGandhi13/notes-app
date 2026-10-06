import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Each server process opens its own pool of database connections. Under a burst of traffic,
// several processes can together ask Neon's pooler for more connections than it allows.
//
// Set PRISMA_CONNECTION_LIMIT (for example 5) in the production environment to cap each pool.
// Without it, the behaviour is unchanged, so this is off by default. A connection_limit already
// written into DATABASE_URL always wins. Raise the value only after a load test, because requests
// beyond the cap queue for a connection and can time out.
//
// Neon's pooled host also expects `pgbouncer=true` in DATABASE_URL, which turns off prepared
// statements. Add it to the URL in the environment if you see "prepared statement" errors.
export function databaseUrlWithConnectionLimit(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (/[?&]connection_limit=/.test(raw)) return raw;

  const limit = Number(process.env.PRISMA_CONNECTION_LIMIT);
  if (!Number.isInteger(limit) || limit < 1) return raw;

  return `${raw}${raw.includes("?") ? "&" : "?"}connection_limit=${limit}`;
}

const url = databaseUrlWithConnectionLimit(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(url ? { datasources: { db: { url } } } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
