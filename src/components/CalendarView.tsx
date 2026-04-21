import React from 'react';
import { T, Task, MarketingPost, TrainingModule, Candidate, Permit } from '../types';
import { SectionHeader } from './UI';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

// Helper to get date string YYYY-MM-DD
const toDateStr = (date: Date) => date.toISOString().split('T')[0];

export function LaunchWindow({ tasks, permits, candidates }: { tasks: Task[], permits: Permit[], candidates: Candidate[] }) {
  const today = new Date("2026-04-15");
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, padding: 32, marginTop: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <CalendarIcon size={18} color={T.gold} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted, letterSpacing: 1.2, fontWeight: 700 }}>LAUNCH WINDOW: NEXT 7 DAYS</span>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
        {days.map((date, i) => {
          const dateStr = toDateStr(date);
          const dayTasks = tasks.filter(t => t.due === dateStr);
          const dayPermits = permits.filter(p => p.expiryDate === dateStr);
          const dayCandidates = candidates.filter(c => c.date === dateStr);
          
          const isToday = i === 0;
          const events = [
            ...dayTasks.map(t => ({ label: t.task, color: T.blue })),
            ...dayPermits.map(p => ({ label: p.name, color: T.red })),
            ...dayCandidates.map(c => ({ label: c.name, color: T.purple }))
          ];

          return (
            <div key={dateStr} style={{ border: `1px solid ${isToday ? T.gold : T.border}`, borderRadius: 16, padding: 12, background: isToday ? T.goldLight : "none", minHeight: 140, transition: "all .3s ease" }}>
              <div style={{ fontSize: 10, color: T.muted, marginBottom: 8, textAlign: "center", fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: 0.5 }}>{date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Phoenix' }).toUpperCase()}</div>
              <div style={{ 
                width: 28, height: 28, borderRadius: "50%", margin: "0 auto", 
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isToday ? T.gold : "none", color: isToday ? "#FFF" : T.text,
                fontSize: 12, fontWeight: 700,
                marginBottom: 8
              }}>
                {date.getDate()}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {events.slice(0, 3).map((ev, idx) => (
                  <div key={idx} style={{ 
                    fontSize: 8, padding: "2px 4px", borderRadius: 3, 
                    background: ev.color + "15", color: ev.color, 
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    border: `1px solid ${ev.color}30`
                  }}>
                    {ev.label}
                  </div>
                ))}
                {events.length > 3 && <div style={{ fontSize: 8, color: T.muted, textAlign: "center" }}>+{events.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FullCalendar({ 
  tasks, marketing, training, candidates, 
  onEditTask, onEditMkt, onEditTrain, onEditCan,
  onAddEvent
}: { 
  tasks: Task[], marketing: MarketingPost[], training: TrainingModule[], candidates: Candidate[],
  onEditTask: (t: any) => void, onEditMkt: (m: any) => void, onEditTrain: (t: any) => void, onEditCan: (c: any) => void,
  onAddEvent: (date: string) => void
}) {
  const [currentDate, setCurrentDate] = React.useState(new Date("2026-04-15"));
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    if (day > 0 && day <= daysInMonth) {
      return new Date(year, month, day);
    }
    return null;
  });

  const getItemsForDate = (date: Date) => {
    const ds = toDateStr(date);
    const items = [
      ...tasks.filter(t => t.due === ds).map(t => ({ type: 'task', label: t.task, color: T.blue, original: t })),
      ...marketing.filter(m => m.date === ds).map(m => ({ type: 'marketing', label: m.title, color: T.purple, original: m })),
      ...training.filter(t => t.date === ds).map(t => ({ type: 'training', label: t.title, color: T.orange, original: t })),
      ...candidates.filter(c => c.date === ds).map(c => ({ type: 'hiring', label: `${c.name}`, color: T.green, original: c }))
    ];
    return items;
  };

  const handleItemClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (item.type === 'task') onEditTask(item.original);
    if (item.type === 'marketing') onEditMkt(item.original);
    if (item.type === 'training') onEditTrain(item.original);
    if (item.type === 'hiring') onEditCan(item.original);
  };

  return (
    <div className="fu">
      <SectionHeader 
        title="Project Calendar" 
        subtitle="Full monthly view. Click a day to add a task, or click an item to edit."
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={prevMonth} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: 6, cursor: "pointer" }}><ChevronLeft size={16} /></button>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, minWidth: 140, textAlign: "center" }}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/Phoenix' })}
            </span>
            <button onClick={nextMonth} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: 6, cursor: "pointer" }}><ChevronRight size={16} /></button>
          </div>
        }
      />

      <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
            <div key={d} style={{ padding: "16px", textAlign: "center", fontSize: 10, fontFamily: "'DM Mono', monospace", color: T.muted, letterSpacing: 1.2, fontWeight: 700 }}>{d}</div>
          ))}
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(120px, auto)" }}>
          {calendarDays.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} style={{ background: "#FAFAFA", borderRight: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }} />;
            
            const items = getItemsForDate(date);
            const isToday = toDateStr(date) === "2026-04-15";
            const ds = toDateStr(date);

            return (
              <div 
                key={ds} 
                onClick={() => onAddEvent(ds)}
                style={{ 
                  borderRight: `1px solid ${T.border}`, 
                  borderBottom: `1px solid ${T.border}`, 
                  padding: 8, 
                  background: isToday ? T.goldLight : "#FFF",
                  cursor: "cell"
                }}
              >
                <div style={{ 
                  fontSize: 12, fontWeight: 700, color: isToday ? T.gold : T.text, 
                  marginBottom: 8, textAlign: "right" 
                }}>
                  {date.getDate()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {items.map((it, idx) => (
                    <div 
                      key={idx} 
                      onClick={(e) => handleItemClick(e, it)}
                      style={{ 
                        fontSize: 9, padding: "2px 6px", borderRadius: 4, 
                        background: it.color + "15", color: it.color, 
                        border: `1px solid ${it.color}30`,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        cursor: "pointer"
                      }}
                    >
                      {it.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
