import { getDatabasePool } from "../../server/database.js";
import { isTrustedRequest } from "../../db/requestGuard.js";
import { restoreAccess } from "../../db/appRoutes.js";

const pool = getDatabasePool();

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isTrustedRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const r = await restoreAccess(pool, req.body?.email);
  return res.status(r.status).json(r.body);
}
