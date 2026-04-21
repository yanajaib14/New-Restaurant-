import React, { useState } from 'react';
import { T, CAT_COLORS, STATUS_COLORS, PRIORITY_COLORS, CATEGORIES, Task } from '../types';
import { Modal, Field, inpStyle, selStyle, Btn } from './UI';

export function TaskModal({ task, initialDate, onSave, onClose }: { task: Task | null, initialDate?: string, onSave: (form: any) => void, onClose: () => void }) {
  const isMobile = window.innerWidth < 1024;
  const blank = { task: "", category: "Lease & TI", due: initialDate || "", status: "Not Started", priority: "Medium", checklist: [], assignedTo: "", isCritical: false };
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
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 18, marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: T.muted, letterSpacing: 1.2, fontWeight: 600 }}>SUBTASK CHECKLIST</label>
          {form.checklist.length > 0 && <span style={{ fontSize: 11, color: T.muted }}>{form.checklist.filter((c: any) => c.done).length}/{form.checklist.length} done</span>}
        </div>
        {form.checklist.map((item: any) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <button onClick={() => setForm((f: any) => ({ ...f, checklist: f.checklist.map((c: any) => c.id === item.id ? { ...c, done: !c.done } : c) }))} style={{ width: 18, height: 18, minWidth: 18, border: `2px solid ${item.done ? T.green : T.border}`, borderRadius: 4, background: item.done ? T.greenLight : "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
              {item.done && <span style={{ color: T.green, fontSize: 11 }}>�S</span>}
            </button>
            <input value={item.text} onChange={e => setForm((f: any) => ({ ...f, checklist: f.checklist.map((c: any) => c.id === item.id ? { ...c, text: e.target.value } : c) }))} style={{ ...inpStyle, flex: 2, minWidth: isMobile ? "100%" : undefined, padding: "6px 10px", textDecoration: item.done ? "line-through" : "none", color: item.done ? T.muted : T.text, fontSize: 12 }} />
            <input value={item.assignedTo || ""} onChange={e => setForm((f: any) => ({ ...f, checklist: f.checklist.map((c: any) => c.id === item.id ? { ...c, assignedTo: e.target.value } : c) }))} placeholder="Assign to⬦" style={{ ...inpStyle, flex: 1, minWidth: isMobile ? "calc(100% - 40px)" : undefined, padding: "6px 10px", fontSize: 11, background: "#FFF" }} title="Assigned To" />
            <button onClick={() => setForm((f: any) => ({ ...f, checklist: f.checklist.filter((c: any) => c.id !== item.id) }))} style={{ background: "none", border: "none", color: T.subtle, cursor: "pointer", fontSize: 16, padding: "0 2px" }}>�</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} placeholder="Add subtask⬦" style={{ ...inpStyle, flex: 1, padding: "7px 11px", fontSize: 12 }} />
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

export function TaskRow({ task, onEdit, onDelete, onStatusChange, onToggleCheck }: { task: Task, onEdit: (t: Task) => void, onDelete: (t: Task) => void, onStatusChange: (id: number, s: string) => void, onToggleCheck: (tid: number, cid: number) => void, key?: any }) {
  const [open, setOpen] = useState(false);
  const total = task.checklist.length, done = task.checklist.filter(c => c.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : null;
  const cc = CAT_COLORS[task.category] || {};
  const sc = STATUS_COLORS[task.status];
  const pc = PRIORITY_COLORS[task.priority];

  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 120px 140px 100px 90px 70px", gap: 0, padding: "13px 18px", alignItems: "center", background: "#FFF", transition: "background .1s" }}
        onMouseEnter={e => e.currentTarget.style.background = T.bg}
        onMouseLeave={e => e.currentTarget.style.background = "#FFF"}>
        <button onClick={() => setOpen(x => !x)} style={{ background: "none", border: "none", color: total > 0 ? T.muted : T.border, cursor: total > 0 ? "pointer" : "default", fontSize: 11, padding: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s", display: "flex", alignItems: "center", justifyContent: "center" }}>��</button>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: total > 0 ? 4 : 0 }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: cc.dot, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: T.text, fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>{task.task}</span>
            <span style={{ fontSize: 10, color: cc.dot, background: cc.bg, border: `1px solid ${cc.border}`, borderRadius: 12, padding: "2px 8px", fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>{task.category}</span>
          </div>
          {total > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 16 }}>
              <div style={{ width: 80, height: 2, background: T.border, borderRadius: 1 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? T.green : T.gold, borderRadius: 1, transition: "width .3s" }} />
              </div>
              <span style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>{done}/{total}</span>
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>
          {task.due ? new Date(task.due + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "�"}
        </div>
        <select value={task.status} onChange={e => onStatusChange(task.id, e.target.value)}
          style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, borderRadius: 24, padding: "4px 12px", fontSize: 11, fontFamily: "'Cormorant Garamond', serif", cursor: "pointer", outline: "none", fontWeight: 700 }}>
          {["Not Started", "In Progress", "Complete", "Overdue"].map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ fontSize: 11, color: T.muted, textAlign: "center", fontFamily: "'IBM Plex Mono',monospace" }}>
          {task.assignedTo || "�"}
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 10, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, padding: "3px 10px", borderRadius: 24, background: pc.bg, color: pc.text, border: `1px solid ${pc.border}` }}>{task.priority.toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
          <button onClick={() => onEdit(task)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 12 }}>Edit</button>
          <button onClick={() => onDelete(task)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 12 }}>Delete</button>
        </div>
      </div>
      {open && total > 0 && (
        <div style={{ background: T.bg, borderTop: `1px solid ${T.border}`, padding: "12px 18px 14px 54px" }}>
          <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: T.subtle, letterSpacing: .8, marginBottom: 10 }}>SUBTASKS � {done}/{total} COMPLETE</div>
          {task.checklist.map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8, cursor: "pointer" }} onClick={() => onToggleCheck(task.id, item.id)}>
              <div style={{ width: 15, height: 15, minWidth: 15, border: `2px solid ${item.done ? T.green : T.border}`, borderRadius: 3, background: item.done ? T.greenLight : "#FFF", display: "flex", alignItems: "center", justifyItems: "center", flexShrink: 0, transition: "all .15s" }}>
                {item.done && <span style={{ color: T.green, fontSize: 10 }}>�S</span>}
              </div>
              <span style={{ fontSize: 12, fontFamily: "'Cormorant Garamond', serif", color: item.done ? T.muted : T.text, textDecoration: item.done ? "line-through" : "none", userSelect: "none" }}>{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

