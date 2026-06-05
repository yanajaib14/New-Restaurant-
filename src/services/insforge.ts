/// <reference types="vite/client" />

import { InsForgeClient } from "@insforge/sdk";

// Fallback to hardcoded values if Vite env vars aren't injected at build time.
// The anon key is public (already in vercel.json in this repo).
const INSFORGE_URL_FALLBACK = "https://arqsta8h.us-west.insforge.app";
const INSFORGE_KEY_FALLBACK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODI1MTh9.ikn8Ho2VKqZXq9vzCdmyX6zwL_sxCSwPKUKYiR4VGeM";

const API_URL = String(import.meta.env.VITE_INSFORGE_URL || INSFORGE_URL_FALLBACK).trim().replace(/\/$/, "");
const API_KEY = String(import.meta.env.VITE_INSFORGE_KEY || INSFORGE_KEY_FALLBACK).trim();
export const HAS_INSFORGE_CONFIG = Boolean(API_URL && API_KEY);


export const insforge = new InsForgeClient({
  // Keep instance creation stable for realtime call sites; when env vars are
  // missing, writes/reads are routed through fallback endpoints below.
  baseUrl: API_URL || "https://invalid.local",
  anonKey: API_KEY || "missing-insforge-key",
});

export const SYNC_CHANNEL = "restaurant:sync";
const DB_CHANGED_EVENT = "db_changed";

type DbWriteAction = "insert" | "update" | "delete";

const shouldUseFallback = (res: any) => {
  const status = Number(res?.status || 0);
  if (status === 404 || status === 405) return true;

  const errCode = String(res?.error?.code || "");
  const errMsg = String(res?.error?.message || "");
  if (errCode === "404" || errCode === "405" || /HTTP\s*40[45]/i.test(errMsg)) return true;

  // Some SDK responses return an empty error object {} for unsupported writes.
  if (res?.error && typeof res.error === "object" && Object.keys(res.error).length === 0) return true;

  return false;
};

// Fall back only on explicit HTTP 404/405 or error responses.
// An empty data array with no error is a successful write (PostgREST "return=minimal").
const shouldUseFallbackWrite = (res: any) => {
  return shouldUseFallback(res);
};

const normalizeError = async (res: Response) => {
  try {
    const body = await res.json();
    return body?.error || body || { message: `HTTP ${res.status}` };
  } catch {
    return { message: `HTTP ${res.status}` };
  }
};

const fallbackSelect = async (table: string) => {
  const res = await fetch(`/api/db/select?table=${encodeURIComponent(table)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    return { data: null, error: await normalizeError(res) };
  }

  const body = await res.json();
  return { data: Array.isArray(body?.rows) ? body.rows : [], error: null };
};

const fallbackWrite = async (table: string, action: DbWriteAction, payload?: Record<string, unknown>, id?: number | string) => {
  const res = await fetch("/api/db/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, action, payload, id })
  });

  if (!res.ok) {
    return { data: null, error: await normalizeError(res) };
  }

  const data = await res.json();
  return { data, error: null };
};

const publishDbChange = async (table: string, action: DbWriteAction, id?: number | string) => {
  if (!HAS_INSFORGE_CONFIG) return;
  try {
    await insforge.realtime.publish(SYNC_CHANNEL, DB_CHANGED_EVENT, {
      table,
      action,
      id: id ?? null,
      at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("Realtime publish failed", e);
  }
};

export async function dbSelect(table: string) {
  if (!HAS_INSFORGE_CONFIG) {
    return fallbackSelect(table);
  }

  const res = await insforge.database.from(table).select("*");

  // Only fall back to the API route if InsForge itself isn't reachable (404/405).
  // For all other outcomes (errors, null data, empty arrays) return directly
  // so Vercel's /api/db/select is never called when InsForge is configured.
  if (shouldUseFallback(res)) {
    return fallbackSelect(table);
  }

  if (res.error) {
    return { data: [], error: res.error };
  }

  return { data: res.data || [], error: null };
}

export async function dbInsert(table: string, payload: Record<string, unknown>) {
  if (!HAS_INSFORGE_CONFIG) {
    return fallbackWrite(table, "insert", payload);
  }

  const res = await insforge.database.from(table).insert([payload]);
  if (shouldUseFallbackWrite(res)) {
    const fb = await fallbackWrite(table, "insert", payload);
    if (!fb.error) {
      await publishDbChange(table, "insert");
    }
    return fb;
  }
  if (!res.error) {
    await publishDbChange(table, "insert");
  }
  return { data: res.data, error: res.error };
}

export async function dbUpdate(table: string, id: number | string, payload: Record<string, unknown>) {
  if (!HAS_INSFORGE_CONFIG) {
    return fallbackWrite(table, "update", payload, id);
  }

  const res = await insforge.database.from(table).update(payload).eq("id", id);
  if (shouldUseFallbackWrite(res)) {
    const fb = await fallbackWrite(table, "update", payload, id);
    if (!fb.error) {
      await publishDbChange(table, "update", id);
    }
    return fb;
  }
  if (!res.error) {
    await publishDbChange(table, "update", id);
  }
  return { data: res.data, error: res.error };
}

export async function dbDelete(table: string, id: number | string) {
  if (!HAS_INSFORGE_CONFIG) {
    return fallbackWrite(table, "delete", void 0, id);
  }

  const res = await insforge.database.from(table).delete().eq("id", id);
  if (shouldUseFallback(res)) {
    const fb = await fallbackWrite(table, "delete", void 0, id);
    if (!fb.error) {
      await publishDbChange(table, "delete", id);
    }
    return fb;
  }
  if (!res.error) {
    await publishDbChange(table, "delete", id);
  }
  return { data: res.data, error: res.error };
}
