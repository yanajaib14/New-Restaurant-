import type { TodoSyncState } from '../lib/todoSyncQueue';
import './SharedSyncStatus.css';
export function SharedSyncStatus({ status, pendingIds, error, retry }: TodoSyncState & { retry: () => Promise<void> }) {
  const label = status === 'shared' ? 'Todos saved to shared workspace' : status === 'loading' ? 'Loading shared todos…' : status === 'syncing' ? 'Syncing todos…' : status === 'offline' ? 'Offline — todo changes are only on this device' : 'Todos could not sync';
  return <aside className={`shared-sync shared-sync--${status}`} role="status"><span>{label}{pendingIds.length > 0 && ` · ${pendingIds.length} pending`}{error && <small>{error}</small>}</span>{['error', 'offline'].includes(status) && <button onClick={() => void retry()}>Retry todo sync</button>}</aside>;
}
