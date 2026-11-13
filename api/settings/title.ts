import { getDatabasePool } from "../../server/database";
import { createSettingsTitleHandlers } from "../../server/settings";

const DB_CONNECTION = process.env.DATABASE_URL?.trim();
const pool = getDatabasePool();
const handlers = createSettingsTitleHandlers(pool);

export default async function handler(req: any, res: any) {
  if (req.method === "GET") return handlers.get(req, res, () => undefined);
  if (req.method === "POST") return handlers.post(req, res, () => undefined);
  return res.status(405).json({ error: "Method not allowed" });
}
