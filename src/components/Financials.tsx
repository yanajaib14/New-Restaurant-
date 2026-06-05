import React, { useState } from 'react';
import { Modal, Field, inpStyle, Btn } from './UI';

export function FinModal({ item, type, onSave, onClose, userRole }: { item: any, type: "startup" | "operating", onSave: (form: any) => void, onClose: () => void, userRole?: string }) {
  const [form, setForm] = useState<any>(item ? { ...item } : { category: "", budgeted: "", actual: "", monthly: "" });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const isManager = userRole === "Manager";

  if (isManager) return null;

  return (
    <Modal title={item ? "Edit Line Item" : "New Line Item"} onClose={onClose} width={400}>
      <Field label="CATEGORY / LABEL"><input value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Equipment" style={inpStyle} /></Field>
      {type === "startup" ? <>
        <Field label="BUDGETED ($)"><input type="number" value={form.budgeted} onChange={e => set("budgeted", e.target.value)} style={inpStyle} /></Field>
        <Field label="ACTUAL ($)"><input type="number" value={form.actual} onChange={e => set("actual", e.target.value)} style={inpStyle} /></Field>
      </> :
        <Field label="MONTHLY COST ($)"><input type="number" value={form.monthly} onChange={e => set("monthly", e.target.value)} style={inpStyle} /></Field>
      }
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.category.trim()) onSave(form); }} variant="primary">{item ? "Save Changes" : "Add Item"}</Btn>
      </div>
    </Modal>
  );
}
