import { createPool } from "../../db/pool.js";
import { isTrustedRequest } from "../../db/requestGuard.js";
import { getTitle, setTitle } from "../../db/appRoutes.js";

const pool = createPool();

export default async function handler(req: any, res: any) {
  if (!isTrustedRequest(req)) return res.status(403).json({ error: "Forbidden" });
  if (req.method === "GET") {
    const r = await getTitle(pool);
    return res.status(r.status).json(r.body);
  }
  if (req.method === "POST") {
    const r = await setTitle(pool, req.body?.title);
    return res.status(r.status).json(r.body);
  }
  return res.status(405).json({ error: "Method not allowed" });
}
