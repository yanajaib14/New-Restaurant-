import type { RequestHandler } from "express";

export const RECORD_TABLES = new Set([
  "tasks", "menu_items", "startup_costs", "operating_costs", "milestones", "notes",
  "vendors", "contacts", "inventory_items", "utility_accounts", "permits", "marketing_posts",
  "training_modules", "daily_checklists", "invoices", "positions", "candidates", "decision_logs",
  "digital_assets", "activity_logs", "task_todos", "shopping_list_items", "cost_calculator_overrides",
  "calendar_events", "team_onboarding", "ai_messages",
]);

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export interface RecordsPool {
  query(sql: string, values?: unknown[]): Promise<{
    rows: Array<Record<string, unknown>>;
    fields?: Array<{ name: string; dataTypeID: number }>;
  }>;
}

export interface RecordsRequest {
  method?: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, unknown>;
}

function normalizeHost(value: string) {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isTrustedRequest(req: RecordsRequest) {
  const allowedHosts = new Set(["localhost", "127.0.0.1"]);
  for (const value of [process.env.APP_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (value?.trim()) allowedHosts.add(normalizeHost(value.trim()));
  }
  allowedHosts.delete("");

  const origin = typeof req.headers?.origin === "string" ? normalizeHost(req.headers.origin) : "";
  const referer = typeof req.headers?.referer === "string" ? normalizeHost(req.headers.referer) : "";
  return Boolean((origin && allowedHosts.has(origin)) || (referer && allowedHosts.has(referer)));
}

function payloadEntries(value: unknown): Array<[string, unknown]> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const entries = Object.entries(value);
  if (!entries.length) return null;
  if (entries.some(([key]) => !IDENTIFIER.test(key) || FORBIDDEN_KEYS.has(key))) return null;
  return entries;
}

function toDbValue(value: unknown) {
  if (Array.isArray(value) || (value !== null && typeof value === "object")) return JSON.stringify(value);
  return value;
}

function normalizeRows(result: {
  rows: Array<Record<string, unknown>>;
  fields?: Array<{ name: string; dataTypeID: number }>;
}) {
  const numericFields = new Map(
    (result.fields || [])
      .filter(({ dataTypeID }) => [20, 21, 23, 700, 701, 1700].includes(dataTypeID))
      .map(({ name, dataTypeID }) => [name, dataTypeID])
  );
  if (!numericFields.size) return result.rows;

  return result.rows.map((row) => {
    const normalized = { ...row };
    for (const [name, oid] of numericFields) {
      const value = normalized[name];
      if (typeof value !== "string") continue;
      const number = Number(value);
      if (!Number.isFinite(number)) continue;
      if (Number.isInteger(number) && !Number.isSafeInteger(number)) continue;
      normalized[name] = number;
    }
    return normalized;
  });
}

function readId(req: RecordsRequest) {
  const raw = req.query?.id;
  if (typeof raw !== "string" || !raw.startsWith("eq.")) return null;
  const id = raw.slice(3);
  return id.length ? id : null;
}

export function createRecordsHandler(getPool: () => RecordsPool | null): RequestHandler {
  return async (rawReq, res) => {
    const req = rawReq as unknown as RecordsRequest;
    const method = String(req.method || "").toUpperCase();
    if (!["GET", "POST", "PATCH", "DELETE"].includes(method)) {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!isTrustedRequest(req)) return res.status(403).json({ error: "Forbidden" });

    const table = req.params?.table;
    if (typeof table !== "string" || !RECORD_TABLES.has(table) || !IDENTIFIER.test(table)) {
      return res.status(400).json({ error: "Invalid table" });
    }

    const pool = getPool();
    if (!pool) return res.status(503).json({ error: "Server database is not configured" });

    const quotedTable = `"${table}"`;
    try {
      if (method === "GET") {
        const result = await pool.query(`SELECT * FROM ${quotedTable}`);
        return res.status(200).json(normalizeRows(result));
      }

      if (method === "POST") {
        const entries = payloadEntries(req.body);
        if (!entries) return res.status(400).json({ error: "Invalid or empty record" });
        const columns = entries.map(([key]) => `"${key}"`).join(", ");
        const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ");
        const values = entries.map(([, value]) => toDbValue(value));
        const result = await pool.query(
          `INSERT INTO ${quotedTable} (${columns}) VALUES (${placeholders}) RETURNING *`,
          values
        );
        return res.status(200).json(normalizeRows(result));
      }

      const id = readId(req);
      if (id === null) return res.status(400).json({ error: "Expected id=eq.<value>" });

      if (method === "PATCH") {
        const entries = payloadEntries(req.body);
        if (!entries) return res.status(400).json({ error: "Invalid or empty record" });
        const assignments = entries.map(([key], index) => `"${key}" = $${index + 1}`).join(", ");
        const values = entries.map(([, value]) => toDbValue(value));
        const result = await pool.query(
          `UPDATE ${quotedTable} SET ${assignments} WHERE id = $${values.length + 1} RETURNING *`,
          [...values, id]
        );
        if (!result.rows.length) return res.status(404).json({ error: "Record not found" });
        return res.status(200).json(normalizeRows(result));
      }

      const result = await pool.query(`DELETE FROM ${quotedTable} WHERE id = $1 RETURNING *`, [id]);
      return res.status(200).json(normalizeRows(result));
    } catch (error) {
      return res.status(500).json({ error: "Database request failed" });
    }
  };
}
