/// <reference types="vite/client" />

import { InsForgeClient } from "@insforge/sdk";

const API_URL = import.meta.env.VITE_INSFORGE_URL?.replace(/\/$/, "") || "https://arqsta8h.us-west.insforge.app";
const API_KEY = import.meta.env.VITE_INSFORGE_KEY || "ik_d3902514ce290fc64bb4900a677890ce";

const isConfigured = !!import.meta.env.VITE_INSFORGE_URL && !!import.meta.env.VITE_INSFORGE_KEY;

if (!isConfigured) {
  console.warn("WARNING: Using default InsForge configuration. Set VITE_INSFORGE_URL and VITE_INSFORGE_KEY in .env for production.");
}

export const insforge = new InsForgeClient({
  baseUrl: API_URL,
  anonKey: API_KEY,
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

// For inserts/updates, also fall back when SDK returns no data and no meaningful error
// (silent failure — the SDK accepted the call but didn't actually write anything).
const shouldUseFallbackWrite = (res: any) => {
  if (shouldUseFallback(res)) return true;
  const hasData = res?.data !== null && res?.data !== undefined &&
    !(Array.isArray(res.data) && res.data.length === 0);
  const hasError = res?.error && Object.keys(res.error || {}).length > 0;
  if (!hasData && !hasError) return true;
  return false;
};

const normalizeError = async (res: Response) => {
  try {
    const body = await res.json();
    return body?.error || body || { message: `HTTP ${res.status}` };
  } catch {
    return { message: `HTTP ${res.status}` };
  }
};

const fallbackWrite = async (table: string, action: DbWriteAction, payload?: Record<string, unknown>, id?: number | string) => {
  const res = await fetch("/api/db/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, action, payload, id })
  });

  const data = await res.json();
  if (!res.ok || data?.ok === false) {
    return { data: null, error: data?.error || await normalizeError(res) };
  }

  return { data, error: null };
};

const fallbackRead = async (table: string) => {
  const res = await fetch("/api/db/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table })
  });

  const data = await res.json();
  if (!res.ok || data?.ok === false) {
    return { data: null, error: data?.error || await normalizeError(res) };
  }

  return { data: data?.rows ?? [], error: null };
};

const publishDbChange = async (table: string, action: DbWriteAction, id?: number | string) => {
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
  try {
    const res = await insforge.database.from(table).select("*");
    // Treat null data with no error as a silent failure so callers don't
    // accidentally clear their in-memory state with an empty array.
    if (res.data === null && !res.error) {
      throw new Error("No data returned from SDK");
    }
    if (res.error) {
      throw res.error;
    }
    return { data: res.data || [], error: null };
  } catch (error) {
    const fallback = await fallbackRead(table);
    if (!fallback.error) {
      return fallback;
    }
    return { data: null, error: error || fallback.error };
  }
}

export async function dbInsert(table: string, payload: Record<string, unknown>) {
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
