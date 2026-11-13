import { getDatabasePool } from '../../server/database';
import { createRecordsHandler } from '../../server/records';

const records = createRecordsHandler(getDatabasePool);
export default async function handler(req: any, res: any) {
  // Vercel dynamic route values live in query; Express uses params.
  const table = req.query?.table;
  if (typeof table !== 'string') return res.status(400).json({error:'Invalid table'});
  req.params = { ...req.params, table };
  return records(req, res, () => undefined);
}
