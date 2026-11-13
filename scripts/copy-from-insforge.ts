// One-time copy of all rows from the old InsForge backend into Neon.
// Run `npm run db:setup` first. Keeps the original ids, so links between
// rows (e.g. task_todos.linkedTaskId) stay intact. Re-running is safe:
// rows whose id already exists on Neon are skipped.
//
// Usage:
//   DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" \
//   INSFORGE_URL="https://xxxx.us-west.insforge.app" INSFORGE_KEY="<anon key>" \
//   npm run db:copy            # add `-- --replace` to empty the Neon tables first
import "dotenv/config";
import { createPool } from "../db/pool.js";

// Parents before children (foreign keys).
const TABLES = [
  "tasks", "task_todos", "notes", "menu_items", "startup_costs", "operating_costs", "milestones",
  "vendors", "contacts", "inventory_items", "utility_accounts", "permits", "marketing_posts",
  "training_modules", "daily_checklists", "invoices", "positions", "candidates", "decision_logs",
  "digital_assets", "activity_logs", "shopping_list_items", "cost_calculator_overrides",
  "calendar_events", "app_access_users", "app_settings",
];

const base = String(process.env.INSFORGE_URL || process.env.VITE_INSFORGE_URL || "").trim().replace(/\/$/, "");
const key = String(process.env.INSFORGE_KEY || process.env.VITE_INSFORGE_KEY || "").trim();
const replace = process.argv.includes("--replace");
const pool = createPool();

if (!pool || !base || !key) {
  console.error("Need DATABASE_URL, INSFORGE_URL and INSFORGE_KEY.");
  process.exit(1);
}

const toDbValue = (v: unknown) =>
  v === undefined ? null : v !== null && typeof v === "object" ? JSON.stringify(v) : v;

async function fetchAll(table: string): Promise<any[] | null> {
  const rows: any[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const res = await fetch(`${base}/api/database/records/${table}?limit=${pageSize}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${key}`, apikey: key, Accept: "application/json" },
    });
    if (res.status === 404) return null; // table doesn't exist on InsForge
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
    const page = await res.json();
    if (!Array.isArray(page)) throw new Error(`${table}: unexpected response ${JSON.stringify(page).slice(0, 200)}`);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function columnsOf(table: string) {
  const { rows } = await pool!.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
    [table]
  );
  return new Set(rows.map((r) => r.column_name as string));
}

let failed = 0;
try {
  if (replace) {
    await pool.query(`TRUNCATE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
    console.log("Emptied the Neon tables.");
  }

  for (const table of TABLES) {
    const rows = await fetchAll(table);
    if (rows === null) { console.log(`- ${table}: not on InsForge, skipped`); continue; }
    const cols = await columnsOf(table);
    if (!cols.size) { console.log(`! ${table}: missing on Neon, run npm run db:setup first`); failed++; continue; }

    let copied = 0;
    const ignored = new Set<string>();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const row of rows) {
        const keys = Object.keys(row).filter((k) => {
          if (cols.has(k)) return true;
          ignored.add(k);
          return false;
        });
        if (!keys.length) continue;
        // app_settings: InsForge values replace the defaults db:setup inserted.
        const onConflict = table === "app_settings"
          ? `ON CONFLICT (key) DO UPDATE SET ${keys.filter((k) => k !== "key").map((k) => `"${k}" = EXCLUDED."${k}"`).join(", ")}`
          : "ON CONFLICT DO NOTHING";
        const sql = `INSERT INTO ${table} (${keys.map((k) => `"${k}"`).join(", ")}) ` +
          `VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")}) ${onConflict}`;
        const r = await client.query(sql, keys.map((k) => toDbValue(row[k])));
        copied += r.rowCount || 0;
      }
      // Move the id counter past the copied ids so new rows don't collide.
      if (cols.has("id")) {
        await client.query(
          `SELECT setval(pg_get_serial_sequence('${table}', 'id'), GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${table}), 1))`
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    const note = ignored.size ? ` (ignored columns not on Neon: ${[...ignored].join(", ")})` : "";
    console.log(`✓ ${table}: ${copied} of ${rows.length} rows copied${note}`);
  }
} catch (e: any) {
  console.error("Copy failed:", e?.message || e);
  failed++;
} finally {
  await pool.end();
}
process.exit(failed ? 1 : 0);
