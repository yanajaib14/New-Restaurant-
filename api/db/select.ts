import pg from "pg";

const { Pool } = pg;

const DB_READ_TABLES = new Set([
  "tasks", "task_todos", "menu_items", "startup_costs", "operating_costs", "milestones", "notes",
  "vendors", "contacts", "inventory_items", "utility_accounts", "permits", "marketing_posts",
  "training_modules", "daily_checklists", "invoices", "positions", "candidates", "decision_logs",
  "digital_assets", "activity_logs", "shopping_list_items", "cost_calculator_overrides",
  "calendar_events"
]);

const DB_CONNECTION = process.env.DATABASE_URL?.trim();
const DB_SELECT_DEBUG_LOGS = String(process.env.DB_SELECT_DEBUG_LOGS || "").trim() === "1";
const DB_ROUTE_KEY = String(process.env.DB_ROUTE_KEY || "").trim();
const DB_ROUTE_REQUIRE_TRUSTED = String(process.env.DB_ROUTE_REQUIRE_TRUSTED || "1").trim() !== "0";

const pool = DB_CONNECTION ? new Pool({ connectionString: DB_CONNECTION }) : null;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_WINDOW = Number(process.env.DB_SELECT_RATE_LIMIT_PER_MIN || 120);
const blockedIps = new Set(
  String(process.env.DB_SELECT_BLOCKED_IPS || "")
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

const getClientIp = (req: any) => {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "").split(",")[0]?.trim();
  const realIp = String(req.headers?.["x-real-ip"] || "").trim();
  return forwarded || realIp || req.socket?.remoteAddress || "unknown";
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

const logSelect = (event: string, details: Record<string, unknown>) => {
  if (!DB_SELECT_DEBUG_LOGS) return;
  console.log(`[api/db/select] ${event}`, details);
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

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    logSelect("method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = getClientIp(req);
  const table = String(req.query?.table || "");

  if (!isTrustedRequest(req)) {
    logSelect("untrusted_request", { ip, table, origin: req.headers?.origin || null, referer: req.headers?.referer || null });
    return res.status(403).json({ error: "Forbidden" });
  }

  if (blockedIps.has(ip)) {
    logSelect("blocked_ip", { ip, table });
    return res.status(403).json({ error: "Forbidden" });
  }

  if (isRateLimited(ip)) {
    logSelect("rate_limited", { ip, table, limitPerMinute: RATE_LIMIT_PER_WINDOW });
    return res.status(429).json({ error: "Too many requests" });
  }

  if (!pool) {
    logSelect("preview_fallback", { ip, table });
    return res.status(200).json({ ok: true, rows: [], preview: true });
  }

  if (!DB_READ_TABLES.has(table)) {
    logSelect("invalid_table", { ip, table });
    return res.status(400).json({ error: "Invalid table" });
  }

  try {
    const result = await pool.query(`SELECT * FROM ${table}`);
    logSelect("success", { ip, table, rows: result.rows?.length || 0 });
    return res.status(200).json({ ok: true, rows: result.rows || [] });
  } catch (error: any) {
    console.error("api/db/select error", error);
    logSelect("db_error", { ip, table, message: error?.message || "DB select failed" });
    return res.status(500).json({ error: error?.message || "DB select failed" });
  }
}
