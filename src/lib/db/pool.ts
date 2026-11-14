import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var vesutilPgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

function createPool() {
  if (!connectionString) return null;
  return new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  });
}

export const dbPool = globalThis.vesutilPgPool ?? createPool() ?? undefined;

if (dbPool && process.env.NODE_ENV !== "production") {
  globalThis.vesutilPgPool = dbPool;
}

export function isDatabaseConfigured() {
  return Boolean(connectionString);
}
