import dotenv from "dotenv";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import { parseEnv } from "@neon/env";
import { attachDatabasePool } from "@vercel/functions";
import config from "../neon";

const { Pool } = pg;
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
let initialized = false;
let pool: InstanceType<typeof Pool> | null = null;

/** Load local env files only when the database is first requested. */
export function getDatabasePool() {
  if (initialized) return pool;
  initialized = true;

  dotenv.config({ path: path.resolve(serverDirectory, "../.env.local"), quiet: true });
  dotenv.config({ path: path.resolve(serverDirectory, "../.env"), quiet: true });

  try {
    const { postgres } = parseEnv(config, ["DATABASE_URL"]);
    if (!postgres.databaseUrl.trim()) return null;
    pool = new Pool({
      connectionString: postgres.databaseUrl,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    pool.on("error", () => { console.error("An idle database connection failed; the pool will reconnect on a later request."); });
    if (process.env.VERCEL === "1") attachDatabasePool(pool);
    return pool;
  } catch {
    // Missing DATABASE_URL is a normal local preview state.
    return null;
  }
}
