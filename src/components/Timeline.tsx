import React from 'react';
import { T, PHASE_COLORS, Milestone } from '../types';
import { SectionHeader, Btn } from './UI';

export function Timeline({ timeline, onToggle, onEdit, onDelete, onAdd }: { timeline: Milestone[], onToggle: (id: number) => void, onEdit: (m: Milestone) => void, onDelete: (m: Milestone) => void, onAdd: () => void }) {
  return (
    <div className="fu">
      <SectionHeader title="Launch Timeline" subtitle="Click a milestone to mark complete"
        action={<Btn onClick={onAdd} variant="primary">+ Add Milestone</Btn>} />
      <div style={{ position: "relative", paddingLeft: 40 }}>
        <div style={{ position: "absolute", left: 15, top: 14, bottom: 14, width: 2, background: `linear-gradient(180deg,${T.gold}44,${T.purple}22)`, borderRadius: 1 }} />
        {timeline.map((item) => {
          const pc = (PHASE_COLORS as any)[item.phase] || T.gold;
          return (
            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", marginBottom: 16, position: "relative" }}>
              <div style={{ position: "absolute", left: -26, width: 14, height: 14, borderRadius: "50%", background: "#FFF", border: `3px solid ${pc}`, marginTop: 5, boxShadow: item.done ? `0 0 0 3px ${pc}22` : "none", cursor: "pointer", transition: "all .2s" }}
                onClick={() => onToggle(item.id)}>
                {item.done && <div style={{ position: "absolute", inset: 1, borderRadius: "50%", background: pc }} />}
              </div>
              <div style={{ background: item.done ? `${pc}0a` : "#FFF", border: `1px solid ${item.done ? pc + "33" : T.border}`, borderRadius: 10, padding: "13px 18px", flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "all .15s" }}
                onClick={() => onToggle(item.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: item.done ? pc : T.text, textDecoration: item.done ? "line-through" : "none", opacity: item.done ? .7 : 1 }}>{item.milestone}</span>
                  <span style={{ fontSize: 10, color: pc, background: `${pc}15`, border: `1px solid ${pc}33`, borderRadius: 4, padding: "1px 7px" }}>{item.phase}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: T.muted }}>{item.date}</span>
                  <button onClick={e => { e.stopPropagation(); onEdit(item); }} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 7px", color: T.muted, cursor: "pointer", fontSize: 11 }}>✎</button>
                  <button onClick={e => { e.stopPropagation(); onDelete(item); }} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "3px 7px", color: T.red, cursor: "pointer", fontSize: 11 }}>✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Phase legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20, padding: "14px 18px", background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 10 }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.muted, marginRight: 4 }}>PHASES:</span>
        {Object.entries(PHASE_COLORS).map(([phase, color]) => (
          <div key={phase} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color as string, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: T.muted }}>{phase}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineModal({ item, onSave, onClose }: { item: Milestone | null, onSave: (form: any) => void, onClose: () => void }) {
  const blank = { milestone: "", date: "", phase: "Pre-Launch", done: false };
  const [form, setForm] = useState<any>(item ? { ...item } : blank);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <Modal title={item ? "Edit Milestone" : "New Milestone"} onClose={onClose} width={420}>
      <Field label="MILESTONE NAME"><input value={form.milestone} onChange={e => set("milestone", e.target.value)} placeholder="e.g. Staff Training Complete" style={inpStyle} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="DATE"><input value={form.date} onChange={e => set("date", e.target.value)} placeholder="e.g. May 18" style={inpStyle} /></Field>
        <Field label="PHASE"><select value={form.phase} onChange={e => set("phase", e.target.value)} style={selStyle}>{Object.keys(PHASE_COLORS).map(p => <option key={p}>{p}</option>)}</select></Field>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.milestone.trim()) onSave(form); }} variant="primary">{item ? "Save Changes" : "Add Milestone"}</Btn>
      </div>
    </Modal>
  );
}

import { useState } from 'react';
import { Modal, Field, inpStyle, selStyle } from './UI';
