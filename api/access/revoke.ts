import { createPool } from "../../db/pool.js";
import { isTrustedRequest } from "../../db/requestGuard.js";
import { revokeAccess } from "../../db/appRoutes.js";

const pool = createPool();

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isTrustedRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const r = await revokeAccess(pool, req.body?.email, req.body?.revokedBy);
  return res.status(r.status).json(r.body);
}
