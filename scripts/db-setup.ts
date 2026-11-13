// Creates all tables on the database in DATABASE_URL (Neon). Safe to re-run.
// Usage: DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" npm run db:setup
import "dotenv/config";
import { createPool } from "../db/pool.js";
import { ensureSchema } from "../db/ensureSchema.js";

const pool = createPool();
if (!pool) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

try {
  await ensureSchema(pool);
  const { rows } = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log(`Schema ready. ${rows.length} tables:`, rows.map((r) => r.table_name).join(", "));
} finally {
  await pool.end();
}
