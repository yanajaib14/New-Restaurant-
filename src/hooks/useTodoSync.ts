import { useEffect, useMemo, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '../services/database';
import { TodoSyncQueue, withTodoLock } from '../lib/todoSyncQueue';
import type { TaskTodoItem } from '../types';

const checked = (result: any) => {
  if (result.error) throw new Error(result.error.message || 'Shared todo request failed.');
  return result.data;
};
export function useTodoSync() {
  const queue = useMemo(() => new TodoSyncQueue({
    getItem: key => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: key => localStorage.removeItem(key),
    key: index => localStorage.key(index),
    get length() { return localStorage.length; },
  }, {
    read: async () => {
      const data = checked(await dbSelect('task_todos'));
      if (!Array.isArray(data)) throw new Error('Invalid shared todo response.');
      return data.map((row: any) => {
        const id = Number(row.id);
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error("A shared todo has an invalid identifier.");
        return { ...row, id, subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
          status: ["Not Started", "In Progress", "Done", "On Hold", "Needs review"].includes(row.status) ? row.status : "Not Started" };
      });
    },
    insert: async row => { checked(await dbInsert('task_todos', { ...row })); },
    update: async row => { const { id, ...payload } = row; checked(await dbUpdate('task_todos', id, payload)); },
    remove: async id => { checked(await dbDelete('task_todos', id)); },
  }, withTodoLock), []);
  const [state, setState] = useState(queue.state);
  useEffect(() => {
    const unsub = queue.subscribe(() => setState(queue.state));
    const refresh = () => { queue.reload(); void queue.retry(); };
    window.addEventListener('online', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    const interval = setInterval(() => { void queue.retry(); }, 15000);
    void queue.retry();
    return () => { unsub(); clearInterval(interval); window.removeEventListener('online', refresh); window.removeEventListener('focus', refresh); window.removeEventListener('storage', refresh); };
  }, [queue]);
  return { ...state, retry: queue.retry, put: (row: TaskTodoItem) => queue.enqueue('put', row.id, row), remove: (id: number) => queue.enqueue('delete', id) };
}
