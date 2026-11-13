// Browser/App + Express records API against local PGlite. This exercises the
// production data route without contacting or claiming connectivity to Neon.
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { applyMigrations } from '../server/migrations.ts';
import { createRecordsHandler } from '../server/records.ts';
import { createSettingsTitleHandlers } from '../server/settings.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/workspace/.onboarding-tools/node_modules/playwright/index.mjs');

const db = new PGlite();
const adapter = {
  query: async (sql, values) => {
    if (!values && sql.includes(';')) { await db.exec(sql); return { rows: [] }; }
    return db.query(sql, values || []);
  },
};
const app = express();
app.use(express.json());
app.all('/api/records/:table', createRecordsHandler(() => adapter));
const titleHandlers = createSettingsTitleHandlers(adapter);
app.get('/api/settings/title', titleHandlers.get);
app.post('/api/settings/title', titleHandlers.post);
app.get('/api/auth/google/status', (_req, res) => res.json({ connected: false }));
app.get('/api/access/users', (_req, res) => res.json([]));
app.use(express.static(resolve('dist')));
app.get('*', (_req, res) => res.sendFile(resolve('dist/index.html')));
const server = app.listen(0, '127.0.0.1');
const serverReady = once(server, 'listening');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
const externalHosts = new Set(), pageErrors = [], writes = [];
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
await context.routeWebSocket('**/*', () => {});
await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
    if (url.pathname.startsWith('/api/records/') && route.request().method() !== 'GET') writes.push({ method: route.request().method(), url: url.pathname, body: route.request().postDataJSON() });
    return route.continue();
  }
  externalHosts.add(url.hostname);
  return route.abort();
});
const page = await context.newPage();
page.setDefaultTimeout(8000);
page.on('pageerror', error => pageErrors.push(error.message));
page.on('dialog', dialog => dialog.accept());
const button = name => page.getByRole('button', { name, exact: true });
const body = () => page.locator('body').innerText();
const wait = async (fn, label) => { const end = Date.now() + 10000; while (Date.now() < end) { if (await fn()) return; await new Promise(resolveWait => setTimeout(resolveWait, 60)); } throw Error(`Timed out: ${label}`); };
const dbRows = async table => (await db.query(`SELECT * FROM "${table}" ORDER BY id`)).rows;
const two = n => String(n).padStart(2, '0');
const now = new Date();
const today = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
let passed = 0;
const scenario = async (name, fn) => { await fn(); passed++; console.log(`PASS ${name}`); };

try {
  await serverReady;
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No local HTTP address');
  const base = `http://127.0.0.1:${address.port}`;
  assert.equal((await applyMigrations(adapter)).length, 2);
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByRole('navigation', { name: 'Main navigation' }).waitFor();
  await scenario('compiled App renders the mobile workspace against Express records API', async () => {
    assert.equal(await page.evaluate(() => [innerWidth, innerHeight].join('x')), '390x844');
    assert.equal(await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button').count(), 4);
    assert.match(await body(), /Mobile Workspace|TODAY/);
    assert.deepEqual(await dbRows('tasks'), []);
  });
  await scenario('task editor creates record, status moves through review and done, reload keeps database row', async () => {
    await button('New task').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('TASK NAME').fill('PGlite mobile task');
    await dialog.getByLabel('CATEGORY').selectOption('Operations');
    await dialog.getByLabel('PRIORITY').selectOption('High');
    await dialog.getByLabel('DUE DATE').fill(today);
    await dialog.getByRole('button', { name: 'Create Task', exact: true }).click();
    await wait(() => dialog.count().then(count => count === 0), 'task editor closes on successful insert');
    let rows = await dbRows('tasks'); assert.equal(rows.length, 1); assert.equal(rows[0].task, 'PGlite mobile task');
    assert.equal(rows[0].status, 'Not Started'); assert.equal(rows[0].due, today); assert.equal(rows[0].priority, 'High');
    await button('Tasks').click();
    let taskCard = page.locator('.mw-card').filter({ hasText: 'PGlite mobile task' });
    await taskCard.getByRole('button', { name: 'Needs review', exact: true }).click();
    await wait(async () => (await dbRows('tasks'))[0]?.status === 'Needs review', 'task review status write');
    taskCard = page.locator('.mw-card').filter({ hasText: 'PGlite mobile task' });
    await taskCard.getByRole('button', { name: 'Done', exact: true }).click();
    await wait(async () => (await dbRows('tasks'))[0]?.status === 'Complete', 'task done status write');
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByRole('navigation', { name: 'Main navigation' }).waitFor(); await button('Tasks').click();
    assert.match(await page.locator('.mw-card').filter({ hasText: 'PGlite mobile task' }).innerText(), /Complete/);
    rows = await dbRows('tasks'); assert.equal(rows.length, 1); assert.equal(rows[0].status, 'Complete');
  });
  await scenario('mobile update persists title, body and date in PostgreSQL JSON/API path', async () => {
    await button('Updates').click(); await button('New update').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'UPDATE' }).fill('PGlite update content');
    await dialog.getByRole('button', { name: 'Post Update', exact: true }).click();
    await wait(() => dialog.count().then(count => count === 0), 'update editor closes after successful save');
    let rows = await dbRows('notes'); assert.equal(rows.length, 1);
    assert.equal(rows[0].tag, 'Operations'); assert.match(rows[0].title, /^Team Update - /);
    assert.match(rows[0].body, /PGlite update content/); assert.ok(rows[0].date);
    assert.equal(writes.some(write => write.body?.body?.includes('PGlite update content')), true);
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByRole('navigation', { name: 'Main navigation' }).waitFor(); await button('Updates').click(); assert.match(await body(), /PGlite update content/);
  });
  await scenario('calendar event persists through Express API, local PostgreSQL and reload', async () => {
    await button('Calendar').click(); await page.getByRole('button', { name: today, exact: true }).click();
    await button('Add event').first().click(); const dialog = page.getByRole('dialog');
    await dialog.getByLabel('TITLE').fill('PGlite mobile event');
    await dialog.getByLabel('DATE').fill(today);
    await dialog.getByRole('button', { name: 'Add Event', exact: true }).click();
    await wait(() => dialog.count().then(count => count === 0), 'event editor closes after successful save');
    let rows = await dbRows('calendar_events'); assert.equal(rows.length, 1);
    assert.equal(rows[0].title, 'PGlite mobile event'); assert.equal(rows[0].date, today); assert.equal(rows[0].type, 'Event');
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByRole('navigation', { name: 'Main navigation' }).waitFor(); await button('Calendar').click();
    await page.getByRole('button', { name: today, exact: true }).click(); assert.match(await body(), /PGlite mobile event/);
    rows = await dbRows('calendar_events'); assert.equal(rows.length, 1);
  });
  assert.deepEqual(pageErrors, []);
  console.log(JSON.stringify({ passed, pageErrors, externalHostsBlocked: [...externalHosts], recordsApiWrites: writes.length, database: 'local PGlite; not live Neon' }, null, 2));
} finally {
  await context.close(); await browser.close();
  await new Promise(resolveClose => server.close(() => resolveClose()));
  await db.close();
}
