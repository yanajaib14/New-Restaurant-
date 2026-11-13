// Actual mobile App surface at 390x844. All business APIs are in-memory fixtures;
// WebSockets are closed and requests to external hosts are aborted.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/workspace/.onboarding-tools/node_modules/playwright/index.mjs');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
const tables = Object.create(null), blockedHosts = new Set(), pageErrors = [], writes = [];
let nextId = 900, failOnce = null;
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
const two = n => String(n).padStart(2, '0');
const now = new Date();
const today = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
tables.tasks = [
  { id: 801, task: 'High mobile fixture', category: 'Operations', due: today, status: 'Not Started', priority: 'High', checklist: [] },
  { id: 802, task: 'Medium mobile fixture', category: 'Operations', due: today, status: 'Not Started', priority: 'Medium', checklist: [] },
  { id: 803, task: 'Low mobile fixture', category: 'Operations', due: today, status: 'In Progress', priority: 'Low', checklist: [] },
];
tables.task_todos = [{ id: 811, title: 'Review mobile todo', category: 'Operations', status: 'Needs review', subtasks: [] }];
tables.calendar_events = [{ id: 821, title: 'Existing mobile event', date: today, time: '09:30', type: 'Meeting', notes: '' }];
tables.notes = [{ id: 831, tag: 'Operations', title: 'Update - fixture note', body: 'Existing update body', date: 'Nov 12', files: [] }];
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await context.routeWebSocket('**/*', () => {});
await context.route('**/*', async route => {
  const req = route.request(), url = new URL(req.url()), method = req.method();
  const fulfill = (json, status = 200) => route.fulfill({ json, status, headers: cors });
  if (url.pathname.startsWith('/api/records/')) {
    const table = url.pathname.split('/').pop(); tables[table] ||= [];
    if (method === 'OPTIONS') return fulfill({});
    const id = url.searchParams.get('id')?.replace(/^eq\./, '');
    if (method === 'GET') return fulfill(id ? tables[table].filter(row => String(row.id) === id) : tables[table]);
    const failKey = `${table}:${method}`;
    if (failOnce === failKey) { failOnce = null; return fulfill({ message: 'Mobile fixture write rejected' }, 403); }
    const payload = req.postDataJSON(); writes.push({ table, method, id, payload });
    if (method === 'POST') { const inserted = (Array.isArray(payload) ? payload : [payload]).map(row => ({ id: nextId++, ...row })); tables[table].push(...inserted); return fulfill(inserted, 201); }
    if (method === 'PATCH') { tables[table] = tables[table].map(row => String(row.id) === id ? { ...row, ...payload } : row); return fulfill(tables[table].filter(row => String(row.id) === id)); }
    if (method === 'DELETE') { tables[table] = tables[table].filter(row => String(row.id) !== id); return fulfill([]); }
  }
  if (url.hostname === '127.0.0.1' && url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/settings/title') return fulfill({ ok: true, title: 'Mobile Fixture Restaurant' });
    if (url.pathname === '/api/db/select') return fulfill({ ok: true, rows: tables[url.searchParams.get('table')] || [] });
    return fulfill({ ok: true, allowed: true, users: [], connected: false });
  }
  if (url.hostname === '127.0.0.1') return route.continue();
  blockedHosts.add(url.hostname); return route.abort();
});
const page = await context.newPage(); page.setDefaultTimeout(8000); page.on('pageerror', e => pageErrors.push(e.message)); page.on('dialog', dialog => dialog.accept());
const body = () => page.locator('body').innerText();
const button = name => page.getByRole('button', { name, exact: true });
const wait = async (fn, label) => { const end = Date.now() + 8000; while (Date.now() < end) { if (await fn()) return; await new Promise(resolve => setTimeout(resolve, 50)); } throw Error(`Timed out: ${label}`); };
const reload = async () => page.reload({ waitUntil: 'networkidle' });
let passed = 0;
async function scenario(name, fn) { await fn(); passed++; console.log(`PASS ${name}`); }
try {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await scenario('mobile surface renders exactly four bottom navigation tabs', async () => {
    assert.equal(await page.getByText('High mobile fixture', {exact:true}).count(), 1, 'Today must not repeat the same task in Upcoming');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    assert.equal(await nav.getByRole('button').count(), 4);
    assert.deepEqual(await nav.getByRole('button').allTextContents(), ['◷Today', '☷Tasks', '▦Calendar', '▤Updates']);
    assert.equal(await page.evaluate(() => [innerWidth, innerHeight].join('x')), '390x844');
  });
  await page.screenshot({ path: '/tmp/restaurant-mobile.png', fullPage: true });
  await scenario('task status transition retains on failure, retries, persists through reload; priority tones render', async () => {
    await button('Tasks').click();
    const high = page.locator('.mw-card').filter({ hasText: 'High mobile fixture' });
    const medium = page.locator('.mw-card').filter({ hasText: 'Medium mobile fixture' });
    const low = page.locator('.mw-card').filter({ hasText: 'Low mobile fixture' });
    assert.equal(await high.locator('.mw-priority-high').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(253, 233, 231)');
    assert.equal(await medium.locator('.mw-priority-medium').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 241, 221)');
    assert.equal(await low.locator('.mw-priority-low').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
    const task = page.locator('.mw-card').filter({ hasText: 'High mobile fixture' });
    failOnce = 'tasks:PATCH'; await task.getByRole('button', { name: 'Needs review', exact: true }).click();
    await task.getByRole('alert').waitFor(); assert.equal(tables.tasks.find(row => row.id === 801).status, 'Not Started');
    assert.match(await task.innerText(), /Not Started/); assert.match(await task.innerText(), /Mobile fixture write rejected|Could not save/);
    await task.getByRole('button', { name: 'Retry', exact: true }).click();
    await wait(() => tables.tasks.find(row => row.id === 801).status === 'Needs review', 'task needs review retry');
    await task.getByRole('button', { name: 'Done', exact: true }).click();
    await wait(() => tables.tasks.find(row => row.id === 801).status === 'Complete', 'task done transition');
    await reload(); await button('Tasks').click();
    assert.match(await page.locator('.mw-card').filter({ hasText: 'High mobile fixture' }).innerText(), /Complete/);
    assert.equal(writes.filter(write => write.table === 'tasks' && write.id === '801').length, 2);
  });
  await scenario('calendar selected day previews events and failed event creation can retry', async () => {
    await button('Calendar').click();
    await page.getByRole('button', { name: today, exact: true }).click();
    assert.match(await body(), /Existing mobile event/);
    await button('Add event').first().click(); const dialog = page.getByRole('dialog');
    await dialog.getByLabel('TITLE').fill('Retry mobile event'); failOnce = 'calendar_events:POST';
    await dialog.getByRole('button', { name: 'Add Event', exact: true }).click();
    await dialog.getByRole('alert').waitFor(); assert.equal(await dialog.getByLabel('TITLE').inputValue(), 'Retry mobile event');
    assert.equal(tables.calendar_events.some(event => event.title === 'Retry mobile event'), false);
    await dialog.getByRole('button', { name: 'Add Event', exact: true }).click();
    await wait(() => tables.calendar_events.some(event => event.title === 'Retry mobile event'), 'event retry insert');
    await wait(() => dialog.count().then(count => count === 0), 'event modal closes after confirmed save');
    await reload(); await button('Calendar').click(); await page.getByRole('button', { name: today, exact: true }).click();
    assert.match(await body(), /Retry mobile event/);
  });
  await scenario('update post failure retains draft, retry persists; existing update can be edited', async () => {
    await button('Updates').click(); assert.match(await body(), /Phone push is not configured/);
    assert.match(await body(), /Existing update body/);
    await button('New update').click(); const post = page.getByRole('dialog');
    await post.getByRole('textbox', { name: 'UPDATE' }).fill('Retry mobile update fixture'); failOnce = 'notes:POST';
    await post.getByRole('button', { name: 'Post Update', exact: true }).click();
    await post.getByRole('alert').waitFor(); assert.equal(await post.getByRole('textbox', { name: 'UPDATE' }).inputValue(), 'Retry mobile update fixture');
    assert.equal(tables.notes.some(note => note.body?.includes('Retry mobile update fixture')), false);
    await post.getByRole('button', { name: 'Post Update', exact: true }).click();
    await wait(() => tables.notes.some(note => note.body?.includes('Retry mobile update fixture')), 'update retry insert');
    await wait(() => post.count().then(count => count === 0), 'update modal closes after confirmed save');
    const existing = page.getByRole('button').filter({ hasText: 'Update - fixture note' }); await existing.click();
    const edit = page.getByRole('dialog'); await edit.getByLabel('BODY').fill('Edited mobile update body');
    await edit.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await wait(() => tables.notes.find(note => note.id === 831)?.body === 'Edited mobile update body', 'update edit persistence');
    await reload(); await button('Updates').click(); assert.match(await body(), /Edited mobile update body/);
  });
  console.log(JSON.stringify({ passed, pageErrors, externalHostsBlocked: [...blockedHosts], fixtureWrites: writes.length }, null, 2));
  assert.deepEqual(pageErrors, []);
} finally { await context.close(); await browser.close(); }
