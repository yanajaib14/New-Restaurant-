import React, { useState } from 'react';
import { T, Vendor, InventoryItem, Permit, UtilityAccount } from '../types';
import { SectionHeader, Btn, Modal, Field, inpStyle, Pill } from './UI';

// ─── VENDORS ───
export function VendorManager({ vendors, onAdd, onEdit, onDelete }: { vendors: Vendor[], onAdd: () => void, onEdit: (v: Vendor) => void, onDelete: (id: number) => void }) {
  return (
    <div className="fu">
      <SectionHeader title="Vendor Directory" subtitle="Manage your supply chain and delivery schedules"
        action={<Btn onClick={onAdd} variant="primary">+ Add Vendor</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {vendors.map(v => (
          <div key={v.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Mono',monospace", marginBottom: 4 }}>{v.category.toUpperCase()}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: T.text }}>{v.name}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onEdit(v)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>✎</button>
                <button onClick={() => onDelete(v.id)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>✕</button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: T.text, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>👤</span> {v.contact}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>📧</span> {v.email}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>📞</span> {v.phone}
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 12 }}>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>DELIVERY DAYS</div>
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

// ─── INVENTORY ───
export function InventoryTracker({ items, onUpdateStock, onAdd, onEdit, onDelete }: { items: InventoryItem[], onUpdateStock: (id: number, val: number) => void, onAdd: () => void, onEdit: (i: InventoryItem) => void, onDelete: (id: number) => void }) {
  return (
    <div className="fu">
      <SectionHeader title="Inventory Par-Levels" subtitle="Monitor stock levels and reorder points"
        action={<Btn onClick={onAdd} variant="primary">+ Add Item</Btn>} />
      <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 180px 100px 120px 80px", padding: "10px 18px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
          {["ITEM", "CATEGORY", "STOCK LEVEL", "PAR", "LAST ORDERED", ""].map(h => (
            <div key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.subtle, letterSpacing: .8 }}>{h}</div>
          ))}
        </div>
        {items.map(item => {
          const isLow = item.currentStock <= item.parLevel;
          const pct = Math.min((item.currentStock / (item.parLevel * 1.5)) * 100, 100);
          return (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 180px 100px 120px 80px", padding: "14px 18px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.name}</div>
                <div style={{ fontSize: 11, color: T.muted }}>Unit: {item.unit}</div>
              </div>
              <div style={{ fontSize: 11, color: T.muted }}>{item.category}</div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "baseline" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isLow ? T.red : T.green }}>{item.currentStock} {item.unit}</span>
                  {isLow && <span style={{ fontSize: 9, color: T.red, fontWeight: 700 }}>LOW STOCK</span>}
                </div>
                <div style={{ height: 4, background: T.border, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: isLow ? T.red : T.green, borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", color: T.text }}>{item.parLevel} {item.unit}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{item.lastOrdered}</div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button onClick={() => onEdit(item)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>✎</button>
                <button onClick={() => onDelete(item.id)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InventoryModal({ item, vendors, onSave, onClose }: { item: InventoryItem | null, vendors: Vendor[], onSave: (form: any) => void, onClose: () => void }) {
  const blank = { 
    name: "", 
    category: "Operating Supplies", 
    department: "Kitchen", 
    procurementStatus: "Not Ordered", 
    vendorId: undefined, 
    price: 0, 
    leadTime: "", 
    currentStock: 0, 
    parLevel: 0, 
    unit: "units", 
    lastOrdered: "" 
  };
  const [form, setForm] = useState<any>(item ? { ...item } : blank);
  const [isFood, setIsFood] = useState(false);

  const set = (k: string, v: any) => {
    setForm((f: any) => {
      const newForm = { ...f, [k]: v };
      
      // Logic: Kitchen + Food -> Operating Supplies, Kitchen + Equipment -> One-Time
      if (k === "department" || k === "isFood") {
        const currentDept = k === "department" ? v : f.department;
        const currentIsFood = k === "isFood" ? v : isFood;
        
        if (currentDept === "Kitchen") {
          newForm.category = currentIsFood ? "Operating Supplies" : "One-Time Deco";
        }
      }
      
      return newForm;
    });
    if (k === "isFood") setIsFood(v);
  };

  return (
    <Modal title={item ? "Edit Item" : "New Inventory Item"} onClose={onClose} width={500}>
      <Field label="ITEM NAME">
        <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Whole Milk" style={inpStyle} />
      </Field>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="DEPARTMENT">
          <select value={form.department} onChange={e => set("department", e.target.value)} style={{ ...inpStyle, height: 42 }}>
            {["Kitchen", "Bar", "FOH"].map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="CATEGORY">
          <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inpStyle, height: 42 }}>
            {["One-Time Deco", "Furniture", "China/Glassware", "Operating Supplies"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" id="isFood" checked={isFood} onChange={e => set("isFood", e.target.checked)} />
        <label htmlFor="isFood" style={{ fontSize: 12, color: T.text, cursor: "pointer" }}>Is this a food/perishable item?</label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="VENDOR">
          <select value={form.vendorId || ""} onChange={e => set("vendorId", Number(e.target.value))} style={{ ...inpStyle, height: 42 }}>
            <option value="">Select Vendor</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
        <Field label="PROCUREMENT STATUS">
          <select value={form.procurementStatus} onChange={e => set("procurementStatus", e.target.value)} style={{ ...inpStyle, height: 42 }}>
            {["Not Ordered", "Ordered", "Arrived"].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="PRICE ($)">
          <input type="number" value={form.price} onChange={e => set("price", +e.target.value)} style={inpStyle} />
        </Field>
        <Field label="LEAD TIME">
          <input value={form.leadTime} onChange={e => set("leadTime", e.target.value)} placeholder="e.g. 3 days" style={inpStyle} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="STOCK"><input type="number" value={form.currentStock} onChange={e => set("currentStock", +e.target.value)} style={inpStyle} /></Field>
        <Field label="PAR"><input type="number" value={form.parLevel} onChange={e => set("parLevel", +e.target.value)} style={inpStyle} /></Field>
        <Field label="UNIT"><input value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="cases" style={inpStyle} /></Field>
      </div>

      <Field label="NOTES">
        <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Additional details..." rows={3} style={{ ...inpStyle, resize: "vertical" }} />
      </Field>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.name.trim()) onSave(form); }} variant="primary">{item ? "Save Changes" : "Add Item"}</Btn>
      </div>
    </Modal>
  );
}

// ─── PERMITS ───
export function PermitTracker({ permits, onAdd, onEdit, onDelete }: { permits: Permit[], onAdd: () => void, onEdit: (p: Permit) => void, onDelete: (id: number) => void }) {
  return (
    <div className="fu">
      <SectionHeader title="Permits & Licenses" subtitle="Track expiry dates and compliance status"
        action={<Btn onClick={onAdd} variant="primary">+ Add Permit</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {permits.map(p => {
          const statusColors: any = {
            "Active": { text: T.green, bg: T.greenLight, border: T.greenBorder },
            "Expiring Soon": { text: T.gold, bg: T.goldLight, border: T.goldBorder },
            "Expired": { text: T.red, bg: T.redLight, border: T.redBorder },
            "Pending": { text: T.blue, bg: T.blueLight, border: T.blueBorder },
          };
          const sc = statusColors[p.status] || statusColors["Pending"];
          return (
            <div key={p.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Pill label={p.status} color={sc.text} bg={sc.bg} border={sc.border} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onEdit(p)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>✎</button>
                  <button onClick={() => onDelete(p.id)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>✕</button>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>Issuer: {p.issuer}</div>
              </div>
              <div style={{ background: T.bg, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Mono',monospace" }}>EXPIRY DATE</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: p.status === "Expired" ? T.red : T.text }}>{p.expiryDate}</div>
              </div>
              {p.fileUrl && (
                <button onClick={() => window.open(p.fileUrl, "_blank")} style={{ width: "100%", background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px", color: T.blue, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  📄 View Document
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PermitModal({ permit, onSave, onClose }: { permit: Permit | null, onSave: (form: any) => void, onClose: () => void }) {
  const blank = { name: "", issuer: "", expiryDate: "", status: "Pending", fileUrl: "" };
  const [form, setForm] = useState<any>(permit ? { ...permit } : blank);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target?.result;
        set("fileUrl", fileData);
      };
      reader.readAsDataURL(file);
    }
  };

  const getFileName = () => {
    if (!form.fileUrl) return null;
    if (form.fileUrl.startsWith("data:")) {
      return "Document uploaded";
    }
    return form.fileUrl.split("/").pop();
  };

  return (
    <Modal title={permit ? "Edit Permit" : "New Permit"} onClose={onClose} width={420}>
      <Field label="PERMIT NAME"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Health Operating Permit" style={inpStyle} /></Field>
      <Field label="ISSUING BODY"><input value={form.issuer} onChange={e => set("issuer", e.target.value)} placeholder="e.g. County Health Dept" style={inpStyle} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="EXPIRY DATE"><input type="date" value={form.expiryDate} onChange={e => set("expiryDate", e.target.value)} style={inpStyle} /></Field>
        <Field label="STATUS">
          <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inpStyle, height: 42 }}>
            {["Active", "Expiring Soon", "Expired", "Pending"].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="DOCUMENT UPLOAD">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx" style={{ flex: 1, ...inpStyle, padding: "8px 12px" }} />
          {form.fileUrl && (
            <button onClick={() => set("fileUrl", "")} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "6px 12px", color: T.red, cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
              Clear
            </button>
          )}
        </div>
        {getFileName() && (
          <div style={{ fontSize: 11, color: T.green, marginTop: 8, fontWeight: 600 }}>
            ✓ {getFileName()}
          </div>
        )}
      </Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.name.trim()) onSave(form); }} variant="primary">{permit ? "Save Changes" : "Add Permit"}</Btn>
      </div>
    </Modal>
  );
}

// ─── UTILITIES ───
export function UtilityTracker({ utilities, onAdd, onEdit, onDelete }: { utilities: UtilityAccount[], onAdd: () => void, onEdit: (u: UtilityAccount) => void, onDelete: (id: number) => void }) {
  const [showLogin, setShowLogin] = useState<Record<number, boolean>>({});

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Optional: add a toast or feedback
  };

  return (
    <div className="fu" style={{ marginTop: 32 }}>
      <SectionHeader title="Utility & Service Accounts" subtitle="Manage recurring service contracts and account details"
        action={<Btn onClick={onAdd} variant="primary">+ Add Account</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {utilities.map(u => (
          <div key={u.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 2 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: T.muted }}>Started: {u.startDate}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onEdit(u)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>✎</button>
                <button onClick={() => onDelete(u.id)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>✕</button>
              </div>
            </div>

            <div style={{ background: T.bg, borderRadius: 8, padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, fontFamily: "'DM Mono',monospace", marginBottom: 2 }}>ACCOUNT NUMBER</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{u.accountNumber}</div>
                </div>
                <button onClick={() => copyToClipboard(u.accountNumber)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 6px", fontSize: 10, color: T.blue, cursor: "pointer" }}>Copy</button>
              </div>
              <div style={{ cursor: "pointer" }} onClick={() => setShowLogin(p => ({ ...p, [u.id]: !p[u.id] }))}>
                <div style={{ fontSize: 9, color: T.muted, fontFamily: "'DM Mono',monospace", marginBottom: 2 }}>LOGIN INFO</div>
                <div style={{ fontSize: 12, color: T.text, fontFamily: "'DM Mono',monospace" }}>
                  {showLogin[u.id] ? u.loginInfo : "••••••••••••"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 9, color: T.muted, fontFamily: "'DM Mono',monospace", marginBottom: 2 }}>MONTHLY COST</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.green }}>${u.monthlyCost.toFixed(2)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {u.fileUrl ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: T.green, fontSize: 11, fontWeight: 600 }}>
                    <span>✓</span>
                    <button onClick={() => window.open(u.fileUrl, "_blank")} style={{ background: "none", border: "none", color: T.blue, cursor: "pointer", fontSize: 11, textDecoration: "underline", padding: 0 }}>View Bill</button>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: T.muted }}>No attachment</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UtilityModal({ account, onSave, onClose }: { account: UtilityAccount | null, onSave: (form: any) => void, onClose: () => void }) {
  const blank = { name: "", accountNumber: "", loginInfo: "", monthlyCost: 0, startDate: "", fileUrl: "" };
  const [form, setForm] = useState<any>(account ? { ...account } : blank);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleMockUpload = () => {
    set("fileUrl", "https://example.com/mock-bill.pdf");
  };

  return (
    <Modal title={account ? "Edit Utility Account" : "New Utility Account"} onClose={onClose} width={420}>
      <Field label="SERVICE NAME"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Pacific Gas & Electric" style={inpStyle} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="ACCOUNT NUMBER"><input value={form.accountNumber} onChange={e => set("accountNumber", e.target.value)} placeholder="000-000-000" style={inpStyle} /></Field>
        <Field label="MONTHLY COST ($)"><input type="number" value={form.monthlyCost} onChange={e => set("monthlyCost", +e.target.value)} style={inpStyle} /></Field>
      </div>
      <Field label="LOGIN INFO"><input value={form.loginInfo} onChange={e => set("loginInfo", e.target.value)} placeholder="User: admin / Pass: ••••" style={inpStyle} /></Field>
      <Field label="SERVICE START DATE"><input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} style={inpStyle} /></Field>
      
      <div style={{ marginTop: 12 }}>
        <button onClick={handleMockUpload} style={{ width: "100%", background: T.bg, border: `1px dashed ${T.borderStrong}`, borderRadius: 8, padding: "12px", color: T.muted, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span>📎</span> {form.fileUrl ? "Document Uploaded" : "Upload Document"}
        </button>
        {form.fileUrl && <div style={{ fontSize: 11, color: T.green, textAlign: "center", marginTop: 6 }}>✓ Mock document stored successfully</div>}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.name.trim()) onSave(form); }} variant="primary">{account ? "Save Changes" : "Add Account"}</Btn>
      </div>
    </Modal>
  );
}
