import type { RequestHandler } from 'express';
import type { RecordsPool } from './records';
export function createDatabaseReadinessHandler(getPool: () => RecordsPool | null): RequestHandler {
  return async (_req, res) => {
    const pool = getPool();
    if (!pool) return res.status(503).json({status:'unavailable',error:'DATABASE_URL is not configured'});
    try {
      await pool.query('SELECT 1 AS ready');
      const result = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      const tables = new Set(result.rows.map(row => row.table_name));
      const missing = ['tasks','task_todos','notes','calendar_events','team_onboarding','shopping_list_items'].filter(table=>!tables.has(table));
      if (missing.length) return res.status(503).json({status:'schema_required',error:'Apply the versioned database migrations'});
      return res.json({status:'ready',database:'postgres'});
    } catch {
      return res.status(503).json({status:'unavailable',error:'Database connection or readiness query failed'});
    }
  };
}
