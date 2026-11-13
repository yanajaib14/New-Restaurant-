import { getDatabasePool } from '../../server/database';
import { createDatabaseReadinessHandler } from '../../server/readiness';
const readiness = createDatabaseReadinessHandler(getDatabasePool);
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  return readiness(req, res, () => undefined);
}
