import React from 'react';
import { T, Task, MarketingPost, TrainingModule, Candidate, Permit,
  CalendarEvent, CalendarEventType, CALENDAR_EVENT_TYPES, CALENDAR_EVENT_COLORS } from '../types';
import { Modal, Field, inpStyle, selStyle, Btn } from './UI';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, X } from 'lucide-react';

const toDateStr = (date: Date) => date.toISOString().split('T')[0];

const fmtDate = (ds: string) => {
  const d = new Date(ds + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Phoenix' });
};

const fmtShort = (ds: string) => {
  const d = new Date(ds + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Phoenix' });
};

// ─── CalendarEventModal ──────────────────────────────────────────────────────

export function CalendarEventModal({
  event,
  initialDate,
  onSave,
  onClose,
}: {
  event: CalendarEvent | null;
  initialDate?: string;
  onSave: (form: any) => void;
  onClose: () => void;
}) {
  const blank = { title: '', date: initialDate || toDateStr(new Date()), time: '', type: 'Event' as CalendarEventType, notes: '' };
  const [form, setForm] = React.useState<any>(event ? { ...event } : blank);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Modal title={event ? 'Edit Event' : 'New Event'} onClose={onClose} width={480}>
      <Field label="TITLE">
        <input
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. Team lunch meeting"
          style={inpStyle}
          autoFocus
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="DATE">
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inpStyle} />
        </Field>
        <Field label="TIME (OPTIONAL)">
          <input type="time" value={form.time || ''} onChange={e => set('time', e.target.value)} style={inpStyle} />
        </Field>
      </div>
      <Field label="TYPE">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CALENDAR_EVENT_TYPES.map(t => {
            const c = CALENDAR_EVENT_COLORS[t];
            const active = form.type === t;
            return (
              <button key={t} onClick={() => set('type', t)}
                style={{ cursor: 'pointer', borderRadius: 24, padding: '5px 14px', fontSize: 12,
                  fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontWeight: 600,
                  border: `1px solid ${active ? c.border : T.border}`,
                  background: active ? c.bg : '#FFF', color: active ? c.text : T.muted, transition: 'all .15s' }}>
                {t}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="NOTES (OPTIONAL)">
        <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
          placeholder="Add details, links, or reminders..."
          rows={3} style={{ ...inpStyle, resize: 'vertical', lineHeight: 1.6 }} />
      </Field>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.title.trim()) onSave(form); }} variant="primary">
          {event ? 'Save Changes' : 'Add Event'}
        </Btn>
      </div>
    </Modal>
  );
}

// ─── DayPanel ────────────────────────────────────────────────────────────────
// Bottom sheet on mobile, centered panel on desktop

interface DayItem {
  id: number;
  label: string;
  sublabel?: string;
  color: string;
  bg: string;
  border: string;
  type: string;
  original: any;
}

function DayPanel({
  dateStr,
  items,
  calendarEvents,
  onClose,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onEditTask,
  onEditMkt,
  onEditTrain,
  onEditCan,
}: {
  dateStr: string;
  items: DayItem[];
  calendarEvents: CalendarEvent[];
  onClose: () => void;
  onAddEvent: () => void;
  onEditEvent: (ev: CalendarEvent) => void;
  onDeleteEvent: (id: number) => void;
  onEditTask: (t: any) => void;
  onEditMkt: (m: any) => void;
  onEditTrain: (t: any) => void;
  onEditCan: (c: any) => void;
}) {
  const isMobile = window.innerWidth < 1024;
  const dayEvents = calendarEvents.filter(e => e.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const allItems = [...items];

  const handleItemEdit = (item: DayItem) => {
    onClose();
    if (item.type === 'task') onEditTask(item.original);
    else if (item.type === 'marketing') onEditMkt(item.original);
    else if (item.type === 'training') onEditTrain(item.original);
    else if (item.type === 'hiring') onEditCan(item.original);
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 900,
    display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
  };

  const panel: React.CSSProperties = isMobile
    ? {
        background: '#FFF', borderRadius: '20px 20px 0 0', width: '100%',
        maxHeight: '85vh', overflowY: 'auto', padding: '0 0 32px',
        boxShadow: '0 -8px 40px rgba(0,0,0,.12)',
      }
    : {
        background: '#FFF', borderRadius: 20, width: 480, maxWidth: '92vw',
        maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 16px 48px rgba(0,0,0,.14)', padding: '0 0 28px',
      };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: '#FFF', padding: isMobile ? '16px 20px 12px' : '20px 24px 14px',
          borderBottom: `1px solid ${T.border}`, zIndex: 1, borderRadius: isMobile ? '20px 20px 0 0' : 20 }}>
          {isMobile && (
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border, margin: '0 auto 12px' }} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: T.text,
                fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
                {fmtDate(dateStr)}
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2,
                fontFamily: "'IBM Plex Mono', monospace" }}>
                {dayEvents.length + allItems.length} item{(dayEvents.length + allItems.length) !== 1 ? 's' : ''}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none',
              cursor: 'pointer', color: T.muted, padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: isMobile ? '16px 20px' : '20px 24px' }}>
          {/* Add Event button */}
          <button onClick={onAddEvent}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              background: T.goldLight, border: `1.5px dashed ${T.goldBorder}`, borderRadius: 12,
              padding: '12px 16px', cursor: 'pointer', color: T.gold, marginBottom: 20,
              fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontWeight: 600,
              fontSize: 14, transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F5E9DC'}
            onMouseLeave={e => e.currentTarget.style.background = T.goldLight}>
            <Plus size={16} />
            Add Event for {fmtShort(dateStr)}
          </button>

          {/* Calendar Events */}
          {dayEvents.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: T.subtle,
                letterSpacing: 1, fontWeight: 700, marginBottom: 10 }}>YOUR EVENTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayEvents.map(ev => {
                  const c = CALENDAR_EVENT_COLORS[ev.type as CalendarEventType] || CALENDAR_EVENT_COLORS['Event'];
                  return (
                    <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
                      padding: '10px 14px' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text,
                          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                          {ev.time && (
                            <span style={{ fontSize: 11, color: T.muted, display: 'flex', alignItems: 'center', gap: 3,
                              fontFamily: "'IBM Plex Mono', monospace" }}>
                              <Clock size={10} />{ev.time}
                            </span>
                          )}
                          <span style={{ fontSize: 10, color: c.text, fontWeight: 700,
                            fontFamily: "'Segoe UI', sans-serif" }}>{ev.type}</span>
                          {ev.notes && <span style={{ fontSize: 11, color: T.subtle, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160,
                            fontFamily: "'Segoe UI', sans-serif" }}>{ev.notes}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => onEditEvent(ev)}
                          style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 6,
                            padding: '4px 10px', fontSize: 11, color: T.muted, cursor: 'pointer',
                            fontFamily: "'Segoe UI', sans-serif", fontWeight: 600 }}>Edit</button>
                        <button onClick={() => onDeleteEvent(ev.id)}
                          style={{ background: 'none', border: `1px solid ${T.redBorder}`, borderRadius: 6,
                            padding: '4px 10px', fontSize: 11, color: T.red, cursor: 'pointer',
                            fontFamily: "'Segoe UI', sans-serif", fontWeight: 600 }}>Del</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other items (tasks, marketing, training, hiring) */}
          {allItems.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: T.subtle,
                letterSpacing: 1, fontWeight: 700, marginBottom: 10 }}>SCHEDULED ITEMS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allItems.map((item, idx) => (
                  <div key={idx} onClick={() => handleItemEdit(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      background: item.bg, border: `1px solid ${item.border}`, borderRadius: 10,
                      cursor: 'pointer', transition: 'all .15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text,
                        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
                      {item.sublabel && <div style={{ fontSize: 11, color: T.muted, marginTop: 1,
                        fontFamily: "'Segoe UI', sans-serif" }}>{item.sublabel}</div>}
                    </div>
                    <span style={{ fontSize: 9, color: item.color, fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 700, letterSpacing: 0.5, flexShrink: 0 }}>{item.type.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dayEvents.length === 0 && allItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: T.subtle,
              fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 14 }}>
              Nothing scheduled — tap above to add an event.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LaunchWindow ─────────────────────────────────────────────────────────────

export function LaunchWindow({ tasks, permits, candidates, calendarEvents }: {
  tasks: Task[], permits: Permit[], candidates: Candidate[], calendarEvents?: CalendarEvent[]
}) {
  const isMobile = window.innerWidth < 1024;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div style={{ background: '#FFF', border: `1px solid ${T.border}`, borderRadius: 16,
      padding: isMobile ? '14px 16px' : 32, marginTop: isMobile ? 16 : 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 12 : 24 }}>
        <CalendarIcon size={16} color={T.gold} />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: isMobile ? 10 : 11,
          color: T.muted, letterSpacing: 1.2, fontWeight: 700 }}>NEXT 7 DAYS</span>
      </div>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, marginLeft: -2, paddingBottom: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? 6 : 12,
          minWidth: isMobile ? 420 : 'auto' }}>
          {days.map((date, i) => {
            const dateStr = toDateStr(date);
            const dayTasks = tasks.filter(t => t.due === dateStr);
            const dayPermits = permits.filter(p => p.expiryDate === dateStr);
            const dayCandidates = candidates.filter(c => c.date === dateStr);
            const dayEvents = (calendarEvents || []).filter(e => e.date === dateStr);
            const isToday = i === 0;
            const events = [
              ...dayTasks.map(t => ({ label: t.task, color: T.blue })),
              ...dayPermits.map(p => ({ label: p.name, color: T.red })),
              ...dayCandidates.map(c => ({ label: c.name, color: T.purple })),
              ...dayEvents.map(e => ({ label: e.title, color: CALENDAR_EVENT_COLORS[e.type as CalendarEventType]?.dot || T.gold })),
            ];
            return (
              <div key={dateStr} style={{ border: `1px solid ${isToday ? T.gold : T.border}`, borderRadius: 12,
                padding: isMobile ? 8 : 12, background: isToday ? T.goldLight : 'none',
                minHeight: isMobile ? 90 : 140, transition: 'all .3s ease' }}>
                <div style={{ fontSize: isMobile ? 9 : 10, color: T.muted, marginBottom: 4, textAlign: 'center',
                  fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontWeight: 700, letterSpacing: 0.5 }}>
                  {date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Phoenix' }).slice(0, isMobile ? 1 : 3).toUpperCase()}
                </div>
                <div style={{ width: isMobile ? 22 : 28, height: isMobile ? 22 : 28, borderRadius: '50%',
                  margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isToday ? T.gold : 'none', color: isToday ? '#FFF' : T.text,
                  fontSize: isMobile ? 11 : 12, fontWeight: 700, marginBottom: isMobile ? 4 : 8 }}>
                  {date.getDate()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {events.slice(0, isMobile ? 2 : 3).map((ev, idx) => (
                    <div key={idx} style={{ fontSize: 8, padding: '2px 3px', borderRadius: 3,
                      background: ev.color + '15', color: ev.color, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis', border: `1px solid ${ev.color}30` }}>
                      {ev.label}
                    </div>
                  ))}
                  {events.length > (isMobile ? 2 : 3) && (
                    <div style={{ fontSize: 8, color: T.muted, textAlign: 'center' }}>
                      +{events.length - (isMobile ? 2 : 3)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── FullCalendar ─────────────────────────────────────────────────────────────

export function FullCalendar({
  tasks, marketing, training, candidates, calendarEvents,
  onEditTask, onEditMkt, onEditTrain, onEditCan,
  onSaveCalendarEvent, onDeleteCalendarEvent,
}: {
  tasks: Task[];
  marketing: MarketingPost[];
  training: TrainingModule[];
  candidates: Candidate[];
  calendarEvents: CalendarEvent[];
  onEditTask: (t: any) => void;
  onEditMkt: (m: any) => void;
  onEditTrain: (t: any) => void;
  onEditCan: (c: any) => void;
  onSaveCalendarEvent: (form: any) => void;
  onDeleteCalendarEvent: (id: number) => void;
}) {
  const [currentDate, setCurrentDate] = React.useState(() => new Date());
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);
  const [eventModal, setEventModal] = React.useState<CalendarEvent | 'new' | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return (day > 0 && day <= daysInMonth) ? new Date(year, month, day) : null;
  });

  const getItemsForDate = (date: Date): DayItem[] => {
    const ds = toDateStr(date);
    return [
      ...tasks.filter(t => t.due === ds).map(t => ({
        id: t.id, type: 'task', label: t.task,
        sublabel: `${t.category} · ${t.status}`,
        color: T.blue, bg: '#F1F6FB', border: '#D3E0ED', original: t,
      })),
      ...marketing.filter(m => m.date === ds).map(m => ({
        id: m.id, type: 'marketing', label: m.title,
        sublabel: `${m.platform} · ${m.status}`,
        color: T.purple, bg: '#F5F1FA', border: '#DFD4EC', original: m,
      })),
      ...training.filter(t => t.date === ds).map(t => ({
        id: t.id, type: 'training', label: t.title,
        sublabel: `${t.category} training`,
        color: T.orange, bg: '#FAF5F1', border: '#E9DDCF', original: t,
      })),
      ...candidates.filter(c => c.date === ds).map(c => ({
        id: c.id, type: 'hiring', label: c.name,
        sublabel: `${c.position} · ${c.stage}`,
        color: T.green, bg: '#F1F8F2', border: '#D3E4D5', original: c,
      })),
    ];
  };

  const isMobile = window.innerWidth < 1024;
  const todayStr = toDateStr(new Date());
  const dayLabels = isMobile ? ['S','M','T','W','T','F','S'] : ['SUN','MON','TUE','WED','THU','FRI','SAT'];

  const handleDayClick = (ds: string) => {
    setSelectedDay(ds);
  };

  const handleSaveEvent = (form: any) => {
    onSaveCalendarEvent({ ...form, _editId: eventModal !== 'new' ? (eventModal as CalendarEvent)?.id : undefined });
    setEventModal(null);
    // Keep day panel open so user can see the new event
  };

  const handleDeleteEvent = (id: number) => {
    onDeleteCalendarEvent(id);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10, marginBottom: isMobile ? 12 : 20 }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.muted,
            letterSpacing: 1.2, fontWeight: 700, marginBottom: 4 }}>PROJECT CALENDAR</div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: T.text,
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/Phoenix' })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={goToday}
            style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
              padding: isMobile ? '7px 12px' : '7px 14px', fontSize: 12, cursor: 'pointer',
              fontFamily: "'Segoe UI', sans-serif", fontWeight: 600, color: T.text }}>Today</button>
          <button onClick={prevMonth}
            style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8,
              padding: isMobile ? 8 : 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth}
            style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8,
              padding: isMobile ? 8 : 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: isMobile ? 10 : 14 }}>
        {([
          { label: 'Event', color: T.blue },
          { label: 'Task', color: T.blue, opacity: true },
          { label: 'Marketing', color: T.purple },
          { label: 'Training', color: T.orange },
          { label: 'Hiring', color: T.green },
        ]).map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: T.muted, fontFamily: "'Segoe UI', sans-serif" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        <div style={{ background: '#FFF', border: `1px solid ${T.border}`, borderRadius: 16,
          overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.02)', minWidth: isMobile ? 340 : 'auto' }}>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            background: T.bg, borderBottom: `1px solid ${T.border}` }}>
            {dayLabels.map((d, i) => (
              <div key={i} style={{ padding: isMobile ? '10px 4px' : '14px 8px', textAlign: 'center',
                fontSize: isMobile ? 10 : 10, fontFamily: "'IBM Plex Mono', monospace",
                color: T.muted, letterSpacing: isMobile ? 0 : 1, fontWeight: 700 }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gridAutoRows: `minmax(${isMobile ? 56 : 110}px, auto)` }}>
            {calendarDays.map((date, i) => {
              if (!date) return (
                <div key={`empty-${i}`} style={{ background: '#FAFAFA',
                  borderRight: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }} />
              );
              const ds = toDateStr(date);
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDay;
              const items = getItemsForDate(date);
              const dayCalEvents = calendarEvents.filter(e => e.date === ds);
              const totalCount = items.length + dayCalEvents.length;

              return (
                <div key={ds} onClick={() => handleDayClick(ds)}
                  style={{ borderRight: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
                    padding: isMobile ? '4px 3px' : '8px 8px', cursor: 'pointer', transition: 'background .1s',
                    background: isSelected ? '#FFF3E8' : isToday ? T.goldLight : '#FFF',
                    outline: isSelected ? `2px solid ${T.gold}` : 'none',
                    outlineOffset: -2, position: 'relative' }}>

                  {/* Date number */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between',
                    marginBottom: isMobile ? 3 : 6 }}>
                    <div style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isToday ? T.gold : 'none', color: isToday ? '#FFF' : isSelected ? T.gold : T.text,
                      fontSize: isMobile ? 11 : 12, fontWeight: 700 }}>
                      {date.getDate()}
                    </div>
                    {!isMobile && totalCount > 0 && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.gold, flexShrink: 0 }} />
                    )}
                  </div>

                  {/* Event dots/pills */}
                  {!isMobile && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {dayCalEvents.slice(0, 2).map((ev, idx) => {
                        const c = CALENDAR_EVENT_COLORS[ev.type as CalendarEventType] || CALENDAR_EVENT_COLORS['Event'];
                        return (
                          <div key={idx} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3,
                            background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            fontFamily: "'Segoe UI', sans-serif", fontWeight: 600 }}>
                            {ev.time ? `${ev.time} ` : ''}{ev.title}
                          </div>
                        );
                      })}
                      {items.slice(0, Math.max(0, 3 - Math.min(dayCalEvents.length, 2))).map((it, idx) => (
                        <div key={`item-${idx}`} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3,
                          background: it.color + '12', color: it.color, border: `1px solid ${it.color}25`,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {it.label}
                        </div>
                      ))}
                      {totalCount > 3 && (
                        <div style={{ fontSize: 9, color: T.muted, paddingLeft: 5 }}>+{totalCount - 3} more</div>
                      )}
                    </div>
                  )}

                  {/* Mobile: just show dot indicator */}
                  {isMobile && totalCount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                      {[...dayCalEvents.slice(0, 2), ...items.slice(0, Math.max(0, 3 - dayCalEvents.length))].map((ev: any, idx) => {
                        const color = ev.dot ? CALENDAR_EVENT_COLORS[(ev as CalendarEvent).type as CalendarEventType]?.dot
                          : (ev as DayItem).color;
                        return (
                          <div key={idx} style={{ width: 5, height: 5, borderRadius: '50%',
                            background: color || T.gold, flexShrink: 0 }} />
                        );
                      })}
                      {totalCount > 3 && (
                        <div style={{ fontSize: 7, color: T.muted, lineHeight: '5px' }}>+</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile hint */}
      {isMobile && (
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: T.subtle,
          fontFamily: "'Segoe UI', sans-serif" }}>
          Tap any day to view or add events
        </div>
      )}

      {/* Day Panel */}
      {selectedDay && (
        <DayPanel
          dateStr={selectedDay}
          items={getItemsForDate(new Date(selectedDay + 'T12:00:00'))}
          calendarEvents={calendarEvents}
          onClose={() => setSelectedDay(null)}
          onAddEvent={() => setEventModal('new')}
          onEditEvent={(ev) => setEventModal(ev)}
          onDeleteEvent={(id) => {
            handleDeleteEvent(id);
          }}
          onEditTask={(t) => { setSelectedDay(null); onEditTask(t); }}
          onEditMkt={(m) => { setSelectedDay(null); onEditMkt(m); }}
          onEditTrain={(t) => { setSelectedDay(null); onEditTrain(t); }}
          onEditCan={(c) => { setSelectedDay(null); onEditCan(c); }}
        />
      )}

      {/* CalendarEventModal */}
      {eventModal && (
        <CalendarEventModal
          event={eventModal === 'new' ? null : eventModal as CalendarEvent}
          initialDate={selectedDay || toDateStr(new Date())}
          onSave={handleSaveEvent}
          onClose={() => setEventModal(null)}
        />
      )}
    </div>
  );
}
