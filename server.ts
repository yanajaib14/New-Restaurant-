import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import session from "express-session";
import { Readable } from "stream";
import { getDatabasePool } from "./server/database";
import { createRecordsHandler } from "./server/records";
import { createDatabaseReadinessHandler } from "./server/readiness";
import { GoogleGenAI } from "@google/genai";
import { createSettingsTitleHandlers } from "./server/settings";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.local") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

const DB_WRITE_TABLES = new Set([
  "tasks", "task_todos", "menu_items", "startup_costs", "operating_costs", "milestones", "notes",
  "vendors", "contacts", "inventory_items", "utility_accounts", "permits", "marketing_posts",
  "training_modules", "daily_checklists", "invoices", "positions", "candidates", "decision_logs",
  "digital_assets", "activity_logs", "shopping_list_items", "cost_calculator_overrides",
  "calendar_events", "team_onboarding"
]);

const DB_CONNECTION = process.env.DATABASE_URL?.trim();
const HAS_DATABASE = Boolean(DB_CONNECTION);

const toDbValue = (value: unknown) => {
  if (value === undefined) return null;
  if (Array.isArray(value) || (value !== null && typeof value === "object")) {
    return JSON.stringify(value);
  }
  return value;
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || process.env.APP_PORT || 4173);
  const pool = getDatabasePool();
  if (!HAS_DATABASE) {
    console.warn("[preview] DATABASE_URL is not set. Running local preview mode with DB-backed routes disabled.");
  }
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  const chatModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  const visionModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  const groqChatModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
  const groqApiKey = process.env.GROQ_API_KEY || "";
  const dbSelectDebugLogs = String(process.env.DB_SELECT_DEBUG_LOGS || "").trim() === "1";
  const dbSelectRateLimitPerMin = Number(process.env.DB_SELECT_RATE_LIMIT_PER_MIN || 120);
  const dbWriteRateLimitPerMin = Number(process.env.DB_WRITE_RATE_LIMIT_PER_MIN || 60);
  const dbRouteKey = String(process.env.DB_ROUTE_KEY || "").trim();
  const dbRouteRequireTrusted = String(process.env.DB_ROUTE_REQUIRE_TRUSTED || "1").trim() !== "0";
  const dbSelectBlockedIps = new Set(
    String(process.env.DB_SELECT_BLOCKED_IPS || "")
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean)
  );
  const dbWriteBlockedIps = new Set(
    String(process.env.DB_WRITE_BLOCKED_IPS || process.env.DB_SELECT_BLOCKED_IPS || "")
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean)
  );
  const dbSelectIpHits = new Map<string, { count: number; resetAt: number }>();
  const dbWriteIpHits = new Map<string, { count: number; resetAt: number }>();
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

  const logDbSelect = (event: string, details: Record<string, unknown>) => {
    if (!dbSelectDebugLogs) return;
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

  const isTrustedDbRequest = (req: any) => {
    const routeKey = String(req.headers?.["x-db-route-key"] || "").trim();
    if (dbRouteKey && routeKey === dbRouteKey) return true;
    if (!dbRouteRequireTrusted) return true;

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

  const isDbSelectRateLimited = (ip: string) => {
    const now = Date.now();
    const current = dbSelectIpHits.get(ip);
    if (!current || now >= current.resetAt) {
      dbSelectIpHits.set(ip, { count: 1, resetAt: now + 60_000 });
      return false;
    }
    current.count += 1;
    return current.count > dbSelectRateLimitPerMin;
  };

  const isDbWriteRateLimited = (ip: string) => {
    const now = Date.now();
    const current = dbWriteIpHits.get(ip);
    if (!current || now >= current.resetAt) {
      dbWriteIpHits.set(ip, { count: 1, resetAt: now + 60_000 });
      return false;
    }
    current.count += 1;
    return current.count > dbWriteRateLimitPerMin;
  };
  const getAiErrorMessage = (error: any) =>
    error?.message || error?.error?.message || "AI request failed";

  const callGroq = async (model: string, systemText: string, userText: string): Promise<string> => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemText },
          { role: "user", content: userText },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || `Groq HTTP ${res.status}`);
    }
    const data: any = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  };

  // Schema changes are versioned SQL migrations, never implicit application startup writes.

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || "restaurant-planner-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
  }));

  // Google OAuth Setup
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL || "http://localhost:3000"}/auth/google/callback`
  );

  // Previous provider authentication is not a Neon Postgres service.
  // Same-origin application API; DATABASE_URL never enters the browser.
  app.all("/api/records/:table", createRecordsHandler(getDatabasePool));

  app.get("/api/health/database", createDatabaseReadinessHandler(getDatabasePool));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/auth/google/url", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/drive.file"],
      prompt: "consent"
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      (req.session as any).tokens = tokens;
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/auth/google/status", (req, res) => {
    res.json({ connected: !!(req.session as any).tokens });
  });

  app.post("/api/drive/save", async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) {
      return res.status(401).json({ error: "Not connected to Google Drive" });
    }

    const { name, type, base64 } = req.body;
    if (!name || !type || !base64) {
      return res.status(400).json({ error: "Missing file data" });
    }

    try {
      oauth2Client.setCredentials(tokens);
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      const buffer = Buffer.from(base64, 'base64');
      const response = await drive.files.create({
        requestBody: {
          name: name,
          mimeType: type,
        },
        media: {
          mimeType: type,
          body: Readable.from(buffer),
        },
      });

      res.json({ success: true, fileId: response.data.id });
    } catch (error) {
      console.error("Drive Save Error:", error);
      res.status(500).json({ error: "Failed to save to Drive" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    if (!geminiApiKey && !groqApiKey) {
      return res.status(500).json({ error: "AI service is not configured. Add GEMINI_API_KEY or GROQ_API_KEY." });
    }

    const { message, systemInstruction } = req.body || {};
    const text = String(message || "").trim();
    if (!text) {
      return res.status(400).json({ error: "Missing message" });
    }

    const systemText = String(systemInstruction || "You are a concise, practical restaurant operations assistant.");
    let lastError: any = null;

    // 1. Try Gemini first
    if (geminiApiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      for (const model of chatModels) {
        try {
          const result = await ai.models.generateContent({
            model,
            contents: text,
            config: { systemInstruction: systemText },
          });
          return res.json({ text: result.text || "", provider: "gemini" });
        } catch (error: any) {
          lastError = error;
          console.warn(`Gemini ${model} failed:`, error?.message);
        }
      }
    }

    // 2. Fall back to Groq
    if (groqApiKey) {
      for (const model of groqChatModels) {
        try {
          const responseText = await callGroq(model, systemText, text);
          return res.json({ text: responseText, provider: "groq" });
        } catch (error: any) {
          lastError = error;
          console.warn(`Groq ${model} failed:`, error?.message);
        }
      }
    }

    console.error("All AI providers failed:", lastError);
    return res.status(500).json({ error: getAiErrorMessage(lastError) });
  });

  app.get("/api/dropbox/photos", async (_req, res) => {
    try {
      const { fetchDropboxPhotos } = await import("./api/dropbox/photos");
      const photos = await fetchDropboxPhotos();
      res.json({ photos, configured: Boolean(process.env.DROPBOX_ACCESS_TOKEN) });
    } catch (error: any) {
      console.error("Dropbox photos error:", error?.message || error);
      res.json({ photos: [], configured: false });
    }
  });

  app.post("/api/ai/invoice", async (req, res) => {
    if (!geminiApiKey && !groqApiKey) {
      return res.status(500).json({ error: "AI service is not configured. Add GEMINI_API_KEY or GROQ_API_KEY." });
    }

    const { base64Data, mimeType } = req.body || {};
    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: "Missing invoice image data" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const prompt = "Extract invoice details: Vendor Name, Date (YYYY-MM-DD), Total Amount, Category (Operations, Food, Beverage, Marketing, Utilities), and a list of items (name, quantity, price). Return as JSON.";
      let lastError: any = null;

      for (const model of visionModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: {
              parts: [
                { text: prompt },
                { inlineData: { data: String(base64Data), mimeType: String(mimeType) } },
              ],
            },
            config: {
              responseMimeType: "application/json",
            },
          });

          return res.json({ text: response.text || "{}" });
        } catch (error: any) {
          lastError = error;
        }
      }

      // Groq doesn't support vision — skip image extraction, return empty JSON so caller handles it
      if (groqApiKey) {
        console.warn("Gemini vision unavailable; Groq does not support image input. Invoice extraction skipped.");
        return res.status(200).json({ text: "{}", provider: "groq-fallback-no-vision" });
      }

      throw lastError || new Error("No AI model could process the invoice");
    } catch (error: any) {
      console.error("AI invoice error:", error);
      return res.status(500).json({ error: getAiErrorMessage(error) || "Invoice AI request failed" });
    }
  });

  app.post("/api/db/write", async (req, res) => {
    const ip = getClientIp(req);

    if (!isTrustedDbRequest(req) || dbWriteBlockedIps.has(ip)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (isDbWriteRateLimited(ip)) {
      return res.status(429).json({ error: "Too many requests" });
    }

    const { table, action, payload, id } = req.body || {};

    if (!pool) {
      return res.status(503).json({ error: "Database unavailable in local preview mode" });
    }

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
        return res.json({ ok: true, row: result.rows[0] });
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
        return res.json({ ok: true, row: result.rows[0] || null });
      }

      if (id === undefined || id === null) return res.status(400).json({ error: "Missing id" });
      const q = `DELETE FROM ${table} WHERE id = $1`;
      await pool.query(q, [id]);
      return res.json({ ok: true });
    } catch (error: any) {
      console.error("DB Write Fallback Error:", error);
      return res.status(500).json({ error: error?.message || "DB write failed" });
    }
  });

  app.get("/api/db/select", async (req, res) => {
    const ip = getClientIp(req);
    const table = String(req.query?.table || "");

    if (!isTrustedDbRequest(req)) {
      logDbSelect("untrusted_request", { ip, table, origin: req.headers?.origin || null, referer: req.headers?.referer || null });
      return res.status(403).json({ error: "Forbidden" });
    }

    if (dbSelectBlockedIps.has(ip)) {
      logDbSelect("blocked_ip", { ip, table });
      return res.status(403).json({ error: "Forbidden" });
    }

    if (isDbSelectRateLimited(ip)) {
      logDbSelect("rate_limited", { ip, table, limitPerMinute: dbSelectRateLimitPerMin });
      return res.status(429).json({ error: "Too many requests" });
    }

    if (!pool) {
      logDbSelect("preview_fallback", { ip, table });
      return res.json({ ok: true, rows: [], preview: true });
    }

    if (!DB_WRITE_TABLES.has(table)) {
      logDbSelect("invalid_table", { ip, table });
      return res.status(400).json({ error: "Invalid table" });
    }

    try {
      const result = await pool.query(`SELECT * FROM ${table}`);
      logDbSelect("success", { ip, table, rows: result.rows?.length || 0 });
      return res.json({ ok: true, rows: result.rows || [] });
    } catch (error: any) {
      console.error("DB Read Fallback Error:", error);
      logDbSelect("db_error", { ip, table, message: error?.message || "DB select failed" });
      return res.status(500).json({ error: error?.message || "DB select failed" });
    }
  });

  app.get("/api/access/check", async (req, res) => {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Missing email" });

    if (!pool) {
      return res.json({ exists: false, isActive: true, role: "Manager", preview: true });
    }

    try {
      const result = await pool.query(
        `SELECT email, role, is_active FROM app_access_users WHERE lower(email) = $1 LIMIT 1`,
        [email]
      );

      if (!result.rows.length) {
        return res.json({ exists: false, isActive: true, role: "Manager" });
      }

      const row = result.rows[0];
      return res.json({
        exists: true,
        isActive: !!row.is_active,
        role: row.role || "Manager",
      });
    } catch (error: any) {
      console.error("Access check error:", error);
      return res.status(500).json({ error: error?.message || "Access check failed" });
    }
  });

  app.post("/api/access/upsert-login", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const userId = String(req.body?.userId || "").trim() || null;
    const inputName = String(req.body?.name || "").trim() || null;
    const requestedRole = String(req.body?.role || "Manager").trim();
    const hasOwnerLevelAccess = email === "yanajaib@gmail.com" || requestedRole === "Owner";
    const role = hasOwnerLevelAccess ? "Owner" : "Manager";
    const name = email === "yanajaib@gmail.com" ? "Partner" : inputName;

    if (!email) return res.status(400).json({ error: "Missing email" });

    if (!pool) {
      return res.json({ ok: true, isActive: true, role, preview: true });
    }

    try {
      const existing = await pool.query(
        `SELECT role, is_active FROM app_access_users WHERE lower(email) = $1 LIMIT 1`,
        [email]
      );

      const effectiveRole = hasOwnerLevelAccess ? "Owner" : (existing.rows[0]?.role || role);

      const result = await pool.query(
        `
        INSERT INTO app_access_users (user_id, email, name, role, is_active, last_login_at)
        VALUES ($1, $2, $3, $4, true, NOW())
        ON CONFLICT (email)
        DO UPDATE SET
          user_id = COALESCE(EXCLUDED.user_id, app_access_users.user_id),
          name = COALESCE(EXCLUDED.name, app_access_users.name),
          role = EXCLUDED.role,
          last_login_at = NOW()
        RETURNING email, role, is_active
        `,
        [userId, email, name, effectiveRole]
      );

      const row = result.rows[0];
      return res.json({ ok: true, isActive: !!row.is_active, role: row.role || "Manager" });
    } catch (error: any) {
      console.error("Access upsert error:", error);
      return res.status(500).json({ error: error?.message || "Access upsert failed" });
    }
  });

  app.get("/api/access/users", async (_req, res) => {
    if (!pool) {
      return res.json({ ok: true, users: [], preview: true });
    }

    try {
      const result = await pool.query(
        `
        SELECT id, email, name, role, is_active, created_at, last_login_at, revoked_at, revoked_by
        FROM app_access_users
        ORDER BY role DESC, created_at ASC
        `
      );
      return res.json({ ok: true, users: result.rows });
    } catch (error: any) {
      console.error("Access list error:", error);
      return res.status(500).json({ error: error?.message || "Access list failed" });
    }
  });

  app.post("/api/access/revoke", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const revokedBy = String(req.body?.revokedBy || "Owner").trim();
    if (!email) return res.status(400).json({ error: "Missing email" });

    if (!pool) {
      return res.json({ ok: true, preview: true });
    }

    try {
      await pool.query(
        `
        UPDATE app_access_users
        SET is_active = false, revoked_at = NOW(), revoked_by = $2
        WHERE lower(email) = $1
        `,
        [email, revokedBy]
      );
      return res.json({ ok: true });
    } catch (error: any) {
      console.error("Access revoke error:", error);
      return res.status(500).json({ error: error?.message || "Access revoke failed" });
    }
  });

  app.post("/api/access/restore", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Missing email" });

    if (!pool) {
      return res.json({ ok: true, preview: true });
    }

    try {
      await pool.query(
        `
        UPDATE app_access_users
        SET is_active = true, revoked_at = NULL, revoked_by = NULL
        WHERE lower(email) = $1
        `,
        [email]
      );
      return res.json({ ok: true });
    } catch (error: any) {
      console.error("Access restore error:", error);
      return res.status(500).json({ error: error?.message || "Access restore failed" });
    }
  });

  const settingsTitleHandlers = createSettingsTitleHandlers(pool);
  app.get("/api/settings/title", settingsTitleHandlers.get);
  app.post("/api/settings/title", settingsTitleHandlers.post);

  app.post("/api/auth/change-password", (_req, res) => {
    res.status(503).json({ error: "Account authentication is not configured. Neon Postgres alone does not provide sign-in." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
