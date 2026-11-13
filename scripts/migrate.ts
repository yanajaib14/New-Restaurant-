import dotenv from 'dotenv';
import pg from 'pg';
import { applyMigrations } from '../server/migrations';
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ path: '.env', quiet: true });
const url = process.env.DATABASE_URL_UNPOOLED?.trim();
if (!url) {
  console.error('Migration blocked: DATABASE_URL_UNPOOLED is missing. Complete Neon sign-in and neon deploy first.');
  process.exitCode = 1;
} else {
  let client: pg.Client | undefined;
  try {
    const parsed = new URL(url);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || parsed.hostname.includes('-pooler.')) {
      throw new Error('Migrations require a direct PostgreSQL URL, not a pooled endpoint.');
    }
    client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 15000 });
    await client.connect();
    await client.query('SELECT pg_advisory_lock(713591402)');
    const applied = await applyMigrations(client);
    console.log(applied.length ? `Applied ${applied.length} additive migrations: ${applied.join(', ')}` : 'Database migrations already current.');
  } catch (error: any) {
    console.error('Migration failed; no connection credentials were logged. Error code:', error?.code || 'CONFIGURATION_OR_SQL_ERROR');
    process.exitCode = 1;
  } finally {
    if (client) { await client.query('SELECT pg_advisory_unlock(713591402)').catch(() => {}); await client.end(); }
  }
}
