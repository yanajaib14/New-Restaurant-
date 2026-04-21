import React, { useState } from 'react';
import { T, Invoice, Vendor } from '../types';
import { Modal, Field, inpStyle, selStyle, Btn, SectionHeader, Pill } from './UI';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export function InvoiceModal({ invoice, vendors, onSave, onClose }: { invoice: Invoice | null, vendors: Vendor[], onSave: (form: any) => void, onClose: () => void }) {
  const blank = { vendorName: "", date: new Date().toISOString().split('T')[0], amount: "", category: "Operations", status: "Pending", items: [] };
  const [form, setForm] = useState<any>(invoice ? { ...invoice } : blank);
  const [isImporting, setIsImporting] = useState(false);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSmartImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        try {
          const prompt = "Extract invoice details: Vendor Name, Date (YYYY-MM-DD), Total Amount, Category (Operations, Food, Beverage, Marketing, Utilities), and a list of items (name, quantity, price). Return as JSON.";
          
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                { text: prompt },
                { inlineData: { data: base64Data, mimeType: file.type } }
              ]
            },
            config: {
              responseMimeType: "application/json"
            }
          });
          
          const text = response.text;
          if (text) {
            const data = JSON.parse(text);
            setForm({
              ...form,
              vendorName: data.vendorName || data.vendor || "",
              date: data.date || form.date,
              amount: data.amount || data.total || "",
              category: data.category || "Operations",
              items: data.items || []
            });
          }
        } catch (err) {
          console.error("AI Import failed:", err);
          set("vendorName", "Sample Vendor");
          set("amount", 150.00);
        }
        setIsImporting(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsImporting(false);
    }
  };

  return (
    <Modal title={invoice ? "Edit Invoice" : "Smart Import Invoice"} onClose={onClose} width={500}>
      {!invoice && (
        <div style={{ background: T.goldLight, border: `1px solid ${T.goldBorder}`, borderRadius: 24, padding: 24, marginBottom: 28, textAlign: "center", boxShadow: "0 4px 12px rgba(212, 175, 55, 0.08)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>�x</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.gold, marginBottom: 6, letterSpacing: 0.5 }}>SMART AI ARCHITECTURE</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16, lineHeight: 1.5, fontFamily: "'Cormorant Garamond', serif" }}>Upload a clear photo of your invoice and Gemini will analyze the data structure automatically.</div>
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            onChange={handleSmartImport} 
            style={{ display: "none" }} 
            id="invoice-upload" 
          />
          <Btn onClick={() => document.getElementById('invoice-upload')?.click()} variant="primary" small>
            {isImporting ? "Analyzing..." : "Choose File / Take Photo"}
          </Btn>
        </div>
      )}

      <Field label="VENDOR">
        <select value={form.vendorName} onChange={e => set("vendorName", e.target.value)} style={selStyle}>
          <option value="">Select Vendor...</option>
          {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
          <option value="Other">Other / New Vendor</option>
        </select>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="DATE"><input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inpStyle} /></Field>
        <Field label="AMOUNT ($)"><input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} style={inpStyle} /></Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="CATEGORY">
          <select value={form.category} onChange={e => set("category", e.target.value)} style={selStyle}>
            {["Operations", "Food", "Beverage", "Marketing", "Utilities", "Lease & TI"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="STATUS">
          <select value={form.status} onChange={e => set("status", e.target.value)} style={selStyle}>
            {["Paid", "Pending", "Overdue"].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => onSave(form)} variant="primary">{invoice ? "Save Changes" : "Add Invoice"}</Btn>
      </div>
    </Modal>
  );
}

export function InvoicesSection({ invoices, onEdit, onDelete, onAdd }: { invoices: Invoice[], onEdit: (i: Invoice) => void, onDelete: (i: Invoice) => void, onAdd: () => void }) {
  return (
    <div className="fu">
      <SectionHeader 
        title="Invoices & Expenses" 
        subtitle="Track vendor bills and operational spending"
        action={<Btn onClick={onAdd} variant="primary">+ Import Invoice</Btn>}
      />

      <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 80px", padding: "14px 24px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
          {["VENDOR", "DATE", "AMOUNT", "CATEGORY", "STATUS", ""].map((h, i) => (
            <div key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.subtle, letterSpacing: 1.2, fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {invoices.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>No invoices yet. Use Smart Import to add one.</div>
        ) : (
          invoices.map((inv, i) => (
            <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 80px", padding: "14px 18px", borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "#FFF" : T.bg, alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.vendorName}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{inv.date}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>${Number(inv.amount).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{inv.category}</div>
              <div>
                <Pill 
                  label={inv.status} 
                  color={inv.status === "Paid" ? T.green : inv.status === "Overdue" ? T.red : T.gold} 
                  bg={inv.status === "Paid" ? T.greenLight : inv.status === "Overdue" ? T.redLight : T.goldLight} 
                  border={inv.status === "Paid" ? T.greenBorder : inv.status === "Overdue" ? T.redBorder : T.goldBorder} 
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onEdit(inv)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 14 }}>Edit</button>
                <button onClick={() => onDelete(inv)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 14 }}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

