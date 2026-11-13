import test from 'node:test';
import assert from 'node:assert/strict';
import { TodoSyncQueue, newTodoId, type TodoTransport } from '../src/lib/todoSyncQueue.ts';
import type { TaskTodoItem } from '../src/types.ts';
Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
class MemoryStorage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  key(i: number) { return [...this.values.keys()][i] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
const row = (id = 1, title = 'Test fixture') => ({ id, title, category: 'Operations', status: 'Not Started', subtasks: [], created_at: '2026-01-01' }) as TaskTodoItem;
const lock = async <T,>(fn: () => Promise<T>) => fn();
function setup() {
  const store = new MemoryStorage();
  let rows: TaskTodoItem[] = [], fail = false, writes = 0;
  const transport: TodoTransport = {
    read: async () => { if (fail) throw Error('Test offline'); return structuredClone(rows); },
    insert: async r => { writes++; rows.push(structuredClone(r)); },
    update: async r => { writes++; rows = rows.map(v => v.id === r.id ? structuredClone(r) : v); },
    remove: async id => { writes++; rows = rows.filter(v => v.id !== id); },
  };
  const queue = new TodoSyncQueue(store, transport, lock);
  return { store, queue, transport, setFail: (v: boolean) => { fail = v; }, setRows: (v: TaskTodoItem[]) => { rows = v; }, getRows: () => rows, getWrites: () => writes };
}

test('a successful empty read removes stale browser backup', async () => {
  const s = setup(); s.store.setItem('restaurant_task_todos_v1', JSON.stringify([row()])); s.queue.reload();
  assert.equal(s.queue.state.rows.length, 1); await s.queue.retry();
  assert.deepEqual(s.queue.state.rows, []); assert.equal(s.store.getItem('restaurant_task_todos_v1'), '[]');
});
test('failed read retains backup and never reports shared', async () => {
  const s = setup(); s.store.setItem('restaurant_task_todos_v1', JSON.stringify([row()])); s.queue.reload(); s.setFail(true);
  await s.queue.retry(); assert.equal(s.queue.state.rows.length, 1); assert.equal(s.queue.state.status, 'error');
});
test('offline new intent is durable across a new queue instance', async () => {
  const s = setup(); s.setFail(true); s.queue.enqueue('put', 8, row(8)); await s.queue.retry();
  const restored = new TodoSyncQueue(s.store, s.transport, lock);
  assert.deepEqual(restored.state.pendingIds, [8]); assert.equal(restored.state.rows[0].id, 8); assert.equal(s.getWrites(), 0);
});
test('explicit retry sends queued work and removes pending marker', async () => {
  const s = setup(); s.setFail(true); s.queue.enqueue('put', 8, row(8)); await s.queue.retry();
  s.setFail(false); await s.queue.retry(); assert.equal(s.getRows()[0].id, 8); assert.equal(s.queue.state.status, 'shared'); assert.deepEqual(s.queue.state.pendingIds, []);
});
test('queued deletion survives authoritative reads and reload', async () => {
  const s = setup(); s.setRows([row()]); await s.queue.retry(); s.setFail(true);
  s.queue.enqueue('delete', 1); await s.queue.retry(); assert.deepEqual(s.queue.state.rows, []);
  s.setFail(false); await s.queue.retry(); assert.deepEqual(s.getRows(), []); await s.queue.retry(); assert.deepEqual(s.queue.state.rows, []);
});
test('rapid edits of same row preserve ordering', async () => {
  const s = setup(); s.setFail(true);
  s.queue.enqueue('put', 1, row(1, 'First')); s.queue.enqueue('put', 1, row(1, 'Second')); await s.queue.retry();
  s.setFail(false); await s.queue.retry(); assert.equal(s.getRows()[0].title, 'Second'); assert.equal(s.getRows().length, 1);
});
test('a server acknowledgement lost in transit retries with the same stable ID', async () => {
  const s = setup(); const realInsert = s.transport.insert;
  s.transport.insert = async r => { await realInsert(r); throw Error('Lost response'); };
  s.queue.enqueue('put', 42, row(42)); await s.queue.retry(); assert.deepEqual(s.queue.state.pendingIds, [42]);
  await s.queue.retry(); assert.equal(s.getRows().length, 1); assert.equal(s.queue.state.status, 'shared');
});
test('write failure leaves intent available for retry', async () => {
  const s = setup(); s.transport.insert = async () => { throw Error('Write rejected'); };
  s.queue.enqueue('put', 5, row(5)); await s.queue.retry(); assert.deepEqual(s.queue.state.pendingIds, [5]); assert.match(s.queue.state.error, /Write rejected/);
});
test('storage quota failure is thrown before change can be presented as queued', () => {
  const s = setup(); s.store.setItem = () => { throw Error('Quota'); };
  assert.throws(() => s.queue.enqueue('put', 5, row(5)), /Quota/); assert.deepEqual(s.queue.state.pendingIds, []);
});
test('two tabs retain independent intents and serialize flushing', async () => {
  const s = setup(); let chain = Promise.resolve();
  const exclusive = <T,>(fn: () => Promise<T>): Promise<T> => { const next = chain.then(fn); chain = next.then(() => {}, () => {}); return next; };
  s.setFail(true); const a = new TodoSyncQueue(s.store, s.transport, exclusive), b = new TodoSyncQueue(s.store, s.transport, exclusive);
  a.enqueue('put', 1, row(1)); b.enqueue('put', 2, row(2)); await Promise.all([a.retry(), b.retry()]);
  s.setFail(false); await Promise.all([a.retry(), b.retry()]); assert.equal(s.getRows().length, 2); assert.equal(s.getWrites(), 2);
});
test('generated numeric IDs are safe integers and distinct', () => {
  const ids = Array.from({length:1000}, newTodoId); assert.ok(ids.every(Number.isSafeInteger)); assert.equal(new Set(ids).size, ids.length);
});
