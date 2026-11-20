import React, { useMemo, useState } from 'react';
import type { CalendarEvent, Note, Task, TaskTodoItem } from '../types';
import './MobileWorkspace.css';

type Tab = 'Today' | 'Tasks' | 'Calendar' | 'Updates';
type Props = {
  tasks: Task[];
  todos: TaskTodoItem[];
  events: CalendarEvent[];
  updates: Note[];
  appTitle?: string;
  pendingTodoIds?: number[];
  onEditTask: (task: Task) => void;
  onNewTask: () => void;
  onChangeTaskStatus: (task: Task, status: string) => Promise<boolean>;
  onEditTodo: (todo: TaskTodoItem) => void;
  onChangeTodoStatus: (todo: TaskTodoItem, status: string) => Promise<boolean>;
  onChangeTaskPriority: (task: Task, priority: string) => Promise<boolean>;
  onChangeTodoPriority: (todo: TaskTodoItem, priority: string) => Promise<boolean>;
  onAddTaskSubtask: (task: Task, text: string) => Promise<boolean>;
  onToggleTaskSubtask: (task: Task, subtaskId: number) => Promise<boolean>;
  onAddTodoSubtask: (todo: TaskTodoItem, text: string) => Promise<boolean>;
  onToggleTodoSubtask: (todo: TaskTodoItem, subtaskId: number) => Promise<boolean>;
  onNewUpdate: () => void;
  onEditUpdate: (note: Note) => void;
  onOpenEvent: (event: CalendarEvent) => void;
  onNewEvent: (date: string) => void;
};

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const formatDate = (value: string, options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) => {
  const date = parseDate(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, options);
};
const PRIORITIES = ['High', 'Medium', 'Low'] as const;
const priorityTone = (priority?: string) => priority === 'High' || priority === 'Critical' ? 'high' : priority === 'Low' ? 'low' : 'medium';
type Group = 'todo' | 'progress' | 'review' | 'done';
const statusGroup = (status: string): Group => {
  if (status === 'Complete' || status === 'Done') return 'done';
  if (status === 'Needs review') return 'review';
  if (status === 'In Progress') return 'progress';
  return 'todo';
};
const taskGroup = (task: Task) => statusGroup(task.status);
const GROUPS: { key: Group; title: string; hint: string }[] = [
  { key: 'todo', title: 'To Do', hint: 'Not started yet' },
  { key: 'progress', title: 'In Progress', hint: 'Moving, waiting on a reply' },
  { key: 'review', title: 'Need Review', hint: 'Needs your eyes or a decision' },
  { key: 'done', title: 'Done', hint: 'Closed out' },
];

/** One card shape for master tasks and to-dos, so both get priority colour and subtasks. */
type CardItem = {
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
const fromTask = (task: Task): CardItem => ({ key: `task-${task.id}`, kind: 'task', title: task.task, category: task.category, priority: task.priority || 'Medium', status: task.status, due: task.due, subtasks: task.checklist || [], task });
const fromTodo = (todo: TaskTodoItem): CardItem => ({ key: `todo-${todo.id}`, kind: 'todo', title: todo.title, category: todo.category, priority: todo.priority || 'Medium', status: todo.status, note: todo.note, subtasks: todo.subtasks || [], todo });
const priorityRank = (priority: string) => priority === 'High' || priority === 'Critical' ? 0 : priority === 'Low' ? 2 : 1;

export function MobileWorkspace({ tasks, todos, events, updates, appTitle, pendingTodoIds = [], onEditTask, onNewTask, onChangeTaskStatus, onEditTodo, onChangeTodoStatus, onChangeTaskPriority, onChangeTodoPriority, onAddTaskSubtask, onToggleTaskSubtask, onAddTodoSubtask, onToggleTodoSubtask, onNewUpdate, onEditUpdate, onOpenEvent, onNewEvent }: Props) {
  const today = dateKey(new Date());
  const [tab, setTab] = useState<Tab>('Today');
  const [selectedDate, setSelectedDate] = useState(today);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  // Keyed by card key ("task-1" / "todo-1") because task and to-do ids can overlap.
  const [pending, setPending] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, { message: string; retry: () => void }>>({});
  const [openSubtasks, setOpenSubtasks] = useState<Record<string, boolean>>({});
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({});

  /** Runs one save for a card, shows "Saving…" while it runs, and keeps a Retry on failure. */
  const runSave = async (key: string, label: string, save: () => Promise<boolean>) => {
    if (pending[key]) return;
    setPending(prev => ({ ...prev, [key]: label }));
    setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
    try {
      const saved = await save();
      if (saved !== true) throw new Error('Could not save this change. Please retry.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save this change. Please retry.';
      setErrors(prev => ({ ...prev, [key]: { message, retry: () => void runSave(key, label, save) } }));
    } finally {
      setPending(prev => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const changeStatus = (item: CardItem, group: Group) => {
    const status = group === 'done' ? (item.kind === 'task' ? 'Complete' : 'Done') : group === 'review' ? 'Needs review' : group === 'progress' ? 'In Progress' : 'Not Started';
    return runSave(item.key, 'Saving…', () => item.task ? onChangeTaskStatus(item.task, status) : onChangeTodoStatus(item.todo!, status));
  };
  const changePriority = (item: CardItem, priority: string) =>
    runSave(item.key, 'Saving…', () => item.task ? onChangeTaskPriority(item.task, priority) : onChangeTodoPriority(item.todo!, priority));
  const toggleSubtask = (item: CardItem, id: number) =>
    runSave(item.key, 'Saving…', () => item.task ? onToggleTaskSubtask(item.task, id) : onToggleTodoSubtask(item.todo!, id));
  const addSubtask = (item: CardItem) => {
    const text = (subtaskDrafts[item.key] || '').trim();
    if (!text) return;
    return runSave(item.key, 'Saving…', async () => {
      const ok = item.task ? await onAddTaskSubtask(item.task, text) : await onAddTodoSubtask(item.todo!, text);
      if (ok) setSubtaskDrafts(prev => ({ ...prev, [item.key]: '' }));
      return ok;
    });
  };

  const dayEvents = useMemo(() => events.filter(event => event.date === selectedDate).sort((a, b) => (a.time || '').localeCompare(b.time || '')), [events, selectedDate]);
  const dayTasks = useMemo(() => tasks.filter(task => task.due === selectedDate), [tasks, selectedDate]);
  const overdueTasks = tasks.filter(task => task.due && task.due < today && taskGroup(task) !== 'done');
  const todayTasks = tasks.filter(task => task.due === today && task.status !== 'Complete' && task.status !== 'Done');
  const todayEvents = events.filter(event => event.date === today).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const upcomingTasks = tasks.filter(task => task.due > today && task.status !== 'Complete' && task.status !== 'Done').sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  const monthTitle = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendarCells = Array.from({ length: Math.ceil((gridStart + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - gridStart + 1;
    return day > 0 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });

  const renderCard = (item: CardItem) => {
    const busy = !!pending[item.key];
    const error = errors[item.key];
    const group = statusGroup(item.status);
    const tone = priorityTone(item.priority);
    const total = item.subtasks.length;
    const doneCount = item.subtasks.filter(sub => sub.done).length;
    const open = !!openSubtasks[item.key];
    const overdue = !!item.due && item.due < today && group !== 'done';
    const statusButtons = [
      { group: 'todo', label: 'To do' }, { group: 'progress', label: 'In progress' }, { group: 'review', label: 'Review', name: 'Needs review' }, { group: 'done', label: 'Done' },
    ] as { group: Group; label: string; name?: string }[];
    return <article className={`mw-card mw-task-card mw-tone-${tone} ${group === 'done' ? 'is-done' : ''}`} key={item.key}>
      <div className="mw-card-top">
        <span className="mw-chip">{item.category}</span>
        <select className={`mw-priority-select mw-priority-${tone}`} aria-label={`Priority for ${item.title}`} value={PRIORITIES.includes(item.priority as any) ? item.priority : 'High'}
          disabled={busy} onChange={event => void changePriority(item, event.target.value)}>
          {PRIORITIES.map(priority => <option key={priority} value={priority}>{priority.toUpperCase()}</option>)}
        </select>
      </div>
      <button className="mw-card-main" onClick={() => item.task ? onEditTask(item.task) : onEditTodo(item.todo!)}>
        <span className="mw-card-title">{item.title}</span>
        <span className={`mw-card-meta ${overdue ? 'is-overdue' : ''}`}>
          {item.kind === 'task' ? (item.due ? `${overdue ? 'Overdue · ' : 'Due '}${formatDate(item.due)}` : 'No due date') : 'To-do'}
          {' · '}<span className="mw-status-label">{busy ? 'Saving…' : item.status}</span>
        </span>
      </button>
      {item.note && <span className="mw-event-notes">{item.note}</span>}
      {item.todo && pendingTodoIds.includes(item.todo.id) && <span className="mw-pending-label">Pending — only on this device</span>}

      <button className="mw-subtask-toggle" aria-expanded={open} onClick={() => setOpenSubtasks(prev => ({ ...prev, [item.key]: !open }))}>
        <span>{total ? `Subtasks · ${doneCount} of ${total} done` : '+ Add subtask'}</span>
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {total > 0 && <div className="mw-progress" aria-hidden="true"><i style={{ width: `${Math.round((doneCount / total) * 100)}%` }} /></div>}
      {open && <div className="mw-subtasks">
        {item.subtasks.map(sub => <label key={sub.id} className={sub.done ? 'is-done' : ''}>
          <input type="checkbox" checked={sub.done} disabled={busy} onChange={() => void toggleSubtask(item, sub.id)} />
          <span>{sub.text}</span>
        </label>)}
        <form className="mw-subtask-add" onSubmit={event => { event.preventDefault(); void addSubtask(item); }}>
          <input value={subtaskDrafts[item.key] || ''} onChange={event => setSubtaskDrafts(prev => ({ ...prev, [item.key]: event.target.value }))} placeholder="New subtask" aria-label={`New subtask for ${item.title}`} />
          <button type="submit" disabled={busy || !(subtaskDrafts[item.key] || '').trim()}>Add</button>
        </form>
      </div>}

      <div className="mw-status-actions" aria-label={`Change status for ${item.title}`}>
        {statusButtons.map(button => <button key={button.group} aria-label={button.name} disabled={busy || group === button.group} onClick={() => void changeStatus(item, button.group)}>{button.label}</button>)}
      </div>
      {error?.message && <div className="mw-save-error" role="alert"><span>{error.message}</span><button disabled={busy} onClick={error.retry}>Retry</button></div>}
    </article>;
  };
  const renderTask = (task: Task) => renderCard(fromTask(task));
  const renderTodo = (todo: TaskTodoItem) => renderCard(fromTodo(todo));

  const renderEvent = (event: CalendarEvent) => <button className="mw-card mw-event-card" key={event.id} onClick={() => onOpenEvent(event)}>
    <span className="mw-card-title">{event.title}</span>
    <span className="mw-card-meta">{event.time ? `${event.time} · ` : ''}{event.type}</span>
    {event.notes && <span className="mw-event-notes">{event.notes}</span>}
  </button>;

  const renderToday = () => <>
    <header className="mw-page-heading"><div>{appTitle && <p className="mw-brand">{appTitle}</p>}<p className="mw-eyebrow">TODAY</p><h1>{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</h1></div><button className="mw-primary" onClick={onNewTask}>New task</button></header>
    {overdueTasks.length > 0 && <section className="mw-section"><div className="mw-section-title"><h2>Overdue · {overdueTasks.length}</h2><button onClick={() => setTab('Tasks')}>See all</button></div><div className="mw-list">{overdueTasks.slice(0, 3).map(renderTask)}</div></section>}
    <section className="mw-section"><h2>Today</h2>
      {todayEvents.length === 0 && todayTasks.length === 0 ? <p className="mw-empty">Nothing scheduled for today.</p> : <div className="mw-list">
        {todayEvents.map(renderEvent)}{todayTasks.map(renderTask)}
      </div>}
    </section>
    <section className="mw-section"><div className="mw-section-title"><h2>Upcoming tasks</h2><button onClick={() => setTab('Tasks')}>See all</button></div>
      {upcomingTasks.length ? <div className="mw-list">{upcomingTasks.map(renderTask)}</div> : <p className="mw-empty">No upcoming tasks.</p>}
    </section>
    {todos.length > 0 && <section className="mw-section"><h2>To-dos</h2><div className="mw-list">{todos.slice(0, 4).map(renderTodo)}</div></section>}
  </>;

  const renderTasks = () => {
    const items = [...tasks.map(fromTask), ...todos.map(fromTodo)]
      .sort((x, y) => priorityRank(x.priority) - priorityRank(y.priority) || (x.due || '9999').localeCompare(y.due || '9999'));
    const open = items.filter(item => statusGroup(item.status) !== 'done');
    const high = open.filter(item => priorityTone(item.priority) === 'high').length;
    const review = items.filter(item => statusGroup(item.status) === 'review').length;
    return <>
      <header className="mw-page-heading"><div>{appTitle && <p className="mw-brand">{appTitle}</p>}<p className="mw-eyebrow">WORK</p><h1>Tasks</h1></div><button className="mw-primary" onClick={onNewTask}>New task</button></header>
      <div className="mw-summary">
        <span>{open.length} open</span>
        <span className={high ? 'is-high' : ''}>{high} high priority</span>
        <span>{review} need review</span>
      </div>
      {GROUPS.map(group => {
        const rows = items.filter(item => statusGroup(item.status) === group.key);
        return <section className={`mw-section mw-lane mw-lane-${group.key}`} key={group.key}>
          <div className="mw-lane-head">
            <div><h2>{group.title}</h2><p>{group.hint}</p></div>
            <span className="mw-count">{rows.length}</span>
          </div>
          {rows.length ? <div className="mw-list">{rows.map(renderCard)}</div> : <p className="mw-empty">Nothing here.</p>}
        </section>;
      })}
    </>;
  };

  const renderCalendar = () => <>
      <header className="mw-page-heading"><div>{appTitle && <p className="mw-brand">{appTitle}</p>}<p className="mw-eyebrow">SCHEDULE</p><h1>Calendar</h1></div><button className="mw-primary" onClick={() => onNewEvent(selectedDate)}>Add event</button></header>
    <section className="mw-calendar">
      <div className="mw-month-nav"><button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button><h2>{monthTitle}</h2><button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></div>
      <div className="mw-calendar-grid" role="grid" aria-label={monthTitle}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <div className="mw-weekday" key={`${day}-${index}`}>{day}</div>)}
        {calendarCells.map((date, index) => {
          if (!date) return <div key={`blank-${index}`} />;
          const key = dateKey(date);
          const hasItem = events.some(event => event.date === key) || tasks.some(task => task.due === key);
          return <button key={key} aria-label={key} className={`mw-day ${key === selectedDate ? 'is-selected' : ''} ${key === today ? 'is-today' : ''}`} onClick={() => setSelectedDate(key)} aria-pressed={key === selectedDate}>
            <span>{date.getDate()}</span>{hasItem && <i aria-hidden="true" />}
          </button>;
        })}
      </div>
    </section>
    <section className="mw-section"><div className="mw-section-title"><h2>{formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })}</h2><button onClick={() => onNewEvent(selectedDate)}>Add event</button></div>
      {dayEvents.length === 0 && dayTasks.length === 0 ? <p className="mw-empty">Nothing scheduled for this day.</p> : <div className="mw-list">{dayEvents.map(renderEvent)}{dayTasks.map(renderTask)}</div>}
    </section>
  </>;

  const renderUpdates = () => <>
      <header className="mw-page-heading"><div>{appTitle && <p className="mw-brand">{appTitle}</p>}<p className="mw-eyebrow">NOTES</p><h1>Updates</h1></div><button className="mw-primary" onClick={onNewUpdate}>New update</button></header>
    <p className="mw-capability-note">Phone push is not configured.</p>
    {updates.length === 0 ? <p className="mw-empty mw-empty-panel">No updates yet.</p> : <div className="mw-list">{updates.map(note => <article className="mw-card mw-note-card" key={note.id}><div className="mw-note-top"><span className="mw-note-tag">{note.tag}</span><time>{note.date}</time></div><button className="mw-note-edit" onClick={() => onEditUpdate(note)}><h2 className="mw-card-title">{note.title}</h2><p className="mw-note-body">{note.body}</p></button></article>)}</div>}
  </>;

  return <div className="mobile-workspace">
    <main className="mw-content">{tab === 'Today' ? renderToday() : tab === 'Tasks' ? renderTasks() : tab === 'Calendar' ? renderCalendar() : renderUpdates()}</main>
    <nav className="mw-bottom-nav" aria-label="Main navigation">
      {(['Today', 'Tasks', 'Calendar', 'Updates'] as Tab[]).map(item => <button key={item} className={tab === item ? 'is-active' : ''} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}><span className="mw-nav-icon" aria-hidden="true">{item === 'Today' ? '◷' : item === 'Tasks' ? '☷' : item === 'Calendar' ? '▦' : '▤'}</span><span>{item}</span></button>)}
    </nav>
  </div>;
}
