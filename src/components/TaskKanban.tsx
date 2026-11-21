import React, { useState } from 'react';
import type { Task, TaskTodoItem } from '../types';
import './MobileWorkspace.css';
import './TaskKanban.css';

/* Shared task board: the same cards on the phone (stacked lanes) and on desktop
   (four columns with drag and drop). Master tasks and to-dos use one card shape. */

export type Group = 'todo' | 'progress' | 'review' | 'done';

export const PRIORITIES = ['High', 'Medium', 'Low'] as const;
export const priorityTone = (priority?: string) => priority === 'High' || priority === 'Critical' ? 'high' : priority === 'Low' ? 'low' : 'medium';
export const priorityRank = (priority: string) => priority === 'High' || priority === 'Critical' ? 0 : priority === 'Low' ? 2 : 1;
export const statusGroup = (status: string): Group => {
  if (status === 'Complete' || status === 'Done') return 'done';
  if (status === 'Needs review') return 'review';
  if (status === 'In Progress') return 'progress';
  return 'todo';
};
export const GROUPS: { key: Group; title: string; hint: string }[] = [
  { key: 'todo', title: 'To Do', hint: 'Not started yet' },
  { key: 'progress', title: 'In Progress', hint: 'Moving, waiting on a reply' },
  { key: 'review', title: 'Need Review', hint: 'Needs your eyes or a decision' },
  { key: 'done', title: 'Done', hint: 'Closed out' },
];
const STATUS_BUTTONS: { group: Group; label: string; name?: string }[] = [
  { group: 'todo', label: 'To do' }, { group: 'progress', label: 'In progress' }, { group: 'review', label: 'Review', name: 'Needs review' }, { group: 'done', label: 'Done' },
];

export type CardItem = {
  key: string;
  kind: 'task' | 'todo';
  title: string;
  category: string;
  priority: string;
  status: string;
  due?: string;
  note?: string;
  subtasks: { id: number; text: string; done: boolean }[];
  task?: Task;
  todo?: TaskTodoItem;
};
export const fromTask = (task: Task): CardItem => ({ key: `task-${task.id}`, kind: 'task', title: task.task, category: task.category, priority: task.priority || 'Medium', status: task.status, due: task.due, subtasks: task.checklist || [], task });
export const fromTodo = (todo: TaskTodoItem): CardItem => ({ key: `todo-${todo.id}`, kind: 'todo', title: todo.title, category: todo.category, priority: todo.priority || 'Medium', status: todo.status, note: todo.note, subtasks: todo.subtasks || [], todo });

export type CardHandlers = {
  onEditTask: (task: Task) => void;
  onEditTodo: (todo: TaskTodoItem) => void;
  onChangeTaskStatus: (task: Task, status: string) => Promise<boolean>;
  onChangeTodoStatus: (todo: TaskTodoItem, status: string) => Promise<boolean>;
  onChangeTaskPriority: (task: Task, priority: string) => Promise<boolean>;
  onChangeTodoPriority: (todo: TaskTodoItem, priority: string) => Promise<boolean>;
  onAddTaskSubtask: (task: Task, text: string) => Promise<boolean>;
  onToggleTaskSubtask: (task: Task, subtaskId: number) => Promise<boolean>;
  onAddTodoSubtask: (todo: TaskTodoItem, text: string) => Promise<boolean>;
  onToggleTodoSubtask: (todo: TaskTodoItem, subtaskId: number) => Promise<boolean>;
};

const statusFor = (item: CardItem, group: Group) =>
  group === 'done' ? (item.kind === 'task' ? 'Complete' : 'Done') : group === 'review' ? 'Needs review' : group === 'progress' ? 'In Progress' : 'Not Started';
export const saveStatus = (item: CardItem, group: Group, handlers: CardHandlers) =>
  item.task ? handlers.onChangeTaskStatus(item.task, statusFor(item, group)) : handlers.onChangeTodoStatus(item.todo!, statusFor(item, group));

const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const formatDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

/** One task or to-do card. Keeps its own "Saving…", error/Retry, and subtask state. */
export function TaskCard({ item, handlers, pendingOnDevice = false, variant = 'mobile', onDragStart }: {
  item: CardItem; handlers: CardHandlers; pendingOnDevice?: boolean; variant?: 'mobile' | 'desktop';
  onDragStart?: (item: CardItem) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const run = async (save: () => Promise<boolean>) => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      if (await save() !== true) throw new Error('Could not save this change. Please retry.');
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'Could not save this change. Please retry.', retry: () => void run(save) });
    } finally {
      setBusy(false);
    }
  };

  const group = statusGroup(item.status);
  const tone = priorityTone(item.priority);
  const total = item.subtasks.length;
  const doneCount = item.subtasks.filter(sub => sub.done).length;
  const today = localDateKey(new Date());
  const overdue = !!item.due && item.due < today && group !== 'done';
  const desktop = variant === 'desktop';

  return <article
    className={`mw-card mw-task-card mw-tone-${tone} ${group === 'done' ? 'is-done' : ''} ${desktop ? 'kb-card' : ''}`}
    draggable={desktop && !busy}
    onDragStart={desktop ? event => { event.dataTransfer.setData('text/plain', item.key); event.dataTransfer.effectAllowed = 'move'; onDragStart?.(item); } : undefined}
  >
    <div className="mw-card-top">
      <span className="mw-chip">{item.category}</span>
      <select className={`mw-priority-select mw-priority-${tone}`} aria-label={`Priority for ${item.title}`} value={PRIORITIES.includes(item.priority as any) ? item.priority : 'High'}
        disabled={busy} onChange={event => { const priority = event.target.value; void run(() => item.task ? handlers.onChangeTaskPriority(item.task, priority) : handlers.onChangeTodoPriority(item.todo!, priority)); }}>
        {PRIORITIES.map(priority => <option key={priority} value={priority}>{priority.toUpperCase()}</option>)}
      </select>
    </div>
    <button className="mw-card-main" onClick={() => item.task ? handlers.onEditTask(item.task) : handlers.onEditTodo(item.todo!)}>
      <span className="mw-card-title">{item.title}</span>
      <span className={`mw-card-meta ${overdue ? 'is-overdue' : ''}`}>
        {item.kind === 'task' ? (item.due ? `${overdue ? 'Overdue · ' : 'Due '}${formatDate(item.due)}` : 'No due date') : 'To-do'}
        {' · '}<span className="mw-status-label">{busy ? 'Saving…' : item.status}</span>
      </span>
    </button>
    {item.note && <span className="mw-event-notes">{item.note}</span>}
    {pendingOnDevice && <span className="mw-pending-label">Pending — only on this device</span>}

    <button className="mw-subtask-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span>{total ? `Subtasks · ${doneCount} of ${total} done` : '+ Add subtask'}</span>
      <span aria-hidden="true">{open ? '▴' : '▾'}</span>
    </button>
    {total > 0 && <div className="mw-progress" aria-hidden="true"><i style={{ width: `${Math.round((doneCount / total) * 100)}%` }} /></div>}
    {open && <div className="mw-subtasks">
      {item.subtasks.map(sub => <label key={sub.id} className={sub.done ? 'is-done' : ''}>
        <input type="checkbox" checked={sub.done} disabled={busy}
          onChange={() => void run(() => item.task ? handlers.onToggleTaskSubtask(item.task, sub.id) : handlers.onToggleTodoSubtask(item.todo!, sub.id))} />
        <span>{sub.text}</span>
      </label>)}
      <form className="mw-subtask-add" onSubmit={event => {
        event.preventDefault();
        const text = draft.trim();
        if (!text) return;
        void run(async () => {
          const ok = item.task ? await handlers.onAddTaskSubtask(item.task, text) : await handlers.onAddTodoSubtask(item.todo!, text);
          if (ok) setDraft('');
          return ok;
        });
      }}>
        <input value={draft} onChange={event => setDraft(event.target.value)} placeholder="New subtask" aria-label={`New subtask for ${item.title}`} />
        <button type="submit" disabled={busy || !draft.trim()}>Add</button>
      </form>
    </div>}

    {desktop ? (
      // Desktop: drag the card between columns, or use this menu (keyboard friendly).
      <label className="kb-move">
        <span aria-hidden="true" className="kb-grip">⠿</span>
        <select aria-label={`Move ${item.title}`} value={group} disabled={busy}
          onChange={event => { const next = event.target.value as Group; void run(() => saveStatus(item, next, handlers)); }}>
          {GROUPS.map(g => <option key={g.key} value={g.key}>{g.title}</option>)}
        </select>
      </label>
    ) : (
      <div className="mw-status-actions" aria-label={`Change status for ${item.title}`}>
        {STATUS_BUTTONS.map(button => <button key={button.group} aria-label={button.name} disabled={busy || group === button.group}
          onClick={() => void run(() => saveStatus(item, button.group, handlers))}>{button.label}</button>)}
      </div>
    )}
    {error && <div className="mw-save-error" role="alert"><span>{error.message}</span><button disabled={busy} onClick={error.retry}>Retry</button></div>}
  </article>;
}

/** The board: a summary row and four status lanes. `layout="columns"` is the desktop kanban. */
export function TaskKanban({ tasks, todos, handlers, pendingTodoIds = [], layout = 'stacked', categories }: {
  tasks: Task[]; todos: TaskTodoItem[]; handlers: CardHandlers; pendingTodoIds?: number[];
  layout?: 'stacked' | 'columns'; categories?: string[];
}) {
  const desktop = layout === 'columns';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [dragging, setDragging] = useState<CardItem | null>(null);
  const [dropTarget, setDropTarget] = useState<Group | null>(null);
  const [dropError, setDropError] = useState('');

  const all = [...tasks.map(fromTask), ...todos.map(fromTodo)]
    .sort((x, y) => priorityRank(x.priority) - priorityRank(y.priority) || (x.due || '9999').localeCompare(y.due || '9999'));
  const q = query.trim().toLowerCase();
  const items = all.filter(item => (category === 'All' || item.category === category)
    && (!q || `${item.title} ${item.category} ${item.note || ''} ${item.subtasks.map(s => s.text).join(' ')}`.toLowerCase().includes(q)));
  const open = all.filter(item => statusGroup(item.status) !== 'done');
  const high = open.filter(item => priorityTone(item.priority) === 'high').length;
  const review = all.filter(item => statusGroup(item.status) === 'review').length;

  const drop = async (group: Group) => {
    const item = dragging;
    setDragging(null); setDropTarget(null);
    if (!item || statusGroup(item.status) === group) return;
    setDropError('');
    try {
      if (await saveStatus(item, group, handlers) !== true) throw new Error();
    } catch {
      setDropError(`Could not move “${item.title}”. Please try again.`);
    }
  };

  return <div className={`task-kanban task-kanban--${layout}`}>
    <div className="mw-summary">
      <span>{open.length} open</span>
      <span className={high ? 'is-high' : ''}>{high} high priority</span>
      <span>{review} need review</span>
    </div>
    {desktop && <div className="kb-filters">
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search cards, subtasks, categories…" aria-label="Search cards" />
      <select value={category} onChange={event => setCategory(event.target.value)} aria-label="Filter by category">
        <option value="All">All categories</option>
        {(categories || [...new Set(all.map(item => item.category))]).map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>}
    {dropError && <div className="mw-save-error kb-drop-error" role="alert"><span>{dropError}</span><button onClick={() => setDropError('')}>Dismiss</button></div>}
    <div className="kb-lanes">
      {GROUPS.map(group => {
        const rows = items.filter(item => statusGroup(item.status) === group.key);
        return <section
          className={`mw-section mw-lane mw-lane-${group.key} ${dropTarget === group.key ? 'is-drop-target' : ''}`}
          key={group.key}
          aria-label={group.title}
          onDragOver={desktop ? event => { if (!dragging) return; event.preventDefault(); setDropTarget(group.key); } : undefined}
          onDragLeave={desktop ? event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null); } : undefined}
          onDrop={desktop ? event => { event.preventDefault(); void drop(group.key); } : undefined}
        >
          <div className="mw-lane-head">
            <div><h2>{group.title}</h2><p>{group.hint}</p></div>
            <span className="mw-count">{rows.length}</span>
          </div>
          {rows.length
            ? <div className="mw-list">{rows.map(item => <TaskCard key={item.key} item={item} handlers={handlers} variant={desktop ? 'desktop' : 'mobile'}
                pendingOnDevice={!!item.todo && pendingTodoIds.includes(item.todo.id)} onDragStart={setDragging} />)}</div>
            : <p className="mw-empty">{desktop ? (q || category !== 'All' ? 'No matching cards.' : 'Drop a card here.') : 'Nothing here.'}</p>}
        </section>;
      })}
    </div>
  </div>;
}
