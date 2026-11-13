import type { TaskTodoItem } from '../types';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;
export type TodoChange = { key: string; action: 'put' | 'delete'; id: number; row?: TaskTodoItem; at: number };
export type TodoTransport = {
  read: () => Promise<TaskTodoItem[]>;
  insert: (row: TaskTodoItem) => Promise<void>;
  update: (row: TaskTodoItem) => Promise<void>;
  remove: (id: number) => Promise<void>;
};
export type TodoSyncState = { rows: TaskTodoItem[]; pendingIds: number[]; status: 'loading' | 'shared' | 'syncing' | 'offline' | 'error'; error: string };
const PREFIX = 'restaurant_todo_pending_v2:';
const CACHE = 'restaurant_task_todos_v1';
const LOCK = 'restaurant-todo-sync-v2';
export const newTodoId = () => {
  const bytes = new Uint32Array(2);
  crypto.getRandomValues(bytes);
  return (bytes[0] & 0x1fffff) * 0x100000000 + bytes[1];
};

/** Separate keys prevent tabs from overwriting one another's durable queue. */
export class TodoSyncQueue {
  state: TodoSyncState = { rows: [], pendingIds: [], status: 'loading', error: '' };
  private listeners = new Set<() => void>();
  private running: Promise<void> | null = null;
  private base: TaskTodoItem[] = [];
  constructor(private store: Store, private transport: TodoTransport,
    private lock: <T>(work: () => Promise<T>) => Promise<T>) {
    try { this.base = JSON.parse(store.getItem(CACHE) || '[]'); if (!Array.isArray(this.base)) this.base = []; }
    catch { this.base = []; }
    this.emit();
  }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private changes() {
    const out: TodoChange[] = [];
    for (let i = 0; i < this.store.length; i++) {
      const key = this.store.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const change = JSON.parse(this.store.getItem(key) || 'null');
      if (!change || !['put', 'delete'].includes(change.action) || !Number.isSafeInteger(change.id)) throw new Error('A pending todo could not be read. Keep this browser data for recovery.');
      out.push(change);
    }
    return out.sort((a, b) => a.at - b.at || a.key.localeCompare(b.key));
  }
  private emit(status = this.state.status, error = this.state.error) {
    try {
      const pending = this.changes();
      const rows = new Map(this.base.map(row => [row.id, row]));
      for (const change of pending) {
        if (change.action === 'delete') rows.delete(change.id);
        else if (change.row) rows.set(change.id, change.row);
      }
      this.state = { rows: [...rows.values()], pendingIds: [...new Set(pending.map(c => c.id))], status, error };
    } catch (e) { this.state = { ...this.state, status: 'error', error: String(e) }; }
    this.listeners.forEach(fn => fn());
  }
  reload = () => {
    try { this.base = JSON.parse(this.store.getItem(CACHE) || '[]'); this.emit(); }
    catch { this.emit('error', 'Could not read local recovery data.'); }
  };
  enqueue(action: 'put' | 'delete', id: number, row?: TaskTodoItem) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid todo identifier.');
    const key = PREFIX + crypto.randomUUID();
    const at = Math.max(Date.now(), ...this.changes().map(c => c.at + 1));
    const change: TodoChange = { key, action, id, row, at };
    // Never report a queued change if storage failed (quota/private mode).
    this.store.setItem(key, JSON.stringify(change));
    this.emit(navigator.onLine ? 'syncing' : 'offline', '');
    void this.retry();
  }
  retry = () => {
    if (this.running) return this.running;
    this.running = this.lock(async () => {
      this.emit('syncing', '');
      try {
        this.base = await this.transport.read();
        this.store.setItem(CACHE, JSON.stringify(this.base));
        // Only process a snapshot: new edits remain queued, never erased by an older acknowledgement.
        for (const change of this.changes()) {
          const exists = this.base.some(r => r.id === change.id);
          if (change.action === 'delete') {
            if (exists) await this.transport.remove(change.id);
            this.base = this.base.filter(r => r.id !== change.id);
          } else if (change.row) {
            if (exists) await this.transport.update(change.row);
            else await this.transport.insert(change.row);
            this.base = [...this.base.filter(r => r.id !== change.id), change.row];
          }
          // Save acknowledgement before deleting the intent. A crash leaves an idempotent retry.
          this.store.setItem(CACHE, JSON.stringify(this.base));
          this.store.removeItem(change.key);
          this.emit();
        }
        this.emit(this.changes().length ? 'syncing' : 'shared', '');
      } catch (e) {
        this.emit(navigator.onLine ? 'error' : 'offline', e instanceof Error ? e.message : 'Shared data could not be reached.');
      }
    }).catch(e => this.emit('error', e instanceof Error ? e.message : String(e))).finally(() => { this.running = null; });
    return this.running;
  };
}

export const withTodoLock = async <T,>(work: () => Promise<T>): Promise<T> => {
  if (!navigator.locks) throw new Error('This browser cannot safely sync across tabs. Pending changes are kept on this device; use a browser supporting Web Locks to retry.');
  return navigator.locks.request(LOCK, work);
};
