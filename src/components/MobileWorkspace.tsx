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
const priorityTone = (priority: string) => priority === 'High' || priority === 'Critical' ? 'high' : priority === 'Medium' ? 'medium' : 'low';
const taskGroup = (task: Task): 'todo' | 'review' | 'done' => {
  if (task.status === 'Complete' || task.status === 'Done') return 'done';
  if (task.status === 'Needs review') return 'review';
  return 'todo';
};
const todoGroup = (todo: TaskTodoItem): 'todo' | 'review' | 'done' => {
  if (todo.status === 'Done') return 'done';
  if ((todo.status as string) === 'Needs review') return 'review';
  return 'todo';
};

export function MobileWorkspace({ tasks, todos, events, updates, appTitle, pendingTodoIds = [], onEditTask, onNewTask, onChangeTaskStatus, onEditTodo, onChangeTodoStatus, onNewUpdate, onEditUpdate, onOpenEvent, onNewEvent }: Props) {
  const today = dateKey(new Date());
  const [tab, setTab] = useState<Tab>('Today');
  const [selectedDate, setSelectedDate] = useState(today);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [pendingStatus, setPendingStatus] = useState<Record<number, string>>({});
  const [statusErrors, setStatusErrors] = useState<Record<number, { message: string; status: string }>>({});
  const [todoPending, setTodoPending] = useState<Record<number, string>>({});
  const [todoErrors, setTodoErrors] = useState<Record<number, { message: string; status: string }>>({});

  const changeStatus = async (task: Task, status: string) => {
    if (pendingStatus[task.id]) return;
    setPendingStatus(prev => ({ ...prev, [task.id]: status }));
    setStatusErrors(prev => { const next = { ...prev }; delete next[task.id]; return next; });
    try {
      const saved = await onChangeTaskStatus(task, status);
      if (saved !== true) throw new Error('Could not save this status. Please retry.');
    } catch (error) {
      setStatusErrors(prev => ({ ...prev, [task.id]: { message: error instanceof Error ? error.message : 'Could not save this status. Please retry.', status } }));
    } finally {
      setPendingStatus(prev => { const next = { ...prev }; delete next[task.id]; return next; });
    }
  };

  const changeTodoStatus = async (todo: TaskTodoItem, status: string) => {
    if (todoPending[todo.id]) return;
    setTodoPending(prev => ({ ...prev, [todo.id]: status }));
    setTodoErrors(prev => { const next = { ...prev }; delete next[todo.id]; return next; });
    try {
      const saved = await onChangeTodoStatus(todo, status);
      if (saved !== true) throw new Error('Could not save this status. Please retry.');
    } catch (error) {
      setTodoErrors(prev => ({ ...prev, [todo.id]: { message: error instanceof Error ? error.message : 'Could not save this status. Please retry.', status } }));
    } finally {
      setTodoPending(prev => { const next = { ...prev }; delete next[todo.id]; return next; });
    }
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

  const renderTask = (task: Task) => {
    const requestedStatus = pendingStatus[task.id];
    const error = statusErrors[task.id];
    return <article className="mw-card" key={task.id}>
      <button className="mw-card-main" onClick={() => onEditTask(task)}>
        <span className="mw-card-title">{task.task}</span>
        <span className="mw-card-meta">{task.due ? formatDate(task.due) : 'No due date'} · {task.category}</span>
      </button>
      <div className="mw-task-footer">
        <span className={`mw-priority mw-priority-${priorityTone(task.priority)}`}>{task.priority}</span>
        <span className="mw-status-label">{requestedStatus ? 'Saving…' : task.status}</span>
      </div>
      <div className="mw-status-actions" aria-label={`Change status for ${task.task}`}>
        <button disabled={!!requestedStatus || taskGroup(task) === 'todo'} onClick={() => void changeStatus(task, 'Not Started')}>To do</button>
        <button disabled={!!requestedStatus || taskGroup(task) === 'review'} onClick={() => void changeStatus(task, 'Needs review')}>Needs review</button>
        <button disabled={!!requestedStatus || taskGroup(task) === 'done'} onClick={() => void changeStatus(task, 'Complete')}>Done</button>
      </div>
      {error?.message && <div className="mw-save-error" role="alert"><span>{error.message}</span><button disabled={!!requestedStatus} onClick={() => void changeStatus(task, error.status)}>Retry</button></div>}
    </article>;
  };

  const renderEvent = (event: CalendarEvent) => <button className="mw-card mw-event-card" key={event.id} onClick={() => onOpenEvent(event)}>
    <span className="mw-card-title">{event.title}</span>
    <span className="mw-card-meta">{event.time ? `${event.time} · ` : ''}{event.type}</span>
    {event.notes && <span className="mw-event-notes">{event.notes}</span>}
  </button>;

  const renderTodo = (todo: TaskTodoItem) => {
    const pendingStatusValue = todoPending[todo.id];
    const error = todoErrors[todo.id];
    const review = (todo.status as string) === 'Needs review';
    const done = todo.status === 'Done';
    return <article className="mw-card" key={todo.id}>
      <button className="mw-card-main" onClick={() => onEditTodo(todo)}>
        <span className="mw-card-title">{todo.title}</span>
        <span className="mw-card-meta">{todo.category} · {pendingStatusValue ? 'Saving…' : todo.status}</span>
      </button>
      {todo.note && <span className="mw-event-notes">{todo.note}</span>}
      {pendingTodoIds.includes(todo.id) && <span className="mw-pending-label">Pending — only on this device</span>}
      <div className="mw-status-actions" aria-label={`Change status for ${todo.title}`}>
        <button disabled={!!pendingStatusValue || todo.status === 'Not Started' || todo.status === 'In Progress'} onClick={() => void changeTodoStatus(todo, 'Not Started')}>To do</button>
        <button disabled={!!pendingStatusValue || review} onClick={() => void changeTodoStatus(todo, 'Needs review')}>Needs review</button>
        <button disabled={!!pendingStatusValue || done} onClick={() => void changeTodoStatus(todo, 'Done')}>Done</button>
      </div>
      {error?.message && <div className="mw-save-error" role="alert"><span>{error.message}</span><button disabled={!!pendingStatusValue} onClick={() => void changeTodoStatus(todo, error.status)}>Retry</button></div>}
    </article>;
  };

  const renderToday = () => <>
    <header className="mw-page-heading"><div>{appTitle && <p className="mw-brand">{appTitle}</p>}<p className="mw-eyebrow">TODAY</p><h1>{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</h1></div></header>
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
    const groups: { key: 'todo' | 'review' | 'done'; title: string }[] = [
      { key: 'todo', title: 'To do' }, { key: 'review', title: 'Needs review' }, { key: 'done', title: 'Done' },
    ];
    return <>
      <header className="mw-page-heading"><div>{appTitle && <p className="mw-brand">{appTitle}</p>}<p className="mw-eyebrow">WORK</p><h1>Tasks</h1></div></header>
      {groups.map(group => {
        const taskRows = tasks.filter(task => taskGroup(task) === group.key);
        const todoRows = todos.filter(todo => todoGroup(todo) === group.key);
        const count = taskRows.length + todoRows.length;
        return <section className="mw-section" key={group.key}><h2>{group.title}<span className="mw-count">{count}</span></h2>
          {count ? <div className="mw-list">{taskRows.map(renderTask)}{todoRows.map(renderTodo)}</div> : <p className="mw-empty">No {group.title.toLowerCase()} items.</p>}
        </section>;
      })}
    </>;
  };

  const renderCalendar = () => <>
      <header className="mw-page-heading"><div>{appTitle && <p className="mw-brand">{appTitle}</p>}<p className="mw-eyebrow">SCHEDULE</p><h1>Calendar</h1></div></header>
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
    <section className="mw-section"><div className="mw-section-title"><h2>{formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })}</h2></div>
      {dayEvents.length === 0 && dayTasks.length === 0 ? <p className="mw-empty">Nothing scheduled for this day.</p> : <div className="mw-list">{dayEvents.map(renderEvent)}{dayTasks.map(renderTask)}</div>}
    </section>
  </>;

  const renderUpdates = () => <>
      <header className="mw-page-heading"><div>{appTitle && <p className="mw-brand">{appTitle}</p>}<p className="mw-eyebrow">NOTES</p><h1>Updates</h1></div></header>
    <p className="mw-capability-note">Phone push is not configured.</p>
    {updates.length === 0 ? <p className="mw-empty mw-empty-panel">No updates yet.</p> : <div className="mw-list">{updates.map(note => <article className="mw-card mw-note-card" key={note.id}><div className="mw-note-top"><span className="mw-note-tag">{note.tag}</span><time>{note.date}</time></div><button className="mw-note-edit" onClick={() => onEditUpdate(note)}><h2 className="mw-card-title">{note.title}</h2><p className="mw-note-body">{note.body}</p></button></article>)}</div>}
  </>;

  const mainAction = tab === 'Today' || tab === 'Tasks'
    ? { label: 'New task', run: onNewTask }
    : tab === 'Calendar'
      ? { label: 'Add event', run: () => onNewEvent(selectedDate) }
      : { label: 'New update', run: onNewUpdate };

  return <div className="mobile-workspace">
    <main className="mw-content">
      {tab === 'Today' ? renderToday() : tab === 'Tasks' ? renderTasks() : tab === 'Calendar' ? renderCalendar() : renderUpdates()}
      <button className="mw-primary mw-primary-action" onClick={mainAction.run}>{mainAction.label}</button>
    </main>
    <nav className="mw-bottom-nav" aria-label="Main navigation">
      {(['Today', 'Tasks', 'Calendar', 'Updates'] as Tab[]).map(item => <button key={item} className={tab === item ? 'is-active' : ''} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}><span className="mw-nav-icon" aria-hidden="true">{item === 'Today' ? '◷' : item === 'Tasks' ? '☷' : item === 'Calendar' ? '▦' : '▤'}</span><span>{item}</span></button>)}
    </nav>
  </div>;
}
