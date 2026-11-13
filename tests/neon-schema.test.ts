import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import { PGlite } from '@electric-sql/pglite';
import { applyMigrations } from '../server/migrations';
import { createRecordsHandler } from '../server/records';

// Runs actual PostgreSQL semantics locally. This is not a live Neon connectivity test.
test('additive migrations and HTTP CRUD run against PostgreSQL; repeated migration preserves records', async () => {
  const db = new PGlite();
  const adapter = {
    query: async (sql: string, values?: unknown[]) => {
      if (!values && sql.includes(';')) { await db.exec(sql); return { rows: [] }; }
      return db.query<Record<string, unknown>>(sql, values as any[]);
    },
  };
  const app = express();app.use(express.json());app.all('/api/records/:table', createRecordsHandler(() => adapter));
  const server = app.listen(0, '127.0.0.1');await once(server, 'listening');
  const address = server.address();if (!address || typeof address === 'string') throw Error('No HTTP address');
  const base = `http://127.0.0.1:${address.port}`;
  const request = async (table: string, method = 'GET', payload?: any, id?: number) => {
    const response = await fetch(`${base}/api/records/${table}${id ? `?id=eq.${id}` : ''}`, { method, headers: { Origin: base, 'Content-Type':'application/json' }, ...(payload ? { body:JSON.stringify(payload) } : {}) });
    return { status:response.status, body:await response.json() };
  };
  try {
    assert.equal((await applyMigrations(adapter)).length, 2);
    const created = await request('tasks', 'POST', {id:901,task:'Isolated database fixture',category:'Operations',due:'',status:'Not Started',priority:'High',checklist:[{id:1,text:'Fixture subtask',done:false}]});
    assert.equal(created.status,200);assert.equal(created.body[0].id,901);assert.deepEqual(created.body[0].checklist,[{id:1,text:'Fixture subtask',done:false}]);
    const updated = await request('tasks','PATCH',{task:'Edited fixture',status:'Needs review'},901);assert.equal(updated.status,200);assert.equal(updated.body[0].status,'Needs review');
    assert.deepEqual(await applyMigrations(adapter),[]);
    const rows = await request('tasks');assert.equal(rows.body.length,1);assert.equal(rows.body[0].task,'Edited fixture');
    const onboarding = await request('team_onboarding','POST',{id:1,roles:[],rule_categories:[{id:1,category:'Fixture review',rules:[]}],completion:{}});assert.equal(onboarding.status,200);assert.equal(onboarding.body[0].rule_categories[0].category,'Fixture review');
    const shopping = await request('shopping_list_items','POST',{id:902,name:'Fixture ingredient',quantity:2.5,totalCost:3.75,sourceKey:'fixture-each',removed:true});assert.equal(shopping.status,200);assert.equal(shopping.body[0].quantity,2.5);assert.equal(shopping.body[0].removed,true);
    const override = await request('cost_calculator_overrides','POST',{id:4000000000000001,itemId:1,price:12.25,targetFoodCost:30,ingredients:{1:{quantity:2,cost:3}}});assert.equal(override.status,200);assert.equal(override.body[0].id,4000000000000001);assert.equal(override.body[0].price,12.25);
    const denied = await request('pg_authid');assert.equal(denied.status,400);
    const invalid = await request('tasks','POST',{'task";DROP TABLE tasks;--':'invalid'});assert.equal(invalid.status,400);
    const deleted = await request('tasks','DELETE',undefined,901);assert.equal(deleted.status,200);assert.equal((await request('tasks')).body.length,0);
    const again = await request('tasks','DELETE',undefined,901);assert.equal(again.status,200);assert.deepEqual(again.body,[]);
    const missing = await request('tasks','PATCH',{task:'No such row'},901);assert.equal(missing.status,404);
    const ledger = await db.query('SELECT name FROM app_schema_migrations');assert.equal(ledger.rows.length,2);
    console.log('PASS: actual PostgreSQL schema + Express API create/read/update/delete, JSONB, decimal values, stable IDs, onboarding, shopping suppression, repeatable migrations. Live Neon still requires authenticated deployment.');
  } finally { await new Promise<void>(resolve => server.close(()=>resolve())); await db.close(); }
});
