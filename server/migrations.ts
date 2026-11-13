import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const migrationFiles = ['0001_neon_baseline.sql', '20261112_prompt2_functionality.sql'];
export interface MigrationDatabase {
  query(sql: string, values?: any[]): Promise<{ rows: any[] }>;
}
export async function applyMigrations(db: MigrationDatabase) {
  await db.query(`CREATE TABLE IF NOT EXISTS app_schema_migrations (
    name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT NOW()
  )`);
  const applied: string[] = [];
  for (const name of migrationFiles) {
    const sql = await readFile(fileURLToPath(new URL(`../migrations/${name}`, import.meta.url)), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const existing = await db.query('SELECT checksum FROM app_schema_migrations WHERE name = $1', [name]);
    if (existing.rows.length) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${name}`);
      continue;
    }
    await db.query('BEGIN');
    try {
      await db.query(sql);
      await db.query('INSERT INTO app_schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
      await db.query('COMMIT');
      applied.push(name);
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
  return applied;
}
