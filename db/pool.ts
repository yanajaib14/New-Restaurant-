import pg from "pg";

const { Pool, types } = pg;

// node-postgres returns BIGINT and NUMERIC as strings by default. The old
// InsForge API returned them as JSON numbers, and the app compares ids with
// ===, so parse them back to numbers (ids and money values fit safely).
types.setTypeParser(20, (v) => (v === null ? null : Number(v)));   // int8 / BIGINT
types.setTypeParser(1700, (v) => (v === null ? null : Number(v))); // numeric

// One Postgres pool per process, pointed at Neon via DATABASE_URL.
// Use Neon's *pooled* connection string (host contains "-pooler") so many
// short-lived Vercel functions don't exhaust Postgres connections.
export function createPool(connectionString = process.env.DATABASE_URL?.trim()) {
  if (!connectionString) return null;
  const isServerless = Boolean(process.env.VERCEL);
  const needsSsl = !/localhost|127\.0\.0\.1/.test(connectionString);
  return new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: true } : undefined,
    max: isServerless ? 3 : 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
}
