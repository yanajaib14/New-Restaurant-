// Actual-App editor checks. All business APIs and backend settings are mocked;
// external network requests are aborted. Never run this against production.
import assert from 'node:assert/strict';
import { loadPlaywright } from './playwright.mjs';
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
const tables = {}, blocked = new Set(), pageErrors = [], writes = [];
let nextId = 700, failTable = '', holdTable = '', releaseWrite;
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
context.routeWebSocket('**/*', _ws => {});
await context.route('**/*', async route => {
  const req = route.request(), url = new URL(req.url()), method = req.method();
  const fulfill = (json, status = 200) => route.fulfill({ json, status, headers: cors });
  if (url.pathname.startsWith('/api/records/')) {
    const table = url.pathname.split('/').pop(); tables[table] ||= [];
    if (method === 'OPTIONS') return fulfill({});
    const id = url.searchParams.get('id')?.replace(/^eq\./, '');
    if (method === 'GET') return fulfill(id ? tables[table].filter(row => String(row.id) === id) : tables[table]);
    if (holdTable === table) await new Promise(resolve => { releaseWrite = resolve; });
    if (failTable === table) return fulfill({ message: 'Fixture write rejected' }, 403);
    const payload = req.postDataJSON(); writes.push({ table, method, id, payload });
    if (method === 'POST') { const inserted = (Array.isArray(payload) ? payload : [payload]).map(row => ({ id: nextId++, ...row })); tables[table].push(...inserted); return fulfill(inserted, 201); }
    if (method === 'PATCH') { tables[table] = tables[table].map(row => String(row.id) === id ? { ...row, ...payload } : row); return fulfill(tables[table].filter(row => String(row.id) === id)); }
    if (method === 'DELETE') { tables[table] = tables[table].filter(row => String(row.id) !== id); return fulfill([]); }
  }
  if (url.hostname === '127.0.0.1' && url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/settings/title') return fulfill({ ok: true, title: 'Glai Gung Won' });
    if (url.pathname === '/api/ai/chat') return fulfill({ text: 'Fixture response' });
    if (url.pathname === '/api/db/select') return fulfill({ ok: true, rows: tables[url.searchParams.get('table')] || [] });
    return fulfill({ ok: true, allowed: true, users: [], connected: false });
  }
  if (url.hostname === '127.0.0.1') return route.continue();
  blocked.add(url.hostname); return route.abort();
});
const page = await context.newPage(); page.setDefaultTimeout(8000);
page.on('pageerror', e => pageErrors.push(e.message));
page.on('dialog', d => d.accept());
const btn = name => page.getByRole('button', { name, exact: true });
const body = () => page.locator('body').innerText();
const wait = async (fn, label) => { const until = Date.now() + 8000; while (Date.now() < until) { if (await fn()) return; await new Promise(r => setTimeout(r, 50)); } throw Error('Timed out: ' + label); };
const nav = async (group, label) => {
  const target = btn(label).first();
  if (!await target.isVisible().catch(() => false)) await btn(group).click();
  await target.click({ force: true });
};
const reload = async () => {
  try { await page.reload({ waitUntil: 'domcontentloaded' }); }
  catch { await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' }); }
  await wait(async () => (await body()).length > 0, 'app renders after reload');
};
const dialog = () => page.getByRole('dialog');
let passed = 0;
async function scenario(name, fn) { await fn(); passed++; console.log('PASS ' + name); }
async function rejectedThenSaved({ table, open, fill, save, text, assertRow, afterReload }) {
  await open(); const d = dialog(); await fill(d); failTable = table; await save(d); await wait(async () => (await d.innerText()).toLowerCase().includes('not saved') || (await d.innerText()).toLowerCase().includes('could not save'), table + ' rejection message');
  assert.ok(await d.isVisible(), table + ' rejected save should retain editor');
  failTable = ''; await save(d); await wait(() => tables[table]?.some(assertRow), table + ' successful write');
  await wait(() => d.count().then(n => n === 0), table + ' editor closes after save');
  await reload(); if (afterReload) await afterReload(); assert.ok((await body()).includes(text), table + ' row survives reload');
}
try {
  tables.candidates = [{ id: 42, name: 'Fixture Candidate', position: 'Cook', stage: 'Applied', feedback: '', date: '', trialScores: { technique: 0, speed: 0, vibe: 0 }, partnerNotes: '' }];
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await scenario('inventory controls render and View opens the actual inventory editor', async () => {
    await nav('OPERATIONS', 'Master Inventory');
    const row = page.getByRole('row').filter({ hasText: 'Fixture inventory' });
    assert.equal(await row.count(), 0);
    // Inventory is empty; this confirms the empty table is present and Add opens the actual form.
    assert.match(await body(), /No inventory items match these filters/);
    await btn('+ Add Item').click({ force: true }); const d = dialog();
    await d.getByLabel('ITEM NAME').fill('Fixture inventory'); await d.getByRole('button', { name: 'Add Item', exact: true }).click();
    await wait(() => tables.inventory_items?.length === 1, 'inventory insert'); await wait(() => d.count().then(n => n === 0), 'inventory closes');
    await reload(); await nav('OPERATIONS', 'Master Inventory');
    const itemRow = page.getByRole('row').filter({ hasText: 'Fixture inventory' }); assert.equal(await itemRow.count(), 1);
    await itemRow.getByRole('button', { name: 'View Fixture inventory' }).click({ force: true });
    await wait(async () => await dialog().count() === 1, 'inventory view opens');
    assert.equal(await dialog().getAttribute('aria-label'), 'Edit Item');
    await dialog().getByRole('button', { name: 'Cancel', exact: true }).click();
  });
  await scenario('vendor rejected draft stays open then persists and reloads', async () => {
    await nav('OPERATIONS', 'Vendors & Contacts');
    await rejectedThenSaved({ table: 'vendors', open: async () => page.locator('button[title="Add vendor"]').click({ force: true }),
      fill: async d => { await d.getByLabel('VENDOR NAME').fill('Fixture Vendor'); },
      save: async d => d.getByRole('button', { name: 'Add Vendor', exact: true }).click(), text: 'Fixture Vendor', assertRow: r => r.name === 'Fixture Vendor', afterReload: () => nav('OPERATIONS', 'Vendors & Contacts') });
  });
  await scenario('contact rejected draft stays open then persists and reloads', async () => {
    await page.locator('button[title="Add contact"]').click();
    const d = dialog(); await d.getByLabel('CONTACT NAME').fill('Fixture Contact'); failTable = 'contacts'; await d.getByRole('button', { name: 'Add Contact', exact: true }).click();
    await wait(async () => (await d.innerText()).includes('not saved'), 'contact failure'); assert.ok(await d.isVisible());
    failTable = ''; await d.getByRole('button', { name: 'Add Contact', exact: true }).click(); await wait(() => tables.contacts?.length === 1, 'contact insert'); await reload(); await nav('OPERATIONS', 'Vendors & Contacts');
    assert.match(await body(), /Fixture Contact/);
  });
  await scenario('permit rejected draft stays open then persists and reloads', async () => {
    await nav('OPERATIONS', 'Permits'); await btn('+ Add Permit').click(); const d = dialog();
    await d.getByLabel('PERMIT NAME').fill('Fixture Permit'); failTable = 'permits'; await d.getByRole('button', { name: 'Add Permit', exact: true }).click();
    await wait(async () => (await d.innerText()).includes('not saved'), 'permit failure'); assert.ok(await d.isVisible());
    failTable = ''; await d.getByRole('button', { name: 'Add Permit', exact: true }).click(); await wait(() => tables.permits?.length === 1, 'permit insert'); await reload(); await nav('OPERATIONS', 'Permits'); assert.match(await body(), /Fixture Permit/);
  });
  await scenario('utility rejected draft stays open then persists and reloads', async () => {
    await nav('OPERATIONS', 'Permits');
    await btn('+ Add Account').click(); const d = dialog(); await d.getByLabel(/SERVICE NAME|ACCOUNT NAME/i).fill('Fixture Utility');
    failTable = 'utility_accounts'; await d.getByRole('button', { name: /Add Account|Save Account/i }).click();
    await wait(async () => (await d.innerText()).includes('not saved'), 'utility failure'); failTable = ''; await d.getByRole('button', { name: /Add Account|Save Account/i }).click();
    await wait(() => tables.utility_accounts?.length === 1, 'utility insert'); await reload(); await nav('OPERATIONS', 'Permits'); assert.match(await body(), /Fixture Utility/);
  });
  await scenario('hiring candidate deletion sends its record ID and removes the row', async () => {
    await nav('TEAM', 'Talent & Hiring');
    const pin = page.locator('input[maxlength="1"]');
    if (await pin.count() === 4) { for (let i = 0; i < 4; i++) await pin.nth(i).fill(String('1379'[i])); }
    await wait(async () => (await body()).includes('Fixture Candidate'), 'candidate card');
    await page.locator('button[title="Edit"]').last().click({ force: true });
    await wait(async () => await dialog().count() === 1, 'candidate editor');
    await dialog().locator('button[title="Delete candidate"]').click({ force: true });
    await wait(() => tables.candidates.length === 0, 'candidate delete request');
    assert.ok(writes.some(w => w.table === 'candidates' && w.method === 'DELETE' && w.id === '42'));
    await reload(); await nav('TEAM', 'Talent & Hiring');
    if (await pin.count() === 4) { for (let i = 0; i < 4; i++) await pin.nth(i).fill(String('1379'[i])); }
    assert.doesNotMatch(await body(), /Fixture Candidate/);
  });
  await scenario('timeline milestone rejected draft retries and survives reload', async () => {
    await nav('PLANNING', 'Timeline'); await btn('+ Add Milestone').click({ force: true }); const d = dialog();
    await d.getByLabel('MILESTONE NAME').fill('Fixture milestone'); failTable = 'milestones'; await d.getByRole('button', { name: 'Add Milestone', exact: true }).click({ force: true });
    await wait(async () => (await d.innerText()).includes('not saved'), 'timeline failure'); assert.equal(await d.getByLabel('MILESTONE NAME').inputValue(), 'Fixture milestone');
    failTable = ''; await d.getByRole('button', { name: 'Add Milestone', exact: true }).click({ force: true }); await wait(() => tables.milestones?.length === 1, 'milestone insert');
    await reload(); await nav('PLANNING', 'Timeline'); assert.match(await body(), /Fixture milestone/);
  });
  await scenario('menu item rejected draft retries and survives reload', async () => {
    await nav('KITCHEN', 'Menu & Bar'); await btn('+ Add Item').click({ force: true }); const d = dialog();
    await d.getByLabel('ITEM NAME').fill('Fixture Menu Item'); failTable = 'menu_items'; await d.getByRole('button', { name: 'Add Item', exact: true }).click({ force: true });
    await wait(async () => (await d.innerText()).includes('not saved'), 'menu failure'); assert.equal(await d.getByLabel('ITEM NAME').inputValue(), 'Fixture Menu Item');
    failTable = ''; await d.getByRole('button', { name: /Save|Add Item/ }).click({ force: true }); await wait(() => tables.menu_items?.length === 1, 'menu insert');
    await reload(); await nav('KITCHEN', 'Menu & Bar'); assert.match(await body(), /Fixture Menu Item/);
  });
  assert.deepEqual(pageErrors, []);
  console.log(JSON.stringify({ passed, pageErrors, externallyBlocked: [...blocked], writes: writes.map(w => ({ table: w.table, method: w.method })) }, null, 2));
} finally { await browser.close(); }
