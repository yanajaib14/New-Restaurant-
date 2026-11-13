import { getDatabasePool } from "../../server/database.js";
import { createSettingsTitleHandlers } from "../../server/settings.js";
import { isTrustedRequest } from "../../db/requestGuard.js";

const handlers = createSettingsTitleHandlers(getDatabasePool());

export default async function handler(req: any, res: any) {
  if (!isTrustedRequest(req)) return res.status(403).json({ error: "Forbidden" });
  if (req.method === "GET") return handlers.get(req, res, () => undefined);
  if (req.method === "POST") return handlers.post(req, res, () => undefined);
  return res.status(405).json({ error: "Method not allowed" });
}
