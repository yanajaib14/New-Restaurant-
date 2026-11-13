import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { attachDatabasePool } from "@vercel/functions";
import type pg from "pg";
import { createPool } from "../db/pool.js";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
let initialized = false;
let pool: pg.Pool | null = null;

/**
 * The app's one Postgres pool (Neon in production), created on first use.
 * Reads the pooled DATABASE_URL; returns null when it isn't set, which is the
 * normal local-preview state.
 */
export function getDatabasePool() {
  if (initialized) return pool;
  initialized = true;

  dotenv.config({ path: path.resolve(serverDirectory, "../.env.local"), quiet: true });
  dotenv.config({ path: path.resolve(serverDirectory, "../.env"), quiet: true });

  pool = createPool(process.env.DATABASE_URL?.trim());
  if (!pool) return null;
  pool.on("error", () => {
    console.error("An idle database connection failed; the pool will reconnect on a later request.");
  });
  // Lets Vercel close idle connections cleanly before a function is suspended.
  if (process.env.VERCEL === "1") attachDatabasePool(pool);
  return pool;
}
