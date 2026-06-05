import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const DB_CONNECTION = String(process.env.DATABASE_URL || '').trim();
if (!DB_CONNECTION) {
  throw new Error('Missing DATABASE_URL in environment variables.');
}

const client = new Client({
  connectionString: DB_CONNECTION
});

async function run() {
  try {
    await client.connect();
    const sql = fs.readFileSync('schema.sql', 'utf8');
    await client.query(sql);
    console.log('SUCCESS');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.end();
  }
}
run();
