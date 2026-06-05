import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import session from "express-session";
import { Readable } from "stream";
import pg from "pg";
import { InsForgeClient } from "@insforge/sdk";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Pool } = pg;

dotenv.config({ path: path.resolve(__dirname, ".env.local") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

const DB_WRITE_TABLES = new Set([
  "tasks", "task_todos", "menu_items", "startup_costs", "operating_costs", "milestones", "notes",
  "vendors", "contacts", "inventory_items", "utility_accounts", "permits", "marketing_posts",
  "training_modules", "daily_checklists", "invoices", "positions", "candidates", "decision_logs",
  "digital_assets", "activity_logs", "shopping_list_items", "cost_calculator_overrides",
  "calendar_events"
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
  const pool = HAS_DATABASE ? new Pool({ connectionString: DB_CONNECTION }) : null;
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

  // Auto-create all application tables if they don't exist yet
  if (pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      category TEXT NOT NULL,
      task TEXT NOT NULL,
      due TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Not Started',
      priority TEXT NOT NULL DEFAULT 'Medium',
      checklist JSONB DEFAULT '[]'::jsonb,
      "assignedTo" TEXT,
      "isCritical" BOOLEAN DEFAULT false,
      "linkedNoteId" BIGINT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "linkedNoteId" BIGINT`).catch(() => {});
  await pool.query(`ALTER TABLE tasks ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON tasks FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS task_todos (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Not Started',
      "assignedTo" TEXT,
      "linkedTaskId" BIGINT,
      "linkUrl" TEXT,
      note TEXT,
      subtasks JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE task_todos ADD COLUMN IF NOT EXISTS "linkUrl" TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE task_todos ADD COLUMN IF NOT EXISTS note TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE task_todos ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb`).catch(() => {});
  await pool.query(`ALTER TABLE task_todos ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_todos' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON task_todos FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      section TEXT NOT NULL,
      name TEXT NOT NULL,
      "desc" TEXT NOT NULL DEFAULT '',
      price NUMERIC NOT NULL DEFAULT 0,
      "foodCost" NUMERIC NOT NULL DEFAULT 0,
      hero BOOLEAN DEFAULT false,
      notes TEXT,
      "imageUrl" TEXT,
      ingredients JSONB DEFAULT '[]'::jsonb,
      "costPerBottle" NUMERIC,
      "sellPriceBottle" NUMERIC,
      "sellPriceGlass" NUMERIC,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='menu_items' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON menu_items FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS startup_costs (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      category TEXT NOT NULL,
      budgeted NUMERIC NOT NULL DEFAULT 0,
      actual NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE startup_costs ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='startup_costs' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON startup_costs FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS operating_costs (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      category TEXT NOT NULL,
      monthly NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE operating_costs ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='operating_costs' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON operating_costs FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS milestones (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      milestone TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT '',
      phase TEXT NOT NULL DEFAULT 'Pre-Launch',
      done BOOLEAN DEFAULT false,
      "assignedTo" TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE milestones ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='milestones' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON milestones FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      tag TEXT NOT NULL DEFAULT 'General',
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      files JSONB DEFAULT '[]'::jsonb,
      "linkedTaskId" BIGINT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE notes ADD COLUMN IF NOT EXISTS "linkedTaskId" BIGINT`).catch(() => {});
  await pool.query(`ALTER TABLE notes ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notes' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON notes FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      name TEXT NOT NULL,
      contact TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      "deliveryDays" JSONB DEFAULT '[]'::jsonb,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE vendors ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendors' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON vendors FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'General',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE contacts ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contacts' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON contacts FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Operating Supplies',
      department TEXT NOT NULL DEFAULT 'Kitchen',
      "procurementStatus" TEXT NOT NULL DEFAULT 'Not Ordered',
      "vendorId" BIGINT,
      price NUMERIC NOT NULL DEFAULT 0,
      "leadTime" TEXT NOT NULL DEFAULT '',
      "currentStock" INT NOT NULL DEFAULT 0,
      "parLevel" INT NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT '',
      "lastOrdered" TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='inventory_items' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON inventory_items FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS utility_accounts (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      name TEXT NOT NULL,
      "accountNumber" TEXT NOT NULL DEFAULT '',
      "loginInfo" TEXT NOT NULL DEFAULT '',
      "monthlyCost" NUMERIC NOT NULL DEFAULT 0,
      "startDate" TEXT NOT NULL DEFAULT '',
      "fileUrl" TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE utility_accounts ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='utility_accounts' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON utility_accounts FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS permits (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL DEFAULT '',
      "expiryDate" TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending',
      "fileUrl" TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE permits ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='permits' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON permits FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS marketing_posts (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Draft',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE marketing_posts ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marketing_posts' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON marketing_posts FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS training_modules (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      completed BOOLEAN DEFAULT false,
      "videoUrl" TEXT,
      date TEXT,
      steps JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_modules' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON training_modules FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_checklists (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      title TEXT NOT NULL,
      shift TEXT NOT NULL DEFAULT 'AM',
      "assignedTo" TEXT,
      items JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE daily_checklists ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_checklists' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON daily_checklists FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      "vendorName" TEXT NOT NULL,
      "paidBy" TEXT,
      "paymentMethod" TEXT,
      "creditCardName" TEXT,
      "checkNumber" TEXT,
      date TEXT NOT NULL DEFAULT '',
      amount NUMERIC NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending',
      items JSONB DEFAULT '[]'::jsonb,
      "fileUrl" TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE invoices ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "paidBy" TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "creditCardName" TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "checkNumber" TEXT`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='invoices' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON invoices FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      role TEXT NOT NULL,
      openings INT NOT NULL DEFAULT 1,
      hired INT NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Urgent',
      salary TEXT,
      "compPlan" TEXT,
      "offerLetterUrl" TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE positions ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='positions' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON positions FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS candidates (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      name TEXT NOT NULL,
      position TEXT NOT NULL DEFAULT '',
      "resumeUrl" TEXT,
      stage TEXT NOT NULL DEFAULT 'Applied',
      date TEXT,
      feedback TEXT,
      "trialScores" JSONB,
      "partnerNotes" TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE candidates ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='candidates' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON candidates FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS decision_logs (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      title TEXT NOT NULL,
      decision TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      impact TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'Proposed',
      "nextStep" TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE decision_logs ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='decision_logs' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON decision_logs FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      "user" TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activity_logs' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON activity_logs FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS digital_assets (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      folder TEXT NOT NULL DEFAULT 'Inbox',
      "assetType" TEXT NOT NULL DEFAULT 'Link',
      tags TEXT,
      url TEXT NOT NULL DEFAULT '',
      "loginInfo" TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS folder TEXT NOT NULL DEFAULT 'Inbox'`).catch(() => {});
  await pool.query(`ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS "assetType" TEXT NOT NULL DEFAULT 'Link'`).catch(() => {});
  await pool.query(`ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS tags TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE digital_assets ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='digital_assets' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON digital_assets FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shopping_list_items (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      name TEXT NOT NULL,
      quantity NUMERIC NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT '',
      "totalCost" NUMERIC NOT NULL DEFAULT 0,
      items TEXT DEFAULT '[]',
      category TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      "purchaseType" TEXT,
      "vendorName" TEXT,
      "storeName" TEXT,
      "storeUrl" TEXT,
      "sourceKey" TEXT,
      "isManual" BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE shopping_list_items ADD COLUMN IF NOT EXISTS "isManual" BOOLEAN DEFAULT false`).catch(() => {});
  await pool.query(`ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shopping_list_items' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON shopping_list_items FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cost_calculator_overrides (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      "itemId" BIGINT NOT NULL,
      price NUMERIC NOT NULL DEFAULT 0,
      "targetFoodCost" NUMERIC NOT NULL DEFAULT 0,
      ingredients JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE cost_calculator_overrides ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cost_calculator_overrides' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON cost_calculator_overrides FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      type TEXT NOT NULL DEFAULT 'Event',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY`).catch(() => {});
  await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='calendar_events' AND policyname='Public full access') THEN CREATE POLICY "Public full access" ON calendar_events FOR ALL USING (true) WITH CHECK (true); END IF; END $$`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_access_users (
      id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      user_id TEXT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'Manager',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,
      revoked_by TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(
    `INSERT INTO app_settings (key, value) VALUES ('app_title', 'ไกลกังวล') ON CONFLICT (key) DO NOTHING`
  );
  }

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

  // InsForge Setup (optional in local dev; required for password verification endpoint)
  const insforgeUrl = String(process.env.VITE_INSFORGE_URL || process.env.INSFORGE_URL || "").trim().replace(/\/$/, "");
  const insforgeKey = String(process.env.VITE_INSFORGE_KEY || process.env.INSFORGE_KEY || "").trim();
  const insforge = (insforgeUrl && insforgeKey)
    ? new InsForgeClient({
        baseUrl: insforgeUrl,
        anonKey: insforgeKey,
      })
    : null;

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

  app.get("/api/settings/title", async (_req, res) => {
    if (!pool) {
      return res.json({ ok: true, title: "ไกลกังวล", preview: true });
    }

    try {
      const result = await pool.query(`SELECT value FROM app_settings WHERE key = 'app_title' LIMIT 1`);
      return res.json({ ok: true, title: result.rows[0]?.value || "ไกลกังวล" });
    } catch (error: any) {
      console.error("Settings title get error:", error);
      return res.status(500).json({ error: error?.message || "Settings read failed" });
    }
  });

  app.post("/api/settings/title", async (req, res) => {
    const title = String(req.body?.title || "").trim();
    if (!title) return res.status(400).json({ error: "Missing title" });

    if (!pool) {
      return res.json({ ok: true, title, preview: true });
    }

    try {
      await pool.query(
        `
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('app_title', $1, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `,
        [title]
      );
      return res.json({ ok: true, title });
    } catch (error: any) {
      console.error("Settings title update error:", error);
      return res.status(500).json({ error: error?.message || "Settings update failed" });
    }
  });

  app.post("/api/auth/change-password", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const oldPassword = String(req.body?.oldPassword || "");
    const newPassword = String(req.body?.newPassword || "");

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    try {
      if (!insforge) {
        return res.status(500).json({ error: "InsForge auth is not configured on the server" });
      }

      // Verify current password by attempting sign-in with InsForge
      const signInRes = await insforge.auth.signInWithPassword({
        email,
        password: oldPassword,
      });

      if (signInRes.error) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Note: Password update is handled client-side via InsForge SDK
      // This endpoint verifies the old password and logs the change
      return res.json({ ok: true, message: "Password verified. Please complete update on client." });
    } catch (error: any) {
      console.error("Password verification error:", error);
      return res.status(500).json({ error: error?.message || "Password verification failed" });
    }
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
