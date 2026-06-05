import pg from "pg";

const { Pool } = pg;

const DB_WRITE_TABLES = new Set([
  "tasks", "menu_items", "startup_costs", "operating_costs", "milestones", "notes",
  "vendors", "contacts", "inventory_items", "utility_accounts", "permits", "marketing_posts",
  "training_modules", "daily_checklists", "invoices", "positions", "candidates", "decision_logs",
  "digital_assets", "activity_logs", "task_todos", "shopping_list_items", "cost_calculator_overrides",
  "calendar_events"
]);

const DB_CONNECTION = process.env.DATABASE_URL?.trim();
const DB_ROUTE_KEY = String(process.env.DB_ROUTE_KEY || "").trim();
const DB_ROUTE_REQUIRE_TRUSTED = String(process.env.DB_ROUTE_REQUIRE_TRUSTED || "1").trim() !== "0";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_WINDOW = Number(process.env.DB_WRITE_RATE_LIMIT_PER_MIN || 60);
const blockedIps = new Set(
  String(process.env.DB_WRITE_BLOCKED_IPS || process.env.DB_SELECT_BLOCKED_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean)
);
const ipHits = new Map<string, { count: number; resetAt: number }>();
const allowedOriginHosts = new Set<string>();

const normalizeHost = (value: string) => value.toLowerCase().split(":")[0];
const addAllowedHost = (raw: string) => {
  if (!raw) return;
  try {
    const host = new URL(raw.includes("://") ? raw : `https://${raw}`).host;
    if (host) allowedOriginHosts.add(normalizeHost(host));
  } catch {
    // ignore invalid host values
  }
};

["localhost", "127.0.0.1"].forEach((h) => allowedOriginHosts.add(h));
addAllowedHost(String(process.env.APP_URL || ""));
addAllowedHost(String(process.env.VERCEL_PROJECT_PRODUCTION_URL || ""));
addAllowedHost(String(process.env.VERCEL_URL || ""));

const pool = DB_CONNECTION ? new Pool({ connectionString: DB_CONNECTION }) : null;

const toDbValue = (value: unknown) => {
  if (value === undefined) return null;
  if (Array.isArray(value) || (value !== null && typeof value === "object")) {
    return JSON.stringify(value);
  }
  return value;
};

const getClientIp = (req: any) => {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "").split(",")[0]?.trim();
  const realIp = String(req.headers?.["x-real-ip"] || "").trim();
  return forwarded || realIp || req.socket?.remoteAddress || "unknown";
};

const getHeaderHost = (value: unknown) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const host = new URL(raw).host;
    return normalizeHost(host);
  } catch {
    return "";
  }
};

const isTrustedRequest = (req: any) => {
  const routeKey = String(req.headers?.["x-db-route-key"] || "").trim();
  if (DB_ROUTE_KEY && routeKey === DB_ROUTE_KEY) return true;
  if (!DB_ROUTE_REQUIRE_TRUSTED) return true;

  const secFetchSite = String(req.headers?.["sec-fetch-site"] || "").toLowerCase();
  if (secFetchSite && !["same-origin", "same-site", "none"].includes(secFetchSite)) {
    return false;
  }

  const originHost = getHeaderHost(req.headers?.origin);
  const refererHost = getHeaderHost(req.headers?.referer);

  if (originHost && allowedOriginHosts.has(originHost)) return true;
  if (refererHost && allowedOriginHosts.has(refererHost)) return true;
  return false;
};

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const current = ipHits.get(ip);
  if (!current || now >= current.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  if (current.count > RATE_LIMIT_PER_WINDOW) return true;
  return false;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = getClientIp(req);
  if (!isTrustedRequest(req) || blockedIps.has(ip)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  if (!pool) {
    return res.status(503).json({ error: "Server database is not configured" });
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
