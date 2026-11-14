// Reproducible before/after UI capture. Uses isolated GET fixtures,
// blocks all business writes, service workers, WebSockets, and external HTTP.
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { loadPlaywright } from './playwright.mjs';

const { chromium } = await loadPlaywright();
const baseUrl = process.env.DESIGN_CAPTURE_URL || 'http://127.0.0.1:4173';
const phase = process.env.DESIGN_PHASE || 'after';
if (!['before', 'after'].includes(phase)) throw Error('DESIGN_PHASE must be before or after');
const outputRoot = `docs/design/${phase}`;
const baseline = phase === 'after' ? JSON.parse(await readFile('docs/design/before/manifest.json', 'utf8')) : null;
const captureTime = baseline?.capturedAt || new Date().toISOString();
const fixtureToday = new Date(captureTime);
const dateKey = `${fixtureToday.getFullYear()}-${String(fixtureToday.getMonth() + 1).padStart(2, '0')}-${String(fixtureToday.getDate()).padStart(2, '0')}`;
const longTask = 'Review the complete seasonal menu costing and confirm supplier substitutions before the soft opening';
const longUpdate = 'Kitchen and floor leads completed the service walkthrough; review the opening sequence and verify the updated preparation notes before the next rehearsal.';
const fixtures = {
  tasks: [
    { id: 71001, task: longTask, category: 'Menu & Bar', due: dateKey, status: 'In Progress', priority: 'High', checklist: [{ id: 1, text: 'Confirm recipe', done: false }, { id: 2, text: 'Review vendor quote', done: true }], assignedTo: '', isCritical: false, linkedNoteId: null },
    { id: 71002, task: 'Confirm opening shift handoff', category: 'Operations', due: dateKey, status: 'Not Started', priority: 'Medium', checklist: [], assignedTo: '', isCritical: false, linkedNoteId: null },
  ],
  task_todos: [{ id: 71101, title: 'Review draft prep list', category: 'Operations', status: 'Needs review', subtasks: [], note: longUpdate }],
  menu_items: [
    { id: 71201, section: 'Main Plates', name: 'Seasonal Grain Bowl', desc: 'Roasted vegetables, grains, herbs, and house dressing.', price: 19, foodCost: 28, hero: true, notes: 'Fixture menu record', imageUrl: '', ingredients: [{ id: 1, name: 'Roasted vegetables', quantity: 6, unit: 'oz', cost: 2.15 }, { id: 2, name: 'Grains', quantity: 4, unit: 'oz', cost: 0.85 }, { id: 3, name: 'House dressing', quantity: 2, unit: 'oz', cost: 0.6 }] },
    { id: 71202, section: 'Small Plates', name: 'Crispy Potatoes', desc: 'Herbed potatoes with lemon aioli.', price: 12, foodCost: 24, hero: false, notes: '', imageUrl: '', ingredients: [{ id: 4, name: 'Potatoes', quantity: 8, unit: 'oz', cost: 1.1 }, { id: 5, name: 'Lemon aioli', quantity: 1, unit: 'oz', cost: 0.55 }] },
  ],
  startup_costs: [], operating_costs: [], milestones: [], notes: [
    { id: 71301, tag: 'Operations', title: 'Update - fixture service walkthrough', body: longUpdate, date: 'Nov 13', files: [] },
    { id: 71302, tag: 'Menu', title: 'Fixture menu notes', body: 'Review recipe presentation and service timing.', date: 'Nov 12', files: [] },
  ],
  vendors: [], contacts: [], inventory_items: [], utility_accounts: [], permits: [], marketing_posts: [], training_modules: [], daily_checklists: [], positions: [
    { id: 71401, role: 'Service Lead', openings: 1, hired: 0, status: 'Urgent' },
    { id: 71402, role: 'Line Cook', openings: 2, hired: 1, status: 'Open' },
  ],
  candidates: [{ id: 71501, name: 'Fixture Candidate', position: 'Service Lead', stage: 'Interview', date: dateKey, feedback: 'Baseline layout fixture', trialScores: { technique: 0, speed: 0, vibe: 0 }, partnerNotes: '' }],
  digital_assets: [], shopping_list_items: [], cost_calculator_overrides: [], calendar_events: [
    { id: 71601, title: 'Fixture service rehearsal', date: dateKey, time: '10:30', type: 'Meeting', notes: 'Layout fixture only' },
  ], decision_logs: [],
};

const screenshots = [];
const observations = [];
const blockedHosts = new Set();
let safeAreaSimulation = { attempted: false, supported: false, note: 'Not attempted.' };
let businessWriteAttempts = 0;
let settingsWriteAttempts = 0;
let unexpectedLocalApi = [];
let pageErrors = [];
const safeName = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const visibleMetrics = async page => page.evaluate(() => {
  const visible = element => {
    const style = getComputedStyle(element), rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  };
  const label = element => String(element.getAttribute('aria-label') || element.getAttribute('title') || element.innerText || element.getAttribute('placeholder') || element.tagName).trim().replace(/\s+/g, ' ').slice(0, 90);
  const controls = [...document.querySelectorAll('button,a,input,select,textarea,[role="button"]')].filter(visible).map(element => {
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
    return { label: label(element), tag: element.tagName.toLowerCase(), width: Math.round(rect.width), height: Math.round(rect.height), fontSizePx: parseFloat(style.fontSize) || 0 };
  });
  const nav = document.querySelector('.mw-bottom-nav');
  const navRect = nav?.getBoundingClientRect();
  return {
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth) },
    bodyFont: { family: getComputedStyle(document.body).fontFamily, sizePx: parseFloat(getComputedStyle(document.body).fontSize) },
    controlCount: controls.length,
    controlsBelow44px: controls.filter(control => control.width < 44 || control.height < 44).length,
    below44Examples: controls.filter(control => control.width < 44 || control.height < 44).slice(0, 15),
    controlsBelow16px: controls.filter(control => control.fontSizePx < 16).length,
    below16Examples: controls.filter(control => control.fontSizePx < 16).slice(0, 15),
    editorFieldCount: [...document.querySelectorAll('input,select,textarea')].filter(visible).length,
    bottomNavigation: nav ? { top: Math.round(navRect.top), bottom: Math.round(navRect.bottom), height: Math.round(navRect.height), computedPaddingBottom: getComputedStyle(nav).paddingBottom, bottomGapPx: Math.round(innerHeight - navRect.bottom) } : null,
  };
});

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
async function newPage(viewport, state = "normal") {
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 700, hasTouch: viewport.width < 700, serviceWorkers: 'block' });
  await context.routeWebSocket('**/*', () => {});
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    if (url.origin === baseUrl) {
      if (url.pathname.startsWith('/api/records/')) {
        const table = decodeURIComponent(url.pathname.split('/').pop());
        if (method !== 'GET') { businessWriteAttempts++; return route.fulfill({ status: 405, json: { error: 'Baseline capture blocks business writes' } }); }
        if (state === "loading") return;
        if (state === "error") return route.fulfill({ status: 503, json: {error:"Fixture service unavailable"} });
        return route.fulfill({ status: 200, json: state === "empty" ? [] : fixtures[table] || [] });
      }
      if (url.pathname === '/api/settings/title') {
        if (method !== 'GET') { settingsWriteAttempts++; return route.fulfill({ status: 405, json: { error: 'Baseline capture blocks settings writes' } }); }
        return route.fulfill({ status: 200, json: { ok: true, title: 'Glai Gung Won' } });
      }
      if (url.pathname === '/api/dropbox/photos' && method === 'GET') return route.fulfill({ status: 200, json: { photos: [] } });
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname === '/api/auth/google/status') return route.fulfill({ status: 200, json: { connected: false } });
        if (url.pathname === '/api/access/users') return route.fulfill({ status: 200, json: [] });
        unexpectedLocalApi.push({ path: url.pathname, method });
        return route.fulfill({ status: 200, json: { ok: true, users: [], connected: false } });
      }
      return route.continue();
    }
    blockedHosts.add(url.hostname);
    return route.abort();
  });
  const page = await context.newPage(); await page.clock.setFixedTime(new Date(captureTime)); page.setDefaultTimeout(8000); page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.locator('body').waitFor();
  return { context, page };
}
async function selectDesktopTab(page, group, tab) {
  const groupButton = page.getByRole('button', { name: group, exact: true });
  if (await groupButton.count()) await groupButton.click();
  await page.getByRole('button', { name: tab, exact: true }).first().click();
  await page.waitForTimeout(250);
}
async function capture(page, path, label, viewportName) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await mkdir(path.substring(0, path.lastIndexOf('/')), { recursive: true });
  await page.screenshot({ path, fullPage: false, animations: 'disabled' });
  screenshots.push(path);
  const metrics = await visibleMetrics(page);
  assert.equal(metrics.document.horizontalOverflowPx, 0, `${label}: document must not scroll sideways`);
  const mobile = metrics.viewport.width < 1024;
  if (phase === 'after' && mobile) {
    assert.deepEqual(await page.getByRole('navigation', {name:'Main navigation'}).getByRole('button').allTextContents(), ['◷Today','☷Tasks','▦Calendar','▤Updates']);
    assert.equal(metrics.controlsBelow44px, 0, `${label}: every control must be at least 44x44: ${JSON.stringify(metrics.below44Examples)}`);
    for (const name of ['Menu & Bar','Cost Calculator','QuickBooks','Inventory','Vendors & Contacts','Permits','Talent & Hiring','Team Onboarding','Settings','AI Assistant']) {
      assert.equal(await page.getByRole('button',{name,exact:true}).count(),0, `${label}: desktop tool exposed on mobile: ${name}`);
    }
    assert.equal(await page.getByRole('table').count(), 0, `${label}: tables must remain desktop-only`);
    const textOffenders = await page.locator('.mw-card-title,.mw-card-meta,.mw-event-notes,.mw-status-label,.mw-note-body,.mw-empty,.mw-capability-note,.shared-sync,.shared-sync small,[role="dialog"] [role="alert"],input,textarea,select').evaluateAll(elements => elements.filter(el=>el.getBoundingClientRect().width>0 && getComputedStyle(el).visibility!=='hidden' && parseFloat(getComputedStyle(el).fontSize)<16).map(el=>({text:el.innerText||el.getAttribute('placeholder')||el.tagName,size:getComputedStyle(el).fontSize})));
    assert.deepEqual(textOffenders, [], `${label}: body and inputs must be at least 16px`);
    const dialog = page.getByRole('dialog');
    if (await dialog.count()) {
      const expectedFields = label.includes('Task editor') ? 3 : label.includes('Event editor') ? 3 : label === 'Mobile / Update edit' ? 2 : label.includes('Todo editor') ? 3 : 1;
      assert.equal(metrics.editorFieldCount, expectedFields, `${label}: editor must stay short`);
      const closeButton = dialog.getByRole('button',{name:/^Close /});
      await page.keyboard.press("Tab");
      await closeButton.focus();
      assert.equal(await closeButton.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'),true,'Close button must have visible keyboard focus');
    } else {
      assert.equal(await page.locator('.mw-primary-action').count(), 1, `${label}: exactly one prominent main action`);
      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      const clearance = await page.evaluate(()=>{
        const button=document.querySelector('.mw-primary-action').getBoundingClientRect();
        const nav=document.querySelector('.mw-bottom-nav').getBoundingClientRect();
        return {buttonBottom:button.bottom,navTop:nav.top};
      });
      assert.ok(clearance.buttonBottom <= clearance.navTop, `${label}: primary action is hidden behind navigation`);
      await page.evaluate(()=>window.scrollTo(0,0));
    }
  }
  observations.push({ label, viewport: viewportName, screenshot: path, ...metrics });
}

try {
  const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  const { context, page } = await newPage({ width: 1440, height: 1000 });
  try {
    await selectDesktopTab(page, 'DASHBOARD', 'Overview');
    await capture(page, `${outputRoot}/desktop/dashboard-overview.png`, 'Dashboard / Overview', '1440x1000');
    for (const [group, tab, file, label] of [
      ['PLANNING', 'Tasks', 'planning-tasks.png', 'Planning / Tasks'],
      ['KITCHEN', 'Menu & Bar', 'kitchen-menu-bar.png', 'Kitchen / Menu & Bar'],
      ['OPERATIONS', 'Shopping List', 'operations-shopping-list.png', 'Operations / Shopping List'],
      ['FINANCIALS', 'QuickBooks', 'financials-quickbooks.png', 'Financials / QuickBooks'],
      ['TEAM', 'Talent & Hiring', 'team-talent-hiring.png', 'Team / Talent & Hiring'],
      ['DASHBOARD', 'Settings', 'settings.png', 'Dashboard / Settings'],
    ]) {
      await selectDesktopTab(page, group, tab);
      if (tab === 'Talent & Hiring' || tab === 'Settings') {
        const pinInputs = page.locator('input[maxlength="1"]');
        if (await pinInputs.count() === 4) {
          for (const [index, digit] of [...'1379'].entries()) await pinInputs.nth(index).fill(digit);
          await page.waitForTimeout(150);
        }
      }
      await capture(page, `${outputRoot}/desktop/${file}`, label, '1440x1000');
    }
  } finally { await context.close(); }

  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const viewportName = `${viewport.width}x${viewport.height}`;
    const { context: mobileContext, page: mobile } = await newPage(viewport);
    try {
      for (const tab of ['Today', 'Tasks', 'Calendar', 'Updates']) {
        await mobile.getByRole('button', { name: tab, exact: true }).click();
        await mobile.waitForTimeout(180);
        await capture(mobile, `${outputRoot}/mobile/${viewportName}/${safeName(tab)}.png`, `Mobile / ${tab}`, viewportName);
      }
      // Capture the long-form surfaces without saving or mutating fixture data.
      await mobile.getByRole('button', { name: 'Today', exact: true }).click();
      const newTask = mobile.getByRole('button', { name: 'New task', exact: true });
      if (await newTask.count()) {
        await newTask.click(); await mobile.getByRole('dialog').waitFor();
        await capture(mobile, `${outputRoot}/mobile/${viewportName}/task-editor.png`, 'Mobile / Task editor', viewportName);
        await mobile.getByRole('button', { name: 'Cancel', exact: true }).click();
      }
      await mobile.getByRole('button', { name: 'Calendar', exact: true }).click();
      const eventAdd = mobile.getByRole('button', { name: 'Add event', exact: true }).first();
      if (await eventAdd.count()) {
        await eventAdd.click(); await mobile.getByRole('dialog').waitFor();
        await capture(mobile, `${outputRoot}/mobile/${viewportName}/event-editor.png`, 'Mobile / Event editor', viewportName);
        await mobile.getByRole('button', { name: 'Cancel', exact: true }).click();
      }
      await mobile.getByRole('button', { name: 'Updates', exact: true }).click();
      const newUpdate = mobile.getByRole('button', { name: 'New update', exact: true });
      if (await newUpdate.count()) {
        await newUpdate.click(); await mobile.getByRole('dialog').waitFor();
        await capture(mobile, `${outputRoot}/mobile/${viewportName}/update-editor.png`, 'Mobile / Update editor', viewportName);
        if (phase === 'after') {
          await mobile.getByRole('button',{name:/^Close /}).click();
          await mobile.locator('.mw-note-edit').first().click();
          await mobile.getByRole('dialog').waitFor();
          assert.equal(await mobile.getByLabel('BODY',{exact:true}).inputValue(), longUpdate);
          await capture(mobile, `${outputRoot}/mobile/${viewportName}/update-edit.png`, 'Mobile / Update edit', viewportName);
          await mobile.getByRole('button',{name:'Cancel',exact:true}).click();
          await mobile.getByRole('button',{name:'Tasks',exact:true}).click();
          await mobile.getByRole('button',{name:/Review draft prep list/}).first().click();
          await mobile.getByRole('dialog').waitFor();
          await capture(mobile, `${outputRoot}/mobile/${viewportName}/todo-editor.png`, 'Mobile / Todo editor', viewportName);
        }
      }
    } finally { await mobileContext.close(); }
  }

  if (phase === 'after') {
    for (const viewport of [{width:768,height:1024},{width:1024,height:768}]) {
      const extra = await newPage(viewport);
      try {
        const {page} = extra;
        if (viewport.width === 768) {
          for (const tab of ['Today','Tasks','Calendar','Updates']) {
            await page.getByRole('button',{name:tab,exact:true}).click();
            await capture(page, `${outputRoot}/mobile/768x1024/${safeName(tab)}.png`, `Tablet mobile / ${tab}`, '768x1024');
          }
        } else {
          for (const [group,tab] of [['DASHBOARD','Overview'],['PLANNING','Tasks'],['KITCHEN','Menu & Bar'],['OPERATIONS','Shopping List'],['FINANCIALS','QuickBooks'],['TEAM','Talent & Hiring'],['DASHBOARD','Settings']]) {
            await selectDesktopTab(page,group,tab);
            const pinInputs = page.locator('input[maxlength="1"]');
            if (await pinInputs.count() === 4) {
              for (const [index,digit] of [...'1379'].entries()) await pinInputs.nth(index).fill(digit);
            }
            await capture(page, `${outputRoot}/desktop/1024x768/${safeName(group)}-${safeName(tab)}.png`, `Narrow desktop / ${tab}`, '1024x768');
          }
        }
      } finally {await extra.context.close();}
    }
    for (const state of ['empty','loading','error']) {
      const sample = await newPage({width:375,height:667}, state);
      try {
        if (state === 'loading') await sample.page.getByText(/^(Loading shared todos|Syncing todos)…$/).waitFor();
        if (state === 'error') await sample.page.getByRole('button',{name:'Retry workspace load',exact:true}).waitFor();
        if (state === 'empty') {
          for (const tab of ['Today','Tasks','Calendar','Updates']) {
            await sample.page.getByRole('button',{name:tab,exact:true}).click();
            await capture(sample.page, `${outputRoot}/mobile/states/${state}-${safeName(tab)}.png`, `Mobile / ${tab} (${state})`, '375x667');
          }
        } else await capture(sample.page, `${outputRoot}/mobile/states/${state}.png`, `Mobile / Today (${state})`, '375x667');
      } finally {await sample.context.close();}
    }
    for (const viewport of [{width:390,height:844},{width:375,height:667}]) {
      const simulated = await newPage(viewport);
      try {
        await simulated.page.addStyleTag({content:':root { --workspace-safe-top:47px; --workspace-safe-bottom:34px; }'});
        for (const tab of ['Today','Calendar','Updates']) {
          await simulated.page.getByRole('button',{name:tab,exact:true}).click();
          await capture(simulated.page, `${outputRoot}/mobile/${viewport.width}x${viewport.height}/${safeName(tab)}-css-safearea.png`, `Mobile / ${tab} (CSS inset simulation)`, `${viewport.width}x${viewport.height} CSS insets 47/34`);
        }
      } finally {await simulated.context.close();}
    }
  }

  const safeContextAndPage = await newPage({ width: 375, height: 667 });
  try {
    const { context: safeContext, page: safePage } = safeContextAndPage;
    safeAreaSimulation = { attempted: true, supported: false, note: 'CDP Emulation.setSafeAreaInsets support could not be confirmed.' };
    const cdp = await safeContext.newCDPSession(safePage);
    try {
      await cdp.send('Emulation.setSafeAreaInsets', { insets: { top: 47, bottom: 34, left: 0, right: 0 } });
      await safePage.waitForTimeout(200);
      safeAreaSimulation = { attempted: true, supported: true, note: 'Simulated CDP safe-area insets (top 47px, bottom 34px); this is not a physical device capture.' };
      await capture(safePage, `${outputRoot}/mobile/375x667/today-safearea-simulation.png`, 'Mobile / Today (simulated safe area)', '375x667 simulated notch inset');
    } catch (error) {
      safeAreaSimulation = { attempted: true, supported: false, note: `CDP simulation unavailable: ${error instanceof Error ? error.message : String(error)}` };
    } finally { await cdp.detach().catch(() => {}); }
  } finally { await safeContextAndPage.context.close(); }

  assert.equal(businessWriteAttempts, 0, 'baseline navigation must not write business data');
  assert.equal(settingsWriteAttempts, 0, 'baseline navigation must not write settings');
  assert.deepEqual(pageErrors, [], 'baseline screenshots should render without browser page errors');
  const manifest = {
    kind: phase === 'before' ? 'UI baseline capture; no implementation changes' : 'Approved visual polish capture',
    phase, captureTime, baselineSourceCommit: baseline?.sourceCommit || baseline?.commit || null,
    commit,
    sourceWorktreeDirty: Boolean(execFileSync('git',['diff','--name-only','--','src'],{encoding:'utf8'}).trim()),
    sourceDiffSha256: createHash('sha256').update(execFileSync('git',['diff','--','src'])).digest('hex'),
    capturedAt: new Date().toISOString(),
    source: 'Application served by the local Vite development server; every business records endpoint served deterministic isolated GET fixtures; no production data or writes.',
    fixtureNotes: { longTask, longUpdate, taskCount: fixtures.tasks.length, todoCount: fixtures.task_todos.length, menuItemCount: fixtures.menu_items.length, noteCount: fixtures.notes.length, candidateCount: fixtures.candidates.length, eventCount: fixtures.calendar_events.length },
    safeAreaSimulation,
    scenarios: observations,
    screenshotCount: screenshots.length,
    businessWriteAttempts,
    settingsWriteAttempts,
    pageErrors,
    externalHostsBlocked: [...blockedHosts].sort(),
    unexpectedLocalApiRequests: unexpectedLocalApi,
    metricNotes: phase === 'after' ? 'Assertions cover target/body/input sizes, four-section navigation, absence of desktop tools/tables, short editors, focus, horizontal overflow, primary action count and bottom-bar clearance. CSS variable inset tests are simulations, not physical iPhone evidence.' : 'Baseline observations only; not a claim of compliance.',
  };
  await writeFile(`${outputRoot}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ commit, screenshotCount: screenshots.length, businessWriteAttempts, settingsWriteAttempts, pageErrors, externalHostsBlocked: manifest.externalHostsBlocked, unexpectedLocalApiRequests: unexpectedLocalApi, metrics: observations.map(({ label, viewport, document, controlsBelow44px, controlsBelow16px, editorFieldCount, bottomNavigation }) => ({ label, viewport, horizontalOverflowPx: document.horizontalOverflowPx, controlsBelow44px, controlsBelow16px, editorFieldCount, bottomNavigation })) }, null, 2));
} finally { await browser.close(); }
