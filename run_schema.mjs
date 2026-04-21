import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:211919448a449a8c985b520fc3895aeb@arqsta8h.us-west.database.insforge.app:5432/insforge?sslmode=require'
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
