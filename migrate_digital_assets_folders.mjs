import pg from 'pg';

const { Client } = pg;

const DB_CONNECTION = String(process.env.DATABASE_URL || '').trim();
if (!DB_CONNECTION) {
  throw new Error('Missing DATABASE_URL in environment variables.');
}

const client = new Client({ connectionString: DB_CONNECTION });

async function migrate() {
  await client.connect();

  await client.query(`ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS folder TEXT NOT NULL DEFAULT 'Inbox'`);
  await client.query(`ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS "assetType" TEXT NOT NULL DEFAULT 'Link'`);
  await client.query(`ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS tags TEXT`);

  console.log('digital_assets folder/type/tag migration complete');
  await client.end();
}

migrate().catch(async (err) => {
  console.error('digital_assets migration failed:', err?.message || err);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
