// Browser data layer. All reads and writes go through this app's own
// /api/db/* routes, which talk to the Neon Postgres database server-side.
// The database connection string never reaches the browser.

type DbWriteAction = "insert" | "update" | "delete";
type DbResult<T = any> = { data: T | null; error: { message: string } | null };

const readError = async (res: Response) => {
  try {
    const body = await res.json();
    const err = body?.error;
    return { message: typeof err === "string" ? err : err?.message || `HTTP ${res.status}` };
  } catch {
    return { message: `HTTP ${res.status}` };
  }
};

export async function dbSelect(table: string): Promise<DbResult<any[]>> {
  try {
    const res = await fetch(`/api/db/select?table=${encodeURIComponent(table)}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return { data: [], error: await readError(res) };
    const body = await res.json();
    return { data: Array.isArray(body?.rows) ? body.rows : [], error: null };
  } catch (e: any) {
    return { data: [], error: { message: e?.message || "Network error" } };
  }
}

async function dbWrite(table: string, action: DbWriteAction, payload?: Record<string, unknown>, id?: number | string): Promise<DbResult> {
  try {
    const res = await fetch("/api/db/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, action, payload, id }),
    });
    if (!res.ok) return { data: null, error: await readError(res) };
    const body = await res.json();
    return { data: body?.row ? [body.row] : body, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message || "Network error" } };
  }
}

export const dbInsert = (table: string, payload: Record<string, unknown>) => dbWrite(table, "insert", payload);
export const dbUpdate = (table: string, id: number | string, payload: Record<string, unknown>) => dbWrite(table, "update", payload, id);
export const dbDelete = (table: string, id: number | string) => dbWrite(table, "delete", undefined, id);
