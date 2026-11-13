import { getDatabasePool } from "../server/database.js";
import { createRecordsHandler } from "../server/records.js";

const records = createRecordsHandler(getDatabasePool);

// Serves /api/records/<table>. vercel.json rewrites that path to
// /api/records?table=<table>, keeping the original query (e.g. ?id=eq.5).
export default async function handler(req: any, res: any) {
  const table = req.query?.table;
  if (typeof table !== "string") return res.status(400).json({ error: "Invalid table" });
  req.params = { ...req.params, table };
  return records(req, res, () => undefined);
}
