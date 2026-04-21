import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:211919448a449a8c985b520fc3895aeb@arqsta8h.us-west.database.insforge.app:5432/insforge?sslmode=require'
});

const TABLES = [
  'tasks', 'menu_items', 'startup_costs', 'operating_costs',
  'milestones', 'notes', 'vendors', 'inventory_items',
  'utility_accounts', 'permits', 'marketing_posts', 'training_modules',
  'daily_checklists', 'invoices', 'positions', 'candidates',
  'activity_logs', 'digital_assets'
];

async function check() {
  await client.connect();
  console.log('--- Database Status Check ---');
  
  for (const table of TABLES) {
    try {
      const res = await client.query(`SELECT count(*) FROM ${table}`);
      console.log(`[OK] ${table}: ${res.rows[0].count} rows`);
    } catch (err) {
      console.log(`[FAIL] ${table}: ${err.message}`);
    }
  }
  
  console.log('--- End of Check ---');
  await client.end();
}

check().catch(console.error);
