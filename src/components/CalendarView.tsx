import React from 'react';
import { T, Task, MarketingPost, TrainingModule, Candidate, Permit } from '../types';
import { SectionHeader } from './UI';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

// Helper to get date string YYYY-MM-DD
const toDateStr = (date: Date) => date.toISOString().split('T')[0];

export function LaunchWindow({ tasks, permits, candidates }: { tasks: Task[], permits: Permit[], candidates: Candidate[] }) {
  const isMobile = window.innerWidth < 1024;
  const today = new Date("2026-04-15");
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 16, padding: isMobile ? "14px 16px" : 32, marginTop: isMobile ? 16 : 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isMobile ? 12 : 24 }}>
        <CalendarIcon size={16} color={T.gold} />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: isMobile ? 10 : 11, color: T.muted, letterSpacing: 1.2, fontWeight: 700 }}>NEXT 7 DAYS</span>
      </div>
      
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any, marginLeft: -2, paddingBottom: 4 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? 6 : 12, minWidth: isMobile ? 420 : "auto" }}>
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
              <div key={dateStr} style={{ border: `1px solid ${isToday ? T.gold : T.border}`, borderRadius: 12, padding: isMobile ? 8 : 12, background: isToday ? T.goldLight : "none", minHeight: isMobile ? 90 : 140, transition: "all .3s ease" }}>
                <div style={{ fontSize: isMobile ? 9 : 10, color: T.muted, marginBottom: 4, textAlign: "center", fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontWeight: 700, letterSpacing: 0.5 }}>
                  {date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Phoenix' }).slice(0, isMobile ? 1 : 3).toUpperCase()}
                </div>
                <div style={{ 
                  width: isMobile ? 22 : 28, height: isMobile ? 22 : 28, borderRadius: "50%", margin: "0 auto", 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isToday ? T.gold : "none", color: isToday ? "#FFF" : T.text,
                  fontSize: isMobile ? 11 : 12, fontWeight: 700,
                  marginBottom: isMobile ? 4 : 8
                }}>
                  {date.getDate()}
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {events.slice(0, isMobile ? 2 : 3).map((ev, idx) => (
                    <div key={idx} style={{ 
                      fontSize: 8, padding: "2px 3px", borderRadius: 3, 
                      background: ev.color + "15", color: ev.color, 
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      border: `1px solid ${ev.color}30`
                    }}>
                      {ev.label}
                    </div>
                  ))}
                  {events.length > (isMobile ? 2 : 3) && <div style={{ fontSize: 8, color: T.muted, textAlign: "center" }}>+{events.length - (isMobile ? 2 : 3)}</div>}
                </div>
              </div>
            );
          })}
        </div>
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

  const isMobile = window.innerWidth < 1024;
  const dayLabels = isMobile
    ? ["S","M","T","W","T","F","S"]
    : ["SUN","MON","TUE","WED","THU","FRI","SAT"];

  return (
    <div className="fu">
      <SectionHeader 
        title="Project Calendar" 
        subtitle={isMobile ? "Tap a day to add" : "Full monthly view. Click a day to add a task, or click an item to edit."}
        action={
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
            <button onClick={prevMonth} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: isMobile ? 8 : 6, cursor: "pointer" }}><ChevronLeft size={16} /></button>
            <span style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontWeight: 700, fontSize: isMobile ? 14 : 16, minWidth: isMobile ? 110 : 140, textAlign: "center" }}>
              {currentDate.toLocaleDateString('en-US', { month: isMobile ? 'short' : 'long', year: 'numeric', timeZone: 'America/Phoenix' })}
            </span>
            <button onClick={nextMonth} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: isMobile ? 8 : 6, cursor: "pointer" }}><ChevronRight size={16} /></button>
          </div>
        }
      />

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.02)", minWidth: isMobile ? 350 : "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
            {dayLabels.map(d => (
              <div key={d} style={{ padding: isMobile ? "10px 4px" : "16px", textAlign: "center", fontSize: isMobile ? 10 : 10, fontFamily: "'IBM Plex Mono', monospace", color: T.muted, letterSpacing: isMobile ? 0 : 1.2, fontWeight: 700 }}>{d}</div>
            ))}
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: `minmax(${isMobile ? 60 : 120}px, auto)` }}>
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
                    padding: isMobile ? "4px 3px" : 8, 
                    background: isToday ? T.goldLight : "#FFF",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ 
                    fontSize: isMobile ? 11 : 12, fontWeight: 700, color: isToday ? T.gold : T.text, 
                    marginBottom: isMobile ? 3 : 8, textAlign: "right",
                    lineHeight: 1
                  }}>
                    {date.getDate()}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 4 }}>
                    {items.slice(0, isMobile ? 1 : 99).map((it, idx) => (
                      <div 
                        key={idx} 
                        onClick={(e) => handleItemClick(e, it)}
                        style={{ 
                          fontSize: isMobile ? 8 : 9, padding: isMobile ? "1px 3px" : "2px 6px", borderRadius: 3, 
                          background: it.color + "15", color: it.color, 
                          border: `1px solid ${it.color}30`,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          cursor: "pointer"
                        }}
                      >
                        {it.label}
                      </div>
                    ))}
                    {isMobile && items.length > 1 && (
                      <div style={{ fontSize: 8, color: T.muted, textAlign: "center" }}>+{items.length - 1}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


