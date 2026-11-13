// The app is exercised against mocked database responses only; external hosts are blocked.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/workspace/.onboarding-tools/node_modules/playwright/index.mjs');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
const tables = {};
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
let failOnboardingInsert = false;
let nextId = 100;
const unexpectedHosts = new Set();
const pageErrors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.routeWebSocket('**/*', ws => {});
await context.route('**/*', async route => {
  const req = route.request();
  const url = new URL(req.url());
  const method = req.method();
  const fulfill = (json, status = 200) => route.fulfill({ json, status, headers: cors });
  if (url.pathname.startsWith('/api/records/')) {
    const table = url.pathname.split('/').pop();
    tables[table] ||= [];
    if (method === 'OPTIONS') return fulfill({});
    const id = url.searchParams.get('id')?.replace(/^eq\./, '');
    if (method === 'GET') return fulfill(id ? tables[table].filter(row => String(row.id) === id) : tables[table]);
    if (table === 'team_onboarding' && method === 'POST' && failOnboardingInsert) return fulfill({ message: 'Fixture write rejected' }, 403);
    const payload = req.postDataJSON();
    if (method === 'POST') {
      const inserted = (Array.isArray(payload) ? payload : [payload]).map(row => ({ id: nextId++, ...row }));
      tables[table].push(...inserted);
      return fulfill(inserted, 201);
    }
    if (method === 'PATCH') {
      tables[table] = tables[table].map(row => String(row.id) === id ? { ...row, ...payload } : row);
      return fulfill(tables[table].filter(row => String(row.id) === id));
    }
    if (method === 'DELETE') { tables[table] = tables[table].filter(row => String(row.id) !== id); return fulfill([]); }
  }
  if (url.hostname === '127.0.0.1' && url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/db/select') return fulfill({ ok: true, rows: tables[url.searchParams.get('table')] || [] });
    return fulfill({ ok: true, allowed: true, users: [], connected: false });
  }
  if (url.hostname === '127.0.0.1') return route.continue();
  unexpectedHosts.add(url.hostname);
  return route.abort();
});
const page = await context.newPage();
page.setDefaultTimeout(8000);
page.on('pageerror', error => pageErrors.push(error.message));
page.on('dialog', dialog => dialog.accept());
const wait = async (predicate, label) => {
  const until = Date.now() + 8000;
  while (Date.now() < until) {
    if (await predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  throw new Error(`Timed out: ${label}`);
};
const body = () => page.locator('body').innerText();
const button = name => page.getByRole('button', { name, exact: true });
const openOnboarding = async () => {
  await button('TEAM').click();
  await button('Team Onboarding').click();
  await wait(async () => (await body()).includes('Team Onboarding'), 'onboarding tab');
};
try {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await openOnboarding();
  assert.match(await body(), /No roles defined\./);
  await button('Rules').click();
  assert.match(await body(), /No rule categories or policies are preloaded\./);
  await button('Roles & Sidework').click();
  await page.getByPlaceholder('Role title').fill('Test Role');
  await button('Add role').click();
  await page.getByRole('textbox', { name: 'Role title' }).last().fill('Local Draft Role');

  failOnboardingInsert = true;
  await button('Save shared changes').click();
  await wait(async () => (await body()).includes('Your draft is kept on this device.'), 'failed save notice');
  assert.equal(tables.team_onboarding.length, 0);
  assert.ok(await page.evaluate(() => localStorage.getItem('restaurant_team_onboarding_shared_draft_v1')));
  assert.equal(await page.getByRole('textbox', { name: 'Role title' }).last().inputValue(), 'Local Draft Role');

  failOnboardingInsert = false;
  await button('Save shared changes').click();
  await wait(() => tables.team_onboarding.length === 1, 'first shared record create');
  await wait(async () => !(await body()).includes('Your draft is kept on this device.'), 'successful retry');
  assert.equal(tables.team_onboarding[0].roles[0].label, 'Local Draft Role');
  assert.equal(await page.evaluate(() => localStorage.getItem('restaurant_team_onboarding_shared_draft_v1')), null);

  await page.getByRole('textbox', { name: 'Role title' }).last().fill('Unsaved Local Change');
  tables.team_onboarding[0] = { ...tables.team_onboarding[0], roles: [{ ...tables.team_onboarding[0].roles[0], label: 'Remote Shared Change' }] };
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await wait(async () => (await body()).includes('Shared onboarding changed elsewhere'), 'remote update conflict notice');
  assert.equal(await page.getByRole('textbox', { name: 'Role title' }).last().inputValue(), 'Unsaved Local Change');
  await button('Reload shared data and discard my draft').click();
  assert.equal(await page.getByRole('textbox', { name: 'Role title' }).last().inputValue(), 'Remote Shared Change');

  await page.reload({ waitUntil: 'networkidle' });
  await openOnboarding();
  assert.equal(await page.getByRole('textbox', { name: 'Role title' }).last().inputValue(), 'Remote Shared Change');
  assert.deepEqual(pageErrors, []);
  assert.deepEqual([...unexpectedHosts], ['fonts.googleapis.com']);
  console.log(JSON.stringify({ passed: ['empty first record create', 'shared save failure retains draft and retry succeeds', 'background refresh preserves dirty local edits until explicit reload', 'reload reads shared record'], pageErrors, externalHostsBlocked: [...unexpectedHosts] }, null, 2));
} finally {
  await browser.close();
}
