import React, { useMemo, useState } from 'react';
import type { CalendarEvent, Note, Task, TaskTodoItem } from '../types';
import './MobileWorkspace.css';
import { TaskCard, TaskKanban, fromTask, fromTodo, statusGroup, type CardHandlers } from './TaskKanban';

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
const taskGroup = (task: Task) => statusGroup(task.status);
const formatDate = (value: string, options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) => {
  const date = parseDate(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, options);
};
export function MobileWorkspace({ tasks, todos, events, updates, appTitle, pendingTodoIds = [], onEditTask, onNewTask, onChangeTaskStatus, onEditTodo, onChangeTodoStatus, onChangeTaskPriority, onChangeTodoPriority, onAddTaskSubtask, onToggleTaskSubtask, onAddTodoSubtask, onToggleTodoSubtask, onNewUpdate, onEditUpdate, onOpenEvent, onNewEvent }: Props) {
  const today = dateKey(new Date());
  const [tab, setTab] = useState<Tab>('Today');
  const [selectedDate, setSelectedDate] = useState(today);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const handlers: CardHandlers = { onEditTask, onEditTodo, onChangeTaskStatus, onChangeTodoStatus, onChangeTaskPriority, onChangeTodoPriority, onAddTaskSubtask, onToggleTaskSubtask, onAddTodoSubtask, onToggleTodoSubtask };

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

  const renderTask = (task: Task) => <TaskCard key={`task-${task.id}`} item={fromTask(task)} handlers={handlers} />;
  const renderTodo = (todo: TaskTodoItem) => <TaskCard key={`todo-${todo.id}`} item={fromTodo(todo)} handlers={handlers} pendingOnDevice={pendingTodoIds.includes(todo.id)} />;
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

  const renderTasks = () => <>
    <header className="mw-page-heading"><div>{appTitle && <p className="mw-brand">{appTitle}</p>}<p className="mw-eyebrow">WORK</p><h1>Tasks</h1></div><button className="mw-primary" onClick={onNewTask}>New task</button></header>
    <TaskKanban tasks={tasks} todos={todos} handlers={handlers} pendingTodoIds={pendingTodoIds} layout="stacked" />
  </>;

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
