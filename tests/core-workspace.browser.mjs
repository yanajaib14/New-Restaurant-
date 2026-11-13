// Focused workspace CRUD verification. Every API is fixture-backed; all non-local requests are blocked.
import assert from 'node:assert/strict';
import { loadPlaywright } from './playwright.mjs';
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
context.routeWebSocket('**/*', ws => {});
const tables = Object.create(null);
let nextId = 9000, failWrite = '', holdWrite = '', releaseWrite;
const blockedHosts = new Set(), pageErrors = [], requests = [], dialogs = [];
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
await context.route('**/*', async route => {
  const req = route.request(), url = new URL(req.url()), method = req.method();
  const fulfill = (json, status = 200) => route.fulfill({ json, status, headers: cors });
  if (url.pathname.startsWith('/api/records/')) {
    const table = url.pathname.split('/').pop(); tables[table] ||= [];
    if (method === 'OPTIONS') return fulfill({});
    const id = url.searchParams.get('id')?.replace(/^eq\./, '');
    if (method === 'GET') return fulfill(id ? tables[table].filter(row => String(row.id) === id) : tables[table]);
    if (holdWrite === table) await new Promise(resolve => { releaseWrite = resolve; });
    if (failWrite === table) return fulfill({ message: 'Fixture write rejected' }, 403);
    const payload = req.postDataJSON(); requests.push({ table, method, id, payload });
    if (method === 'POST') { const inserted = (Array.isArray(payload) ? payload : [payload]).map(row => ({ id: nextId++, ...row })); tables[table].push(...inserted); return fulfill(inserted, 201); }
    if (method === 'PATCH') { tables[table] = tables[table].map(row => String(row.id) === id ? { ...row, ...payload } : row); return fulfill(tables[table].filter(row => String(row.id) === id)); }
    if (method === 'DELETE') { tables[table] = tables[table].filter(row => String(row.id) !== id); return fulfill([]); }
    return fulfill({});
  }
  if (url.hostname === '127.0.0.1' && url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/settings/title') return fulfill({ ok: true, title: 'Fixture Restaurant' });
    if (url.pathname === '/api/ai/chat') return fulfill({ text: 'Fixture suggestion.' });
    if (url.pathname === '/api/db/select') return fulfill({ ok: true, rows: tables[url.searchParams.get('table')] || [] });
    return fulfill({ ok: true, allowed: true, users: [], connected: false });
  }
  if (url.hostname === '127.0.0.1') return route.continue();
  blockedHosts.add(url.hostname); return route.abort();
});

const page = await context.newPage(); page.setDefaultTimeout(9000);
page.on('pageerror', error => pageErrors.push(error.message)); page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
const body = () => page.locator('body').innerText();
const wait = async (fn, label) => { const until = Date.now() + 9000; while (Date.now() < until) { if (await fn()) return; await new Promise(resolve => setTimeout(resolve, 50)); } throw Error(`Timed out: ${label}`); };
const button = name => page.getByRole('button', { name, exact: true });
const nav = async (group, section) => { await button(group).click(); if (section) await button(section).first().click(); };
const scenario = async (name, action) => { await action(); console.log(`PASS ${name}`); };

try {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await scenario('Notes create with date and dropped durable attachment survives rejected write, retry, and reload', async () => {
    await nav('PLANNING', 'Notes'); await button('+ New Note').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('TITLE').fill('Browser fixture note');
    await dialog.getByLabel('DATE').fill('2025-04-18');
    await dialog.getByLabel('BODY').fill('A note body for the browser fixture.');
    const zone = dialog.getByText('Attach files', { exact: true }).locator('..');
    await zone.evaluate(el => { const transfer = new DataTransfer(); transfer.items.add(new File(['attachment fixture'], 'fixture.txt', { type: 'text/plain' })); el.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer })); });
    await dialog.getByText('fixture.txt', { exact: true }).waitFor();
    failWrite = 'notes'; await dialog.getByRole('button', { name: 'Add Note', exact: true }).click();
    await dialog.getByRole('alert').waitFor();
    assert.equal(await dialog.getByLabel('TITLE').inputValue(), 'Browser fixture note');
    assert.equal(await dialog.getByLabel('DATE').inputValue(), '2025-04-18');
    assert.match((await dialog.innerText()), /fixture\.txt/);
    failWrite = ''; await dialog.getByRole('button', { name: 'Add Note', exact: true }).click();
    await wait(() => tables.notes?.length === 1, 'note insert'); await wait(() => dialog.count().then(n => n === 0), 'note modal close');
    const saved = tables.notes[0]; assert.equal(saved.date, '2025-04-18'); assert.equal(saved.files.length, 1); assert.match(saved.files[0].url, /^data:text\/plain;base64,/);
    await page.reload({ waitUntil: 'networkidle' }); await nav('PLANNING', 'Notes');
    assert.match(await body(), /Browser fixture note/); assert.match(await body(), /Apr 18, 2025|2025-04-18/);
    await button('Open').click(); const detail = page.getByRole('dialog');
    await detail.getByRole('button', { name: 'Edit', exact: true }).click();
    await detail.getByPlaceholder('Note title').fill('Edited browser fixture note');
    await detail.locator('input[type="date"]').fill('2025-04-19');
    await detail.getByPlaceholder('Write your whole note here...').fill('Edited body survives reload.');
    await detail.getByRole('button', { name: 'Save Note', exact: true }).click();
    await wait(() => tables.notes[0].title === 'Edited browser fixture note', 'note update');
    assert.equal(tables.notes[0].date, '2025-04-19'); assert.equal(tables.notes[0].files[0].url, saved.files[0].url);
    await page.reload({ waitUntil: 'networkidle' }); await nav('PLANNING', 'Notes');
    assert.match(await body(), /Edited browser fixture note/); assert.match(await body(), /Apr 19, 2025|2025-04-19/);
    await button('Open').click(); const editedDetail = page.getByRole('dialog');
    await editedDetail.getByTitle('Delete note').click();
    const deleteConfirm = page.getByText('Remove this item?').locator('..');
    await deleteConfirm.getByTitle('Delete').click();
    await wait(() => tables.notes.length === 0, 'note delete');
    await wait(() => deleteConfirm.count().then(n => n === 0), 'note delete confirmation closes');
  });

  await scenario('Decision edit rejection retains fields for retry and rejected delete confirmation remains retryable', async () => {
    tables.decision_logs = [{ id: 901, title: 'Fixture decision', decision: 'Initial choice', owner: 'Team', date: '2025-04-18', impact: 'Medium', status: 'Decided', nextStep: '' }];
    await page.reload({ waitUntil: 'networkidle' }); await nav('PLANNING', 'Decision Log');
    const cardTitle = page.getByText('Fixture decision', { exact: true });
    const cardActions = cardTitle.locator('..');
    await cardActions.getByTitle('Edit').click({ force: true }); const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'DECISION' }).fill('Updated fixture choice');
    failWrite = 'decision_logs'; await dialog.getByRole('button', { name: 'Save Decision', exact: true }).click();
    await wait(async () => dialogs.some(message => message.includes('Fixture write rejected')), 'decision rejected feedback');
    assert.equal(await dialog.getByRole('textbox', { name: 'DECISION' }).inputValue(), 'Updated fixture choice'); assert.equal(await dialog.count(), 1);
    failWrite = ''; await dialog.getByRole('button', { name: 'Save Decision', exact: true }).click();
    await wait(async () => dialog.count().then(n => n === 0), 'decision retry close'); assert.equal(tables.decision_logs[0].decision, 'Updated fixture choice');
    await page.getByText('Fixture decision', { exact: true }).locator('..').getByTitle('Delete').click();
    const confirm = page.getByText('Remove this item?').locator('..');
    failWrite = 'decision_logs'; await confirm.getByTitle('Delete').click(); await confirm.getByRole('alert').waitFor();
    assert.equal(tables.decision_logs.length, 1); assert.equal(await confirm.count(), 1);
    failWrite = ''; await confirm.getByTitle('Delete').click(); await wait(() => confirm.count().then(n => n === 0), 'decision delete retry');
    assert.equal(tables.decision_logs.length, 0);
  });

  await scenario('Inspiration quick-add retains rejected draft and succeeds on retry', async () => {
    await nav('DASHBOARD');
    const fab = page.getByRole('button', { name: /Quick Add/i });
    await fab.click(); await page.getByRole('button', { name: '+ Inspiration', exact: true }).click();
    const sheet = page.getByText('💡 Add Inspiration').locator('..');
    await page.getByRole('button', { name: 'Paste Link', exact: true }).click();
    await page.getByPlaceholder('Instagram / TikTok / web URL...').fill('https://example.test/inspo-fixture');
    await page.getByPlaceholder(/Name \(optional\)/).fill('Fixture inspiration');
    failWrite = 'digital_assets'; await page.getByRole('button', { name: 'Save to Inspiration', exact: true }).click();
    await page.getByRole('alert').waitFor(); assert.equal(await page.getByPlaceholder(/Name \(optional\)/).inputValue(), 'Fixture inspiration');
    failWrite = ''; await page.getByRole('button', { name: 'Save to Inspiration', exact: true }).click();
    await wait(() => tables.digital_assets?.length === 1, 'inspiration insert'); assert.equal(tables.digital_assets[0].name, 'Fixture inspiration');
    await wait(() => page.getByText('💡 Add Inspiration').count().then(n => n === 0), 'inspiration sheet close');
  });

  await scenario('Task detail status action remains open after rejection and closes after confirmed retry', async () => {
    tables.tasks = [{ id: 902, task: 'Fixture overdue task', category: 'Operations', due: '2020-01-01', status: 'Not Started', priority: 'High', checklist: [], assignedTo: 'B' }];
    await page.reload({ waitUntil: 'networkidle' }); await nav('DASHBOARD'); await button('📋 Daily Debrief').click();
    const debrief = page.getByText('📋 Daily Debrief').locator('..');
    await wait(async () => await page.getByRole('button', { name: 'View', exact: true }).count() > 0, 'debrief task view buttons');
    await page.getByRole('button', { name: 'View', exact: true }).last().click({ force: true });
    const detail = page.locator('.modal-backdrop-blur').last();
    await wait(async () => await detail.getByRole('button', { name: 'Start — Mark In Progress', exact: true }).count() === 1, 'task detail sheet');
    failWrite = 'tasks'; await detail.getByRole('button', { name: 'Start — Mark In Progress', exact: true }).click();
    await detail.getByRole('alert').waitFor(); assert.equal(await detail.count(), 1); assert.equal(tables.tasks[0].status, 'Not Started');
    failWrite = ''; holdWrite = 'tasks'; await detail.getByRole('button', { name: 'Start — Mark In Progress', exact: true }).click();
    await wait(() => !!releaseWrite, 'task status pending write');
    const sheet = page.locator('.modal-backdrop-blur').last(); const box = await sheet.boundingBox();
    await page.mouse.click(box.x + 8, box.y + 8);
    assert.equal(await detail.count(), 1, 'pending status write guards dismissal');
    holdWrite = ''; releaseWrite(); releaseWrite = undefined;
    await wait(() => tables.tasks[0].status === 'In Progress', 'task status retry'); await wait(() => detail.count().then(n => n === 0), 'task detail closes after save');
  });

  console.log(JSON.stringify({ pageErrors, externalHostsBlocked: [...blockedHosts], fixtureWrites: requests.length, blockedExternalHosts: [...blockedHosts], mockedRealtimeSocketErrors: pageErrors.length }, null, 2));
  assert.deepEqual(pageErrors, []);
  assert.ok(blockedHosts.has('fonts.googleapis.com'), 'external font request was blocked');
  assert.deepEqual([...blockedHosts].filter(host => host === '127.0.0.1'), []);
} finally { await browser.close(); }
