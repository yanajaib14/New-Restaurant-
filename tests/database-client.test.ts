import test from 'node:test';
import assert from 'node:assert/strict';
import { dbDelete, dbInsert, dbSelect, dbUpdate, subscribeWorkspaceChanges } from '../src/services/database.ts';

const originalFetch = globalThis.fetch;
const originalWindow = (globalThis as any).window;
const originalBroadcastChannel = globalThis.BroadcastChannel;
const makeResponse = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);

function setFetch(fetcher: typeof fetch) { globalThis.fetch = fetcher; }
function restoreGlobals() {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete (globalThis as any).window; else (globalThis as any).window = originalWindow;
  if (originalBroadcastChannel === undefined) delete (globalThis as any).BroadcastChannel; else globalThis.BroadcastChannel = originalBroadcastChannel;
}

test('dbSelect treats empty array as successful and requests the encoded same-origin records endpoint', async () => {
  let request: { input: RequestInfo | URL; init?: RequestInit } | undefined;
  setFetch(async (input, init) => { request = { input, init }; return makeResponse([]); });
  try {
    assert.deepEqual(await dbSelect('daily checklists'), { data: [], error: null });
    assert.equal(String(request?.input), '/api/records/daily%20checklists');
    assert.equal(request?.init?.method, 'GET');
    assert.equal(request?.init?.credentials, 'same-origin');
  } finally { restoreGlobals(); }
});

test('HTTP and network failures return a message and null data', async () => {
  setFetch(async () => makeResponse({ message: 'Unavailable' }, 503));
  try { assert.deepEqual(await dbSelect('tasks'), { data: null, error: { message: 'Unavailable' } }); }
  finally { restoreGlobals(); }

  setFetch(async () => makeResponse({ error: 'Database denied' }, 403));
  try { assert.deepEqual(await dbSelect('tasks'), { data: null, error: { message: 'Database denied' } }); }
  finally { restoreGlobals(); }

  setFetch(async () => { throw new Error('Network offline'); });
  try { assert.deepEqual(await dbSelect('tasks'), { data: null, error: { message: 'Network offline' } }); }
  finally { restoreGlobals(); }
});

test('null, invalid JSON and non-array successful responses are errors, not empty reads', async () => {
  setFetch(async () => makeResponse(null));
  try { assert.match((await dbSelect('tasks')).error?.message || '', /expected an array/); }
  finally { restoreGlobals(); }

  setFetch(async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('bad json'); } } as unknown as Response));
  try { assert.match((await dbSelect('tasks')).error?.message || '', /expected a JSON array/); }
  finally { restoreGlobals(); }
});

test('insert posts one object and publishes a successful local change', async () => {
  const events: any[] = [];
  class LocalWindow extends EventTarget {}
  const fakeWindow = new LocalWindow(); (globalThis as any).window = fakeWindow;
  fakeWindow.addEventListener('db_changed', (event: any) => events.push(event.detail));
  const posted: any[] = [], closed: string[] = [];
  class FakeBroadcastChannel {
    listeners = new Set<(event: any) => void>();
    constructor(public name: string) { posted.push({ name, instance: this }); }
    postMessage(data: unknown) { posted.push({ data }); }
    addEventListener(_name: string, listener: (event: any) => void) { this.listeners.add(listener); }
    close() { closed.push(this.name); }
  }
  globalThis.BroadcastChannel = FakeBroadcastChannel as any;
  let request: { input: RequestInfo | URL; init?: RequestInit } | undefined;
  setFetch(async (input, init) => { request = { input, init }; return makeResponse([{ id: 3, name: 'Fixture' }], 201); });
  try {
    assert.deepEqual(await dbInsert('menu_items', { name: 'Fixture' }), { data: [{ id: 3, name: 'Fixture' }], error: null });
    assert.equal(String(request?.input), '/api/records/menu_items'); assert.equal(request?.init?.method, 'POST');
    assert.equal(request?.init?.credentials, 'same-origin'); assert.equal(request?.init?.body, JSON.stringify({ name: 'Fixture' }));
    assert.deepEqual(events, [{ table: 'menu_items', action: 'insert', id: null }]);
    assert.deepEqual(posted.find(item => item.data)?.data.change, events[0]);
    assert.equal(closed.length, 0);
    fakeWindow.dispatchEvent(new Event('pagehide')); assert.deepEqual(closed, ['restaurant:workspace_changes']);
  } finally { restoreGlobals(); }
});

test('update sends PATCH by ID and rejects a successful empty result as missing row', async () => {
  let request: { input: RequestInfo | URL; init?: RequestInit } | undefined;
  setFetch(async (input, init) => { request = { input, init }; return makeResponse([]); });
  try {
    const result = await dbUpdate('team_onboarding', 'key 1', { completed: true });
    assert.equal(String(request?.input), '/api/records/team_onboarding?id=eq.key%201');
    assert.equal(request?.init?.method, 'PATCH'); assert.equal(request?.init?.body, JSON.stringify({ completed: true }));
    assert.equal(result.data, null); assert.match(result.error?.message || '', /No team_onboarding row found/);
  } finally { restoreGlobals(); }
});

test('delete returns fixture rows and emits both local and cross-tab notifications; unsubscribe closes channel', async () => {
  const localEvents: any[] = [], channels: any[] = [];
  class LocalWindow extends EventTarget {}
  const fakeWindow = new LocalWindow(); (globalThis as any).window = fakeWindow;
  class FakeBroadcastChannel {
    listeners = new Set<(event: any) => void>(); closed = false; sent: any[] = [];
    constructor(public name: string) { channels.push(this); }
    postMessage(data: unknown) { this.sent.push(data); }
    addEventListener(_name: string, listener: (event: any) => void) { this.listeners.add(listener); }
    close() { this.closed = true; }
    receive(data: unknown) { for (const listener of this.listeners) listener({ data }); }
  }
  globalThis.BroadcastChannel = FakeBroadcastChannel as any;
  fakeWindow.addEventListener('db_changed', (event: any) => localEvents.push(event.detail));
  setFetch(async () => makeResponse([{ id: 5 }]));
  try {
    const received: any[] = [];
    const unsubscribe = subscribeWorkspaceChanges(change => received.push(change));
    const result = await dbDelete('notes', 5);
    assert.deepEqual(result, { data: [{ id: 5 }], error: null });
    assert.deepEqual(localEvents, [{ table: 'notes', action: 'delete', id: 5 }]);
    assert.deepEqual(received, localEvents);
    const publisher = channels[1]; assert.equal(publisher.sent.length, 1);
    const subscriber = channels[0];
    subscriber.receive({ source: 'another-tab', change: { table: 'tasks', action: 'update', id: 4 } });
    assert.equal(received.length, 2); assert.deepEqual(received[1], { table: 'tasks', action: 'update', id: 4 });
    unsubscribe(); assert.equal(subscriber.closed, true);
    fakeWindow.dispatchEvent(new Event('pagehide')); assert.equal(publisher.closed, true);
  } finally { restoreGlobals(); }
});
