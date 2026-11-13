import type { RequestHandler } from "express";

export const DEFAULT_APP_TITLE = "ไกลกังวล";
export const MAX_APP_TITLE_LENGTH = 120;

export interface SettingsTitlePool {
  query(
    sql: string,
    values?: unknown[]
  ): Promise<{ rows: Array<{ value?: unknown }> }>;
}

export function createSettingsTitleHandlers(pool: SettingsTitlePool | null) {
  const get: RequestHandler = async (_req, res) => {
    if (!pool) {
      return res.json({ ok: true, title: DEFAULT_APP_TITLE, preview: true });
    }

    try {
      const result = await pool.query(
        "SELECT value FROM app_settings WHERE key = 'app_title' LIMIT 1"
      );
      const value = result.rows[0]?.value;
      return res.json({ ok: true, title: typeof value === "string" && value ? value : DEFAULT_APP_TITLE });
    } catch (error) {
      console.error("Settings title get error:", error);
      return res.status(500).json({ error: "Settings read failed" });
    }
  };

  const post: RequestHandler = async (req, res) => {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) return res.status(400).json({ error: "Missing title" });
    if (title.length > MAX_APP_TITLE_LENGTH) {
      return res.status(400).json({ error: `Title must be ${MAX_APP_TITLE_LENGTH} characters or fewer` });
    }
    if (!pool) return res.status(503).json({ error: "Settings storage is unavailable" });

    try {
      await pool.query(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ('app_title', $1, NOW())
         ON CONFLICT (key)
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [title]
      );
      return res.json({ ok: true, title });
    } catch (error) {
      console.error("Settings title update error:", error);
      return res.status(500).json({ error: "Settings update failed" });
    }
  };

  return { get, post };
}
