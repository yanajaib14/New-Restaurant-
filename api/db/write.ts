import pg from "pg";

const { Pool } = pg;

const DB_WRITE_TABLES = new Set([
  "tasks", "menu_items", "startup_costs", "operating_costs", "milestones", "notes",
  "vendors", "inventory_items", "utility_accounts", "permits", "marketing_posts",
  "training_modules", "daily_checklists", "invoices", "positions", "candidates",
  "digital_assets", "activity_logs", "task_todos", "shopping_list_items", "cost_calculator_overrides"
]);

const DB_CONNECTION =
  process.env.DATABASE_URL ||
  "postgresql://postgres:211919448a449a8c985b520fc3895aeb@arqsta8h.us-west.database.insforge.app:5432/insforge?sslmode=require";

const pool = new Pool({ connectionString: DB_CONNECTION });

const toDbValue = (value: unknown) => {
  if (value === undefined) return null;
  if (Array.isArray(value) || (value !== null && typeof value === "object")) {
    return JSON.stringify(value);
  }
  return value;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { table, action, payload, id } = req.body || {};

  if (!DB_WRITE_TABLES.has(table)) {
    return res.status(400).json({ error: "Invalid table" });
  }

  if (!["insert", "update", "delete"].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  try {
    if (action === "insert") {
      const data = payload || {};
      const keys = Object.keys(data);
      if (!keys.length) return res.status(400).json({ error: "Missing payload" });

      const columns = keys.map((k) => `"${k}"`).join(", ");
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const values = keys.map((k) => toDbValue(data[k]));

      const q = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await pool.query(q, values);
      return res.status(200).json({ ok: true, row: result.rows[0] });
    }

    if (action === "update") {
      if (id === undefined || id === null) return res.status(400).json({ error: "Missing id" });
      const data = payload || {};
      const keys = Object.keys(data);
      if (!keys.length) return res.status(400).json({ error: "Missing payload" });

      const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
      const values = keys.map((k) => toDbValue(data[k]));

      const q = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
      const result = await pool.query(q, [...values, id]);
      return res.status(200).json({ ok: true, row: result.rows[0] || null });
    }

    if (action === "delete") {
      if (id === undefined || id === null) return res.status(400).json({ error: "Missing id" });
      const q = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
      const result = await pool.query(q, [id]);
      return res.status(200).json({ ok: true, row: result.rows[0] || null });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error: any) {
    console.error("api/db/write error", error);
    return res.status(500).json({ error: error?.message || "DB write failed" });
  }
}
