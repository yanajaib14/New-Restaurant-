import type pg from "pg";

// Logic for the settings and access-list endpoints, shared by the local
// Express server (server.ts) and the Vercel functions in /api.
// Each returns an HTTP status and a JSON body.

type Result = { status: number; body: Record<string, unknown> };

const DEFAULT_TITLE = "ไกลกังวล";

const fail = (error: any, fallback: string): Result => {
  console.error(fallback, error);
  return { status: 500, body: { error: error?.message || fallback } };
};

export async function getTitle(pool: pg.Pool | null): Promise<Result> {
  if (!pool) return { status: 200, body: { ok: true, title: DEFAULT_TITLE, preview: true } };
  try {
    const result = await pool.query(`SELECT value FROM app_settings WHERE key = 'app_title' LIMIT 1`);
    return { status: 200, body: { ok: true, title: result.rows[0]?.value || DEFAULT_TITLE } };
  } catch (error) {
    return fail(error, "Settings read failed");
  }
}

export async function setTitle(pool: pg.Pool | null, rawTitle: unknown): Promise<Result> {
  const title = String(rawTitle || "").trim();
  if (!title) return { status: 400, body: { error: "Missing title" } };
  if (title.length > 200) return { status: 400, body: { error: "Title is too long" } };
  if (!pool) return { status: 200, body: { ok: true, title, preview: true } };
  try {
    await pool.query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ('app_title', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [title]
    );
    return { status: 200, body: { ok: true, title } };
  } catch (error) {
    return fail(error, "Settings update failed");
  }
}

export async function listAccessUsers(pool: pg.Pool | null): Promise<Result> {
  if (!pool) return { status: 200, body: { ok: true, users: [], preview: true } };
  try {
    const result = await pool.query(
      `SELECT id, email, name, role, is_active, created_at, last_login_at, revoked_at, revoked_by
       FROM app_access_users
       ORDER BY role DESC, created_at ASC`
    );
    return { status: 200, body: { ok: true, users: result.rows } };
  } catch (error) {
    return fail(error, "Access list failed");
  }
}

export async function revokeAccess(pool: pg.Pool | null, rawEmail: unknown, rawRevokedBy: unknown): Promise<Result> {
  const email = String(rawEmail || "").trim().toLowerCase();
  const revokedBy = String(rawRevokedBy || "Owner").trim();
  if (!email) return { status: 400, body: { error: "Missing email" } };
  if (!pool) return { status: 200, body: { ok: true, preview: true } };
  try {
    await pool.query(
      `UPDATE app_access_users SET is_active = false, revoked_at = NOW(), revoked_by = $2 WHERE lower(email) = $1`,
      [email, revokedBy]
    );
    return { status: 200, body: { ok: true } };
  } catch (error) {
    return fail(error, "Access revoke failed");
  }
}

export async function restoreAccess(pool: pg.Pool | null, rawEmail: unknown): Promise<Result> {
  const email = String(rawEmail || "").trim().toLowerCase();
  if (!email) return { status: 400, body: { error: "Missing email" } };
  if (!pool) return { status: 200, body: { ok: true, preview: true } };
  try {
    await pool.query(
      `UPDATE app_access_users SET is_active = true, revoked_at = NULL, revoked_by = NULL WHERE lower(email) = $1`,
      [email]
    );
    return { status: 200, body: { ok: true } };
  } catch (error) {
    return fail(error, "Access restore failed");
  }
}
