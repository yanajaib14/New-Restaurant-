/// <reference types="vite/client" />

export type DatabaseAction = 'insert' | 'update' | 'delete';
export interface WorkspaceChange {
  table: string;
  action: DatabaseAction;
  id: string | number | null;
}
export interface DatabaseError { message: string }
export interface DatabaseResult<T = Record<string, any>> {
  data: T[] | null;
  error: DatabaseError | null;
}

const RECORDS_ENDPOINT = '/api/records';
const CHANGE_EVENT = 'db_changed';
const CHANGE_CHANNEL = 'restaurant:workspace_changes';
const CHANGE_SOURCE = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let publishChannel: BroadcastChannel | null = null;

type FetchLike = typeof fetch;

function errorMessage(value: unknown, fallback: string): string {
  if (value && typeof value === 'object' && 'message' in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (value && typeof value === 'object' && 'error' in value) {
    const error = (value as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim()) return error;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
  }
  return fallback;
}

async function requestRows<T = Record<string, any>>(
  path: string,
  init: RequestInit,
  fetcher: FetchLike = fetch,
): Promise<DatabaseResult<T>> {
  try {
    const response = await fetcher(path, { ...init, credentials: 'same-origin' });
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      if (!response.ok) return { data: null, error: { message: `Request failed (${response.status})` } };
      return { data: null, error: { message: 'Invalid database response: expected a JSON array.' } };
    }

    if (!response.ok) {
      return { data: null, error: { message: errorMessage(body, `Request failed (${response.status})`) } };
    }
    if (!Array.isArray(body)) {
      return { data: null, error: { message: 'Invalid database response: expected an array of rows.' } };
    }
    return { data: body as T[], error: null };
  } catch (error) {
    return { data: null, error: { message: errorMessage(error, 'Database request failed.') } };
  }
}

function recordsPath(table: string): string {
  return `${RECORDS_ENDPOINT}/${encodeURIComponent(table)}`;
}

function publishChange(change: WorkspaceChange): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<WorkspaceChange>(CHANGE_EVENT, { detail: change }));
    }
  } catch { /* Local UI writes must not fail because an event listener failed. */ }

  try {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      if (!publishChannel) {
        publishChannel = new BroadcastChannel(CHANGE_CHANNEL);
        const closePublisher = () => { publishChannel?.close(); publishChannel = null; };
        if (typeof window !== 'undefined') window.addEventListener('pagehide', closePublisher, { once: true });
      }
      publishChannel.postMessage({ source: CHANGE_SOURCE, change });
    }
  } catch { /* Cross-tab notifications are best effort. */ }
}

async function writeRows<T = Record<string, any>>(
  table: string,
  action: DatabaseAction,
  id: string | number | undefined,
  payload?: Record<string, unknown>,
): Promise<DatabaseResult<T>> {
  const query = id === undefined ? '' : `?id=eq.${encodeURIComponent(String(id))}`;
  const method = action === 'insert' ? 'POST' : action === 'update' ? 'PATCH' : 'DELETE';
  const result = await requestRows<T>(`${recordsPath(table)}${query}`, {
    method,
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  if (result.error) return result;
  if (action === 'update' && result.data?.length === 0) {
    return { data: null, error: { message: `No ${table} row found for id ${String(id)}.` } };
  }
  publishChange({ table, action, id: id ?? null });
  return result;
}

export function dbSelect<T = Record<string, any>>(table: string): Promise<DatabaseResult<T>> {
  return requestRows<T>(recordsPath(table), { method: 'GET' });
}

export function dbInsert<T = Record<string, any>>(
  table: string,
  payload: Record<string, unknown>,
): Promise<DatabaseResult<T>> {
  return writeRows<T>(table, 'insert', undefined, payload);
}

export function dbUpdate<T = Record<string, any>>(
  table: string,
  id: number | string,
  payload: Record<string, unknown>,
): Promise<DatabaseResult<T>> {
  return writeRows<T>(table, 'update', id, payload);
}

export function dbDelete<T = Record<string, any>>(
  table: string,
  id: number | string,
): Promise<DatabaseResult<T>> {
  return writeRows<T>(table, 'delete', id);
}

/** Subscribe to local and same-browser cross-tab database write notifications. */
export function subscribeWorkspaceChanges(callback: (change: WorkspaceChange) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handleLocal = (event: Event) => {
    const change = (event as CustomEvent<WorkspaceChange>).detail;
    if (change) callback(change);
  };
  window.addEventListener(CHANGE_EVENT, handleLocal);

  let channel: BroadcastChannel | undefined;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CHANGE_CHANNEL);
      channel.addEventListener('message', event => {
        const message = event.data as { source?: string; change?: WorkspaceChange };
        if (message?.source === CHANGE_SOURCE) return;
        const change = message?.change;
        if (change && typeof change.table === 'string' && typeof change.action === 'string') callback(change);
      });
    }
  } catch { channel?.close(); channel = undefined; }

  return () => {
    window.removeEventListener(CHANGE_EVENT, handleLocal);
    channel?.close();
  };
}
