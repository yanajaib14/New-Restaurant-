import React, { useState, useRef } from 'react';
import { T, Invoice, Vendor } from '../types';
import { Modal, Field, inpStyle, selStyle, Btn, SectionHeader, Pill } from './UI';
import { Printer, Download, Upload } from 'lucide-react';

export function InvoiceModal({ invoice, vendors, onSave, onClose }: { invoice: Invoice | null, vendors: Vendor[], onSave: (form: any) => void, onClose: () => void }) {
  const blank = { vendorName: "", paidBy: "", paymentMethod: "Cash", creditCardName: "", checkNumber: "", date: new Date().toISOString().split('T')[0], amount: "", category: "Operations", status: "Pending", items: [] };
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
          
          const response = await fetch('/api/ai/invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data, mimeType: file.type, prompt }),
          });

          if (!response.ok) {
            throw new Error('Invoice AI request failed');
          }

          const payload = await response.json();
          const text = payload.text;
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
          <div style={{ fontSize: 24, marginBottom: 12, fontWeight: 700 }}>AI</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.gold, marginBottom: 6, letterSpacing: 0.5 }}>SMART AI ARCHITECTURE</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16, lineHeight: 1.5, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>Upload a clear photo of your invoice and Gemini will analyze the data structure automatically.</div>
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

      <Field label="PAID BY">
        <input
          value={form.paidBy || ""}
          onChange={e => set("paidBy", e.target.value)}
          placeholder="e.g. Owner, Partner, Manager"
          style={inpStyle}
        />
      </Field>

      <Field label="PAYMENT METHOD">
        <select value={form.paymentMethod || "Cash"} onChange={e => set("paymentMethod", e.target.value)} style={selStyle}>
          {[
            "Cash",
            "Credit Card",
            "Check",
            "Other",
          ].map(m => <option key={m}>{m}</option>)}
        </select>
      </Field>

      {form.paymentMethod === "Credit Card" && (
        <Field label="CREDIT CARD">
          <input
            value={form.creditCardName || ""}
            onChange={e => set("creditCardName", e.target.value)}
            placeholder="e.g. Amex Gold, Chase Ink"
            style={inpStyle}
          />
        </Field>
      )}

      {form.paymentMethod === "Check" && (
        <Field label="CHECK NUMBER">
          <input
            value={form.checkNumber || ""}
            onChange={e => set("checkNumber", e.target.value)}
            placeholder="e.g. 1045"
            style={inpStyle}
          />
        </Field>
      )}

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

export function InvoicesSection({ invoices, onEdit, onDelete, onAdd, onImportCSV }: {
  invoices: Invoice[],
  onEdit: (i: Invoice) => void,
  onDelete: (i: Invoice) => void,
  onAdd: () => void,
  onImportCSV?: (rows: Partial<Invoice>[]) => void,
}) {
  const isMobile = window.innerWidth < 1024;
  const csvRef = useRef<HTMLInputElement>(null);

  const [paidByFilter, setPaidByFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");
  const [cardFilter, setCardFilter] = useState("All");
  const [checkFilter, setCheckFilter] = useState("All");

  const paidByOptions = ["All", ...Array.from(new Set(invoices.map(inv => (inv.paidBy || "Unassigned").trim() || "Unassigned"))).sort((a, b) => a.localeCompare(b))];
  const categoryOptions = ["All", ...Array.from(new Set(invoices.map(inv => inv.category))).sort((a, b) => a.localeCompare(b))];
  const statusOptions = ["All", "Paid", "Pending", "Overdue"];
  const paymentMethodOptions = ["All", ...Array.from(new Set(invoices.map(inv => inv.paymentMethod || "Cash"))).sort((a, b) => a.localeCompare(b))];
  const cardOptions = ["All", ...Array.from(new Set(invoices.map(inv => inv.creditCardName).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b))];
  const checkOptions = ["All", ...Array.from(new Set(invoices.map(inv => inv.checkNumber).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b))];

  const fullyFilteredInvoices = invoices.filter(inv => {
    const paidBy = (inv.paidBy || "Unassigned").trim() || "Unassigned";
    return (paidByFilter === "All" || paidBy === paidByFilter)
      && (categoryFilter === "All" || inv.category === categoryFilter)
      && (statusFilter === "All" || inv.status === statusFilter)
      && (paymentMethodFilter === "All" || (inv.paymentMethod || "Cash") === paymentMethodFilter)
      && (cardFilter === "All" || (inv.creditCardName || "") === cardFilter)
      && (checkFilter === "All" || (inv.checkNumber || "") === checkFilter);
  });

  const totalAmount = fullyFilteredInvoices.reduce((s, inv) => s + Number(inv.amount || 0), 0);

  const downloadTemplate = () => {
    const header = "vendorName,paidBy,paymentMethod,creditCardName,checkNumber,date,amount,category,status";
    const eg = "Sample Vendor,Owner,Credit Card,Amex Gold,,2026-05-01,125.00,Operations,Pending";
    const blob = new Blob([header + "\n" + eg], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "invoice_import_template.csv"; a.click();
  };

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        const rows: Partial<Invoice>[] = lines.slice(1).map(line => {
          const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
          return {
            vendorName: obj.vendorName || "",
            paidBy: obj.paidBy || "",
            paymentMethod: obj.paymentMethod || "Cash",
            creditCardName: obj.creditCardName || "",
            checkNumber: obj.checkNumber || "",
            date: obj.date || new Date().toISOString().split("T")[0],
            amount: parseFloat(obj.amount) || 0,
            category: obj.category || "Operations",
            status: obj.status || "Pending",
          } as Partial<Invoice>;
        }).filter(r => r.vendorName);
        if (rows.length && onImportCSV) onImportCSV(rows);
        else alert("No valid rows found in CSV.");
      } catch { alert("Failed to parse CSV. Please use the template."); }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const printInvoices = () => {
    const rows = fullyFilteredInvoices.map(inv => `
      <tr>
        <td>${inv.vendorName}</td>
        <td>${inv.paidBy || "—"}</td>
        <td>${inv.paymentMethod || "Cash"}</td>
        <td>${inv.paymentMethod === "Credit Card" ? (inv.creditCardName || "—") : inv.paymentMethod === "Check" ? (inv.checkNumber || "—") : "—"}</td>
        <td>${inv.date}</td>
        <td style="text-align:right;font-weight:700">$${Number(inv.amount).toLocaleString()}</td>
        <td>${inv.status}</td>
      </tr>`).join("");
    const html = `<html><head><title>Invoices & Expenses</title><style>
      body{font-family:sans-serif;font-size:11px;color:#172125}
      table{width:100%;border-collapse:collapse}
      th{background:#F5F2EE;text-align:left;padding:8px 10px;font-size:9px;letter-spacing:1px;border-bottom:2px solid #E8E0D6}
      td{padding:8px 10px;border-bottom:1px solid #EAE6E0;vertical-align:middle}
      tr:nth-child(even) td{background:#FAFAF8}
      h2{font-size:16px;margin:0 0 4px}p{margin:0 0 16px;color:#8B9298;font-size:11px}
      .total{text-align:right;margin-top:12px;font-weight:700;font-size:13px}
    </style></head><body>
      <h2>Invoices &amp; Expenses</h2>
      <p>Printed ${new Date().toLocaleDateString()} · ${fullyFilteredInvoices.length} records</p>
      <table><thead><tr>${["VENDOR","PAID BY","METHOD","CARD/CHECK","DATE","AMOUNT","STATUS"].map(h=>`<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="total">Total: $${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
    </body></html>`;
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(html); w.document.close(); w.focus(); w.print();
  };

  const statusColor = (s: string) => s === "Paid" ? T.green : s === "Overdue" ? T.red : T.gold;
  const statusBg = (s: string) => s === "Paid" ? T.greenLight : s === "Overdue" ? T.redLight : T.goldLight;
  const statusBorder = (s: string) => s === "Paid" ? T.greenBorder : s === "Overdue" ? T.redBorder : T.goldBorder;

  return (
    <div className="fu">
      <SectionHeader
        title="Invoices & Expenses"
        subtitle="Track vendor bills and operational spending"
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input ref={csvRef} type="file" accept=".csv" onChange={handleCSVFile} style={{ display: "none" }} />
            {!isMobile && (
              <>
                <Btn onClick={downloadTemplate} variant="ghost" small><Download size={13} style={{ marginRight: 4 }} />Template</Btn>
                <Btn onClick={() => csvRef.current?.click()} variant="outline" small><Upload size={13} style={{ marginRight: 4 }} />Import CSV</Btn>
                <Btn onClick={printInvoices} variant="outline" small><Printer size={13} style={{ marginRight: 4 }} />Print</Btn>
              </>
            )}
            <Btn onClick={onAdd} variant="primary">+ Add Invoice</Btn>
          </div>
        }
      />

      {/* Summary strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { label: "Total", value: `$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: T.text },
          { label: "Paid", value: fullyFilteredInvoices.filter(i => i.status === "Paid").length, color: T.green },
          { label: "Pending", value: fullyFilteredInvoices.filter(i => i.status === "Pending").length, color: T.gold },
          { label: "Overdue", value: fullyFilteredInvoices.filter(i => i.status === "Overdue").length, color: T.red },
        ].map(k => (
          <div key={k.label} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 16px", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>{k.label.toUpperCase()}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: k.color }}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "PAID BY", val: paidByFilter, set: setPaidByFilter, opts: paidByOptions },
          { label: "CATEGORY", val: categoryFilter, set: setCategoryFilter, opts: categoryOptions },
          { label: "STATUS", val: statusFilter, set: setStatusFilter, opts: statusOptions },
          { label: "PAYMENT TYPE", val: paymentMethodFilter, set: setPaymentMethodFilter, opts: paymentMethodOptions },
          { label: "CREDIT CARD", val: cardFilter, set: setCardFilter, opts: cardOptions },
          { label: "CHECK #", val: checkFilter, set: setCheckFilter, opts: checkOptions },
        ].map(({ label, val, set, opts }) => (
          <div key={label}>
            <Field label={label}>
              <select value={val} onChange={e => set(e.target.value)} style={{ ...selStyle, height: 42, fontSize: 13 }}>
                {opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </Field>
          </div>
        ))}
      </div>

      {/* Mobile: action buttons */}
      {isMobile && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Btn onClick={downloadTemplate} variant="ghost" small><Download size={13} style={{ marginRight: 4 }} />Template</Btn>
          <Btn onClick={() => csvRef.current?.click()} variant="outline" small><Upload size={13} style={{ marginRight: 4 }} />Import CSV</Btn>
          <Btn onClick={printInvoices} variant="outline" small><Printer size={13} style={{ marginRight: 4 }} />Print</Btn>
        </div>
      )}

      {/* Mobile card view */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {fullyFilteredInvoices.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13, background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 16 }}>No invoices match your filters.</div>
          ) : fullyFilteredInvoices.map(inv => (
            <div key={inv.id} className="mobile-card" style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px 16px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.vendorName}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{inv.date}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>${Number(inv.amount).toLocaleString()}</div>
                  <Pill label={inv.status} color={statusColor(inv.status)} bg={statusBg(inv.status)} border={statusBorder(inv.status)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <span style={{ fontSize: 11, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", color: T.muted }}>{inv.category}</span>
                <span style={{ fontSize: 11, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", color: T.muted }}>{inv.paymentMethod || "Cash"}</span>
                {inv.paidBy && <span style={{ fontSize: 11, background: T.goldLight, border: `1px solid ${T.goldBorder}`, borderRadius: 8, padding: "4px 10px", color: T.gold, fontWeight: 600 }}>{inv.paidBy}</span>}
                {inv.paymentMethod === "Credit Card" && inv.creditCardName && (
                  <span style={{ fontSize: 11, background: T.blueLight, border: `1px solid ${T.blueBorder}`, borderRadius: 8, padding: "4px 10px", color: T.blue }}>{inv.creditCardName}</span>
                )}
                {inv.paymentMethod === "Check" && inv.checkNumber && (
                  <span style={{ fontSize: 11, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", color: T.muted }}>#{inv.checkNumber}</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                <button onClick={() => onEdit(inv)} style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px", color: T.text, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Edit</button>
                <button onClick={() => onDelete(inv)} style={{ flex: 1, background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 10, padding: "10px", color: T.red, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop table view */
        <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 780 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.9fr 1fr 0.9fr 0.9fr 0.8fr 88px", padding: "12px 20px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                {["VENDOR", "PAID BY", "METHOD", "CARD/CHECK", "DATE", "AMOUNT", "STATUS", ""].map((h, i) => (
                  <div key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: T.subtle, letterSpacing: 1.2, fontWeight: 700 }}>{h}</div>
                ))}
              </div>
              {fullyFilteredInvoices.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>No invoices match your filters.</div>
              ) : (
                fullyFilteredInvoices.map((inv, i) => (
                  <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.9fr 1fr 0.9fr 0.9fr 0.8fr 88px", padding: "13px 20px", borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "#FFF" : T.bg, alignItems: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FFF8F2"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#FFF" : T.bg}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.vendorName}</div>
                    <div style={{ fontSize: 12, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.paidBy || "—"}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{inv.paymentMethod || "Cash"}</div>
                    <div style={{ fontSize: 12, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {inv.paymentMethod === "Credit Card" ? (inv.creditCardName || "—") : inv.paymentMethod === "Check" ? `#${inv.checkNumber || "—"}` : "—"}
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>{inv.date}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: "'IBM Plex Mono',monospace" }}>${Number(inv.amount).toLocaleString()}</div>
                    <div>
                      <Pill label={inv.status} color={statusColor(inv.status)} bg={statusBg(inv.status)} border={statusBorder(inv.status)} />
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => onEdit(inv)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", color: T.muted, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Edit</button>
                      <button onClick={() => onDelete(inv)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 10px", color: T.red, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Del</button>
                    </div>
                  </div>
                ))
              )}
              {/* Total row */}
              {fullyFilteredInvoices.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.9fr 1fr 0.9fr 0.9fr 0.8fr 88px", padding: "12px 20px", background: T.bg, borderTop: `2px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", gridColumn: "1/5" }}>TOTAL ({fullyFilteredInvoices.length} records)</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.text, fontFamily: "'IBM Plex Mono',monospace" }}>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


