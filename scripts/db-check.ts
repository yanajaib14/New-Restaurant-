import { getDatabasePool } from '../server/database';
const pool = getDatabasePool();
if (!pool) {
  console.error('Neon database check blocked: DATABASE_URL is missing. Complete Neon sign-in and neon deploy first.');
  process.exitCode = 1;
} else {
  try {
    const result = await pool.query('SELECT 1 AS ready');
    if (Number(result.rows[0]?.ready) !== 1) throw Error('Unexpected query result');
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const names = new Set(tables.rows.map((row: any) => row.table_name));
    const missing = ['tasks', 'task_todos', 'notes', 'calendar_events', 'shopping_list_items', 'team_onboarding'].filter(name => !names.has(name));
    if (missing.length) throw Error('SCHEMA_NOT_READY');
    console.log('PASS: live PostgreSQL query and required application tables.');
  } catch (error: any) {
    console.error('Neon database check failed. Error code:', error?.code || (error?.message === 'SCHEMA_NOT_READY' ? 'SCHEMA_NOT_READY_RUN_DB_MIGRATE' : 'CONNECTION_OR_QUERY_FAILED'));
    process.exitCode = 1;
  } finally { await pool.end(); }
}
