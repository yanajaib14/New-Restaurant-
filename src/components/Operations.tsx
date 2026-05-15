import React, { useState } from 'react';
import { T, Vendor, InventoryItem, Permit, UtilityAccount } from '../types';
import { SectionHeader, Btn, Modal, Field, inpStyle, Pill } from './UI';

// VENDORS
export function VendorManager({ vendors, onAdd, onEdit, onDelete, onView }: { vendors: Vendor[], onAdd: () => void, onEdit: (v: Vendor) => void, onDelete: (id: number) => void, onView: (v: Vendor) => void }) {
  return (
    <div className="fu">
      <SectionHeader title="Vendor Directory" subtitle="Manage your supply chain and delivery schedules"
        action={<Btn onClick={onAdd} variant="primary">+ Add Vendor</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {vendors.map(v => (
          <div key={v.id} onClick={() => onView(v)} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, cursor: "pointer", transition: "box-shadow 0.15s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 4 }}>{v.category.toUpperCase()}</div>
                <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 16, fontWeight: 700, color: T.text }}>{v.name}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); onEdit(v); }} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>Edit</button>
                <button onClick={e => { e.stopPropagation(); onDelete(v.id); }} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>Delete</button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: T.text, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Contact:</span> {v.contact}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Email:</span>
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(v.email || "")}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: T.blue, textDecoration: "underline" }}
                >
                  {v.email}
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Phone:</span>
                <a
                  href={`tel:${String(v.phone || "").replace(/[^\d+]/g, "")}`}
                  style={{ color: T.blue, textDecoration: "underline" }}
                >
                  {v.phone}
                </a>
              </div>
            </div>
            {v.notes && (
              <div style={{ marginTop: 10, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
                {v.notes}
              </div>
            )}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 12 }}>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 6 }}>DELIVERY DAYS</div>
              <div style={{ display: "flex", gap: 4 }}>
                {["M", "T", "W", "Th", "F", "S", "Su"].map(day => {
                  const active = v.deliveryDays.includes(day);
                  return (
                    <div key={day} style={{ width: 24, height: 24, borderRadius: 4, background: active ? T.goldLight : T.bg, border: `1px solid ${active ? T.goldBorder : T.border}`, color: active ? T.gold : T.subtle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600 }}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VendorModal({ vendor, onSave, onClose }: { vendor: Vendor | null, onSave: (form: any) => void, onClose: () => void }) {
  const blank = { name: "", contact: "", email: "", phone: "", category: "Food", deliveryDays: [], notes: "" };
  const [form, setForm] = useState<any>(vendor ? { ...vendor } : blank);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const toggleDay = (day: string) => {
    const days = form.deliveryDays.includes(day) ? form.deliveryDays.filter((d: string) => d !== day) : [...form.deliveryDays, day];
    set("deliveryDays", days);
  };

  return (
    <Modal title={vendor ? "Edit Vendor" : "New Vendor"} onClose={onClose} width={480}>
      <Field label="VENDOR NAME"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Green Valley Farms" style={inpStyle} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="CONTACT PERSON"><input value={form.contact} onChange={e => set("contact", e.target.value)} placeholder="Name" style={inpStyle} /></Field>
        <Field label="CATEGORY"><input value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Produce" style={inpStyle} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="EMAIL"><input value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" style={inpStyle} /></Field>
        <Field label="PHONE"><input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="555-0123" style={inpStyle} /></Field>
      </div>
      <Field label="SHORT NOTE">
        <textarea
          value={form.notes || ""}
          onChange={e => set("notes", e.target.value.slice(0, 180))}
          placeholder="Quick context, terms, or reminders..."
          rows={2}
          style={{ ...inpStyle, resize: "vertical", lineHeight: 1.5 }}
        />
      </Field>
      <Field label="DELIVERY DAYS">
        <div style={{ display: "flex", gap: 8 }}>
          {["M", "T", "W", "Th", "F", "S", "Su"].map(day => {
            const active = form.deliveryDays.includes(day);
            return (
              <button key={day} onClick={() => toggleDay(day)}
                style={{ flex: 1, height: 36, borderRadius: 6, background: active ? T.goldLight : "#FFF", border: `1px solid ${active ? T.goldBorder : T.border}`, color: active ? T.gold : T.muted, cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all .15s" }}>
                {day}
              </button>
            );
          })}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.name.trim()) onSave(form); }} variant="primary">{vendor ? "Save Changes" : "Add Vendor"}</Btn>
      </div>
    </Modal>
  );
}

// All other content continues...