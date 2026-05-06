import React, { useState } from 'react';
import { T, CAT_COLORS, STATUS_COLORS, PRIORITY_COLORS, CATEGORIES, Task, Note } from '../types';
import { Modal, Field, inpStyle, selStyle, Btn } from './UI';
import { PenLine, Trash2 } from 'lucide-react';

export function TaskModal({ task, initialDate, notes, onSave, onClose }: { task: Task | null, initialDate?: string, notes: Note[], onSave: (form: any) => void, onClose: () => void }) {
  const isMobile = window.innerWidth < 1024;
  const blank = { task: "", category: "Lease & TI", due: initialDate || "", status: "Not Started", priority: "Medium", checklist: [], assignedTo: "", isCritical: false, linkedNoteId: null };
  const [form, setForm] = useState<any>(task ? { ...task, checklist: task.checklist.map(c => ({ ...c })) } : blank);
  const [newItem, setNewItem] = useState("");
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const addItem = () => { if (!newItem.trim()) return; setForm((f: any) => ({ ...f, checklist: [...f.checklist, { id: Date.now(), text: newItem.trim(), done: false, assignedTo: "" }] })); setNewItem(""); };

  return (
    <Modal title={task ? "Edit Task" : "New Task"} onClose={onClose}>
      <Field label="TASK NAME"><input value={form.task} onChange={e => set("task", e.target.value)} placeholder="e.g. Apply for Health Permit" style={inpStyle} /></Field>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, background: form.isCritical ? T.redLight : T.bg, padding: "8px 12px", borderRadius: 8, border: `1px solid ${form.isCritical ? T.redBorder : T.border}`, transition: "all .2s" }}>
        <input type="checkbox" checked={form.isCritical} onChange={e => set("isCritical", e.target.checked)} style={{ cursor: "pointer", width: 16, height: 16 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: form.isCritical ? T.red : T.text }}>Critical Path Task</span>
        {form.isCritical && <span style={{ fontSize: 10, color: T.red, fontWeight: 700, marginLeft: "auto" }}>OVERDUE ALERTS ACTIVE</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        <Field label="CATEGORY"><select value={form.category} onChange={e => set("category", e.target.value)} style={selStyle}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="PRIORITY"><select value={form.priority} onChange={e => set("priority", e.target.value)} style={selStyle}>{["Low", "Medium", "High", "Critical"].map(p => <option key={p}>{p}</option>)}</select></Field>
        <Field label="DUE DATE"><input type="date" value={form.due} onChange={e => set("due", e.target.value)} style={inpStyle} /></Field>
        <Field label="STATUS"><select value={form.status} onChange={e => set("status", e.target.value)} style={selStyle}>{["Not Started", "In Progress", "Complete", "Overdue"].map(s => <option key={s}>{s}</option>)}</select></Field>
      </div>
      <Field label="ASSIGNED TO"><input value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)} placeholder="e.g. Partner Name, Manager" style={inpStyle} /></Field>
      <Field label="LINKED NOTE (OPTIONAL)">
        <select value={form.linkedNoteId || ""} onChange={e => set("linkedNoteId", e.target.value ? Number(e.target.value) : null)} style={selStyle}>
          <option value="">None</option>
          {notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
        </select>
      </Field>
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 18, marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: T.muted, letterSpacing: 1.2, fontWeight: 600 }}>SUBTASK CHECKLIST</label>
          {form.checklist.length > 0 && <span style={{ fontSize: 11, color: T.muted }}>{form.checklist.filter((c: any) => c.done).length}/{form.checklist.length} done</span>}
        </div>
        {form.checklist.map((item: any) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <button onClick={() => setForm((f: any) => ({ ...f, checklist: f.checklist.map((c: any) => c.id === item.id ? { ...c, done: !c.done } : c) }))} style={{ width: 18, height: 18, minWidth: 18, border: `2px solid ${item.done ? T.green : T.border}`, borderRadius: 4, background: item.done ? T.greenLight : "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
              {item.done && <span style={{ color: T.green, fontSize: 11 }}>x</span>}
            </button>
            <input value={item.text} onChange={e => setForm((f: any) => ({ ...f, checklist: f.checklist.map((c: any) => c.id === item.id ? { ...c, text: e.target.value } : c) }))} style={{ ...inpStyle, flex: 2, minWidth: isMobile ? "100%" : undefined, padding: "6px 10px", textDecoration: item.done ? "line-through" : "none", color: item.done ? T.muted : T.text, fontSize: 12 }} />
            <input value={item.assignedTo || ""} onChange={e => setForm((f: any) => ({ ...f, checklist: f.checklist.map((c: any) => c.id === item.id ? { ...c, assignedTo: e.target.value } : c) }))} placeholder="Assign to..." style={{ ...inpStyle, flex: 1, minWidth: isMobile ? "calc(100% - 40px)" : undefined, padding: "6px 10px", fontSize: 11, background: "#FFF" }} title="Assigned To" />
            <button onClick={() => setForm((f: any) => ({ ...f, checklist: f.checklist.filter((c: any) => c.id !== item.id) }))} style={{ background: "none", border: "none", color: T.subtle, cursor: "pointer", fontSize: 16, padding: "0 2px" }}>x</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} placeholder="Add subtask..." style={{ ...inpStyle, flex: 1, padding: "7px 11px", fontSize: 12 }} />
          <Btn onClick={addItem} variant="outline" small>+ Add</Btn>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, flexWrap: "wrap" }}>
        {task && (
          <div style={{ marginRight: "auto" }}>
            <Btn onClick={() => onSave({ ...form, _delete: true })} variant="outline" style={{ color: T.red, borderColor: T.redBorder }}>Delete Task</Btn>
          </div>
        )}
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.task.trim()) onSave(form); }} variant="primary">{task ? "Save Changes" : "Create Task"}</Btn>
      </div>
    </Modal>
  );
}

export function TaskRow({ task, onEdit, onDelete, onStatusChange, onSaveChecklist }: { task: Task, onEdit: (t: Task) => void, onDelete: (t: Task) => void, onStatusChange: (id: number, s: string) => void, onSaveChecklist: (tid: number, checklist: any[]) => void, key?: any }) {
  const [open, setOpen] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const total = task.checklist.length, done = task.checklist.filter(c => c.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const cc = CAT_COLORS[task.category] || {};
  const sc = STATUS_COLORS[task.status];
  const pc = PRIORITY_COLORS[task.priority];

  const updateChecklist = (next: any[]) => onSaveChecklist(task.id, next);
  const toggleSubtask = (cid: number) => updateChecklist(task.checklist.map(c => c.id === cid ? { ...c, done: !c.done } : c));
  const removeSubtask = (cid: number) => updateChecklist(task.checklist.filter(c => c.id !== cid));
  const addSubtask = () => {
    const text = newSubtask.trim(); if (!text) return;
    updateChecklist([...task.checklist, { id: Date.now(), text, done: false, assignedTo: "" }]);
    setNewSubtask("");
  };

  /* ── due-date colour ── */
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const dueDate = task.due ? new Date(task.due + "T12:00:00") : null;
  const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / 86400000) : null;
  const dueColor = daysLeft === null ? T.muted : daysLeft < 0 ? T.red : daysLeft <= 3 ? "#D97706" : T.muted;
  const dueBg    = daysLeft === null ? "transparent" : daysLeft < 0 ? T.redLight : daysLeft <= 3 ? "#FEF3C7" : "transparent";

  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, background: "#FFF" }}>
      {/* ── Main row ── */}
      <div
        style={{ display: "grid", gridTemplateColumns: "4px 1fr auto", alignItems: "stretch", cursor: "default" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#FAFAF8")}
        onMouseLeave={e => (e.currentTarget.style.background = "#FFF")}
      >
        {/* Left accent bar */}
        <div style={{ background: `linear-gradient(180deg, ${cc.dot || T.gold} 0%, ${cc.dot || T.gold}66 100%)`, borderRadius: "2px 0 0 2px" }} />

        {/* Main content */}
        <div style={{ padding: "14px 16px 14px 14px", minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            <button
              onClick={() => setOpen(x => !x)}
              style={{ flexShrink: 0, marginTop: 2, width: 18, height: 18, border: `2px solid ${open ? T.gold : T.border}`, borderRadius: 5, background: open ? T.goldLight : "#FFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, transition: "all .15s" }}
            >
              <span style={{ fontSize: 9, color: open ? T.gold : T.muted, fontWeight: 700, transform: open ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform .15s" }}>▶</span>
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: task.status === "Complete" ? T.muted : T.text, lineHeight: 1.35, overflowWrap: "anywhere", textDecoration: task.status === "Complete" ? "line-through" : "none" }}>
                {task.isCritical && <span style={{ fontSize: 9, background: T.red, color: "#FFF", borderRadius: 4, padding: "1px 5px", marginRight: 6, fontWeight: 700, verticalAlign: "middle" }}>CRITICAL</span>}
                {task.task}
              </div>
            </div>
          </div>

          {/* Badges row */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", paddingLeft: 28 }}>
            <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 99, background: cc.bg || T.bg, color: cc.dot || T.muted, border: `1px solid ${cc.border || T.border}`, fontWeight: 600 }}>{task.category}</span>
            <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 99, background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`, fontWeight: 700 }}>{task.priority}</span>
            {task.assignedTo && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 99, background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>👤 {task.assignedTo}</span>}
            {dueDate && (
              <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 99, background: dueBg, color: dueColor, border: `1px solid ${daysLeft !== null && daysLeft < 0 ? T.redBorder : T.border}`, fontWeight: daysLeft !== null && daysLeft <= 3 ? 700 : 400 }}>
                {daysLeft !== null && daysLeft < 0 ? "⚠ " : "📅 "}
                {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {daysLeft !== null && daysLeft < 0 && <span> ({Math.abs(daysLeft)}d overdue)</span>}
                {daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && <span> ({daysLeft}d left)</span>}
              </span>
            )}
            {/* Progress inline */}
            {total > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 60, height: 4, borderRadius: 99, background: T.border, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? T.green : T.gold, borderRadius: 99, transition: "width .3s" }} />
                </div>
                <span style={{ fontSize: 10, color: pct === 100 ? T.green : T.muted, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600 }}>{done}/{total}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: status selector + actions */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, padding: "12px 14px 12px 0", alignItems: "flex-end" }}>
          <select
            value={task.status}
            onChange={e => onStatusChange(task.id, e.target.value)}
            style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, borderRadius: 20, padding: "4px 10px", fontSize: 11, cursor: "pointer", outline: "none", fontWeight: 700, whiteSpace: "nowrap" }}
          >
            {["Not Started", "In Progress", "Complete", "Overdue"].map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ display: "flex", gap: 2 }}>
            <button onClick={() => onEdit(task)} title="Edit" style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 8px", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center" }}><PenLine size={13} /></button>
            <button onClick={() => onDelete(task)} title="Delete" style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 8, padding: "5px 8px", color: T.red, cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={13} /></button>
          </div>
        </div>
      </div>

      {/* ── Expanded subtask panel ── */}
      {open && (
        <div style={{ background: "#FAFAF8", borderTop: `1px solid ${T.border}`, padding: "14px 18px 16px 36px" }}>
          <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: T.subtle, letterSpacing: .8, marginBottom: 10, fontWeight: 600 }}>SUBTASKS — {done}/{total} COMPLETE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {task.checklist.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 9, background: "#FFF", borderRadius: 10, padding: "8px 10px", border: `1px solid ${item.done ? T.greenBorder : T.border}` }}>
                <button
                  onClick={() => toggleSubtask(item.id)}
                  style={{ width: 18, height: 18, minWidth: 18, border: `2px solid ${item.done ? T.green : T.border}`, borderRadius: 5, background: item.done ? T.greenLight : "#FFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", padding: 0, transition: "all .15s" }}
                >
                  {item.done && <span style={{ color: T.green, fontSize: 11, fontWeight: 700 }}>✓</span>}
                </button>
                <span style={{ flex: 1, fontSize: 12, color: item.done ? T.muted : T.text, textDecoration: item.done ? "line-through" : "none", lineHeight: 1.4 }}>{item.text}</span>
                {item.assignedTo && <span style={{ fontSize: 10, color: T.muted, flexShrink: 0 }}>{item.assignedTo}</span>}
                <button onClick={() => removeSubtask(item.id)} style={{ background: "none", border: "none", padding: "2px 4px", color: T.subtle, cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          {total === 0 && <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>No subtasks yet. Add one below.</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSubtask()}
              placeholder="Add subtask and press Enter..."
              style={{ ...inpStyle, padding: "7px 11px", fontSize: 12, flex: 1, borderRadius: 10 }}
            />
            <Btn onClick={addSubtask} variant="primary" small>+ Add</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

