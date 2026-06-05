import pg from 'pg';
const { Client } = pg;

const DB_CONNECTION = String(process.env.DATABASE_URL || '').trim();
if (!DB_CONNECTION) {
  throw new Error('Missing DATABASE_URL in environment variables.');
}

const client = new Client({
  connectionString: DB_CONNECTION
});

const TABLES = [
  'tasks', 'menu_items', 'startup_costs', 'operating_costs',
  'milestones', 'notes', 'vendors', 'inventory_items',
  'utility_accounts', 'permits', 'marketing_posts', 'training_modules',
  'daily_checklists', 'invoices', 'positions', 'candidates',
  'activity_logs', 'digital_assets'
];

async function fix() {
  await client.connect();
  console.log('Connected. Granting comprehensive permissions...');

  try {
    // 1. Schema access
    await client.query('GRANT USAGE ON SCHEMA public TO anon, authenticated, public;');
    
    // 2. Grant all on existing tables and sequences to anon and authenticated
    await client.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, public;');
    await client.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, public;');
    
    // 3. Ensure future tables also get these permissions
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, public;');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, public;');

    // 4. Specifically ensure the anon role has bypassrls or proper grants if needed (though usually not possible for anon)
    // For PostgREST, anon MUST have permission to the tables it accesses
    
    console.log('✓ All schema, table, and sequence permissions granted to anon, authenticated, and public!');
    console.log('✓ Default privileges updated for future tables.');

  } catch (err) {
    console.error('✗ Error granting permissions:', err.message);
  }

  await client.end();
}

fix().catch(console.error);
