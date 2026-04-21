import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { T, MarketingPost, TrainingModule, DailyChecklist } from '../types';
import { SectionHeader, Btn, Modal, Field, inpStyle, Pill } from './UI';

// ������ MARKETING ������
export function MarketingCalendar({ posts, onAdd, onEdit, onDelete }: { posts: MarketingPost[], onAdd: () => void, onEdit: (p: MarketingPost) => void, onDelete: (id: number) => void }) {
  return (
    <div className="fu">
      <SectionHeader title="Marketing & Social Rollout" subtitle="Plan your brand hype and social media presence"
        action={<Btn onClick={onAdd} variant="primary">+ New Post</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {posts.map(p => {
          const statusColors: any = {
            "Draft": { text: T.muted, bg: "#F5F5F5", border: T.border },
            "Scheduled": { text: T.blue, bg: T.blueLight, border: T.blueBorder },
            "Posted": { text: T.green, bg: T.greenLight, border: T.greenBorder },
          };
          const sc = statusColors[p.status];
          return (
            <div key={p.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Pill label={p.status} color={sc.text} bg={sc.bg} border={sc.border} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onEdit(p)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>Edit</button>
                  <button onClick={() => onDelete(p.id)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>Delete</button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 4 }}>{p.platform.toUpperCase()}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontWeight: 700, color: T.text }}>{p.title}</div>
              </div>
              <div style={{ fontSize: 12, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", marginTop: "auto" }}>
                �x& {p.date}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarketingModal({ post, onSave, onClose }: { post: MarketingPost | null, onSave: (form: any) => void, onClose: () => void }) {
  const blank = { platform: "Instagram", title: "", date: "", status: "Draft", notes: "" };
  const [form, setForm] = useState<any>(post ? { ...post } : blank);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Modal title={post ? "Edit Post" : "New Marketing Post"} onClose={onClose} width={420}>
      <Field label="TITLE / CONTENT"><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Grand Opening Teaser" style={inpStyle} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="PLATFORM"><input value={form.platform} onChange={e => set("platform", e.target.value)} placeholder="e.g. Instagram" style={inpStyle} /></Field>
        <Field label="STATUS">
          <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inpStyle, height: 42 }}>
            {["Draft", "Scheduled", "Posted"].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="POST DATE"><input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inpStyle} /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        {post && (
          <div style={{ marginRight: "auto" }}>
            <Btn onClick={() => onSave({ ...form, _delete: true })} variant="outline" style={{ color: T.red, borderColor: T.redBorder }}>Delete Post</Btn>
          </div>
        )}
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.title.trim()) onSave(form); }} variant="primary">{post ? "Save Changes" : "Add Post"}</Btn>
      </div>
    </Modal>
  );
}

// ������ TRAINING ������
export function TrainingPortal({ modules, onToggleStep, onAdd, onEdit, onDelete }: { modules: TrainingModule[], onToggleStep: (mid: number, sid: number) => void, onAdd: () => void, onEdit: (m: TrainingModule) => void, onDelete: (id: number) => void }) {
  return (
    <div className="fu">
      <SectionHeader title="Employee Training Portal" subtitle="Standardize your service and track team progress"
        action={<Btn onClick={onAdd} variant="primary">+ New Module</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {modules.map(m => {
          const done = m.steps.filter(s => s.done).length;
          const total = m.steps.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div key={m.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <Pill label={m.category} color={T.purple} bg={T.purpleLight} border={T.purpleBorder} />
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 700, color: T.text, marginTop: 8 }}>{m.title}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onEdit(m)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>Edit</button>
                  <button onClick={() => onDelete(m.id)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>Delete</button>
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>PROGRESS</span>
                  <span style={{ fontSize: 11, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>{done}/{total} STEPS</span>
                </div>
                <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: T.purple, borderRadius: 3, transition: "width .5s" }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {m.steps.map(step => (
                  <div key={step.id} onClick={() => onToggleStep(m.id, step.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "4px 0" }}>
                    <div style={{ width: 16, height: 16, border: `2px solid ${step.done ? T.green : T.border}`, borderRadius: 4, background: step.done ? T.greenLight : "#FFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {step.done && <span style={{ color: T.green, fontSize: 10 }}>�S</span>}
                    </div>
                    <span style={{ fontSize: 12, color: step.done ? T.muted : T.text, textDecoration: step.done ? "line-through" : "none" }}>{step.text}</span>
                  </div>
                ))}
              </div>
              {m.videoUrl && (
                <button onClick={() => window.open(m.videoUrl, "_blank")} style={{ width: "100%", marginTop: 20, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px", color: T.text, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Watch Training Video
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrainingModal({ module, onSave, onClose }: { module: TrainingModule | null, onSave: (form: any) => void, onClose: () => void }) {
  const blank = { title: "", category: "General", steps: [], videoUrl: "" };
  const [form, setForm] = useState<any>(module ? { ...module } : blank);
  const [newStep, setNewStep] = useState("");
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const addStep = () => { if (!newStep.trim()) return; setForm((f: any) => ({ ...f, steps: [...f.steps, { id: Date.now(), text: newStep.trim(), done: false }] })); setNewStep(""); };

  return (
    <Modal title={module ? "Edit Module" : "New Training Module"} onClose={onClose} width={480}>
      <Field label="MODULE TITLE"><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Espresso Machine Basics" style={inpStyle} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="CATEGORY">
          <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inpStyle, height: 42 }}>
            {["General", "FOH", "BOH"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="VIDEO URL (OPTIONAL)"><input value={form.videoUrl} onChange={e => set("videoUrl", e.target.value)} placeholder="https://..." style={inpStyle} /></Field>
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 18, marginTop: 4 }}>
        <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: T.muted, letterSpacing: .8, display: "block", marginBottom: 12 }}>TRAINING STEPS</label>
        {form.steps.map((s: any) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <input value={s.text} onChange={e => setForm((f: any) => ({ ...f, steps: f.steps.map((x: any) => x.id === s.id ? { ...x, text: e.target.value } : x) }))} style={{ ...inpStyle, flex: 1, padding: "7px 11px", fontSize: 12 }} />
            <button onClick={() => setForm((f: any) => ({ ...f, steps: f.steps.filter((x: any) => x.id !== s.id) }))} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 16 }}>�</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input value={newStep} onChange={e => setNewStep(e.target.value)} onKeyDown={e => e.key === "Enter" && addStep()} placeholder="Add step..." style={{ ...inpStyle, flex: 1, padding: "7px 11px", fontSize: 12 }} />
          <Btn onClick={addStep} variant="outline" small>+ Add</Btn>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        {module && (
          <div style={{ marginRight: "auto" }}>
            <Btn onClick={() => onSave({ ...form, _delete: true })} variant="outline" style={{ color: T.red, borderColor: T.redBorder }}>Delete Module</Btn>
          </div>
        )}
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.title.trim()) onSave(form); }} variant="primary">{module ? "Save Changes" : "Create Module"}</Btn>
      </div>
    </Modal>
  );
}

// ������ DIGITAL ASSETS & ACCOUNTS ������
export function DigitalAssetManager({ assets, onAdd, onEdit, onDelete }: { assets: any[], onAdd: () => void, onEdit: (a: any) => void, onDelete: (id: number) => void }) {
  return (
    <div className="fu" style={{ marginTop: 40 }}>
      <SectionHeader title="Digital Assets & Accounts" subtitle="Centralized access for social media, software, and IT accounts"
        action={<Btn onClick={onAdd} variant="primary">+ New Account</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {assets.map(a => (
          <div key={a.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Pill label={a.category} color={T.blue} bg={T.blueLight} border={T.blueBorder} />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onEdit(a)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>Edit</button>
                <button onClick={() => onDelete(a.id)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>Delete</button>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 700, color: T.text }}>{a.name}</div>
              {a.url && (
                <a href={a.url.startsWith('http') ? a.url : `https://${a.url}`} target="_blank" rel="noreferrer" 
                   style={{ fontSize: 11, color: T.gold, textDecoration: "none", display: "block", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  �x {a.url}
                </a>
              )}
            </div>
            {a.loginInfo && (
              <AssetLogin info={a.loginInfo} />
            )}
            {a.notes && <div style={{ fontSize: 11, color: T.muted, fontStyle: "italic" }}>{a.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetLogin({ info }: { info: string }) {
  const [show, setShow] = useState(false);
  const masked = info.split('\n').map(line => {
    if (line.toLowerCase().includes('pass')) {
      const parts = line.split(':');
      if (parts.length > 1) {
        return `${parts[0]}: ${'⬢'.repeat(parts[1].trim().length || 8)}`;
      }
    }
    return line;
  }).join('\n');

  return (
    <div style={{ background: T.bg, padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, position: "relative" }}>
      <div style={{ fontSize: 9, color: T.subtle, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 4 }}>LOGIN INFO</div>
      <div style={{ fontSize: 12, color: T.text, whiteSpace: "pre-wrap", paddingRight: 30 }}>{show ? info : masked}</div>
      <button 
        onClick={() => setShow(!show)} 
        style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 4 }}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

export function DigitalAssetModal({ asset, onSave, onClose }: { asset: any | null, onSave: (form: any) => void, onClose: () => void }) {
  const blank = { name: "", category: "Social Media", url: "", loginInfo: "", notes: "" };
  const [form, setForm] = useState<any>(asset ? { ...asset } : blank);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Modal title={asset ? "Edit Account" : "New Digital Account"} onClose={onClose} width={440}>
      <Field label="ACCOUNT / SERVICE NAME"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Instagram, Shopify, GoDaddy" style={inpStyle} /></Field>
      <Field label="CATEGORY">
        <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inpStyle, height: 42 }}>
          {["Social Media", "Software", "Hosting", "POS", "IT", "Other"].map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="WEBSITE / LINK"><input value={form.url} onChange={e => set("url", e.target.value)} placeholder="https://..." style={inpStyle} /></Field>
      <Field label="LOGIN INFO (USERNAME/PASS)"><textarea value={form.loginInfo} onChange={e => set("loginInfo", e.target.value)} placeholder="Username: admin&#10;Password: ⬢⬢⬢⬢⬢⬢⬢⬢" style={{ ...inpStyle, height: 80, resize: "none", padding: "10px" }} /></Field>
      <Field label="NOTES"><input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any extra details..." style={inpStyle} /></Field>
      
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        {asset && (
          <div style={{ marginRight: "auto" }}>
            <Btn onClick={() => onSave({ ...form, _delete: true })} variant="outline" style={{ color: T.red, borderColor: T.redBorder }}>Delete Account</Btn>
          </div>
        )}
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.name.trim()) onSave(form); }} variant="primary">{asset ? "Save Changes" : "Add Account"}</Btn>
      </div>
    </Modal>
  );
}

// ������ DAILY CHECKLISTS ������
export function DailyChecklistManager({ checklists, onToggleItem, onAdd, onEdit, onDelete }: { checklists: DailyChecklist[], onToggleItem: (cid: number, iid: number) => void, onAdd: () => void, onEdit: (c: DailyChecklist) => void, onDelete: (id: number) => void }) {
  return (
    <div className="fu">
      <SectionHeader title="Daily Pre-Flight Checklists" subtitle="Operational rigor for AM and PM shifts"
        action={<Btn onClick={onAdd} variant="primary">+ New Checklist</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {checklists.map(c => (
          <div key={c.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <Pill label={c.shift} color={c.shift === "AM" ? T.gold : T.blue} bg={c.shift === "AM" ? T.goldLight : T.blueLight} border={c.shift === "AM" ? T.goldBorder : T.blueBorder} />
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 700, color: T.text, marginTop: 8 }}>{c.title}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onEdit(c)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>Edit</button>
                <button onClick={() => onDelete(c.id)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>Delete</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {c.items.map(item => (
                <div key={item.id} onClick={() => onToggleItem(c.id, item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <div style={{ width: 18, height: 18, border: `2px solid ${item.done ? T.green : T.border}`, borderRadius: 5, background: item.done ? T.greenLight : "#FFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {item.done && <span style={{ color: T.green, fontSize: 11 }}>�S</span>}
                  </div>
                  <span style={{ fontSize: 13, color: item.done ? T.muted : T.text, textDecoration: item.done ? "line-through" : "none", flex: 1 }}>{item.text}</span>
                  {item.assignedTo && <span style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace" }}>@{item.assignedTo}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChecklistModal({ checklist, onSave, onClose }: { checklist: DailyChecklist | null, onSave: (form: any) => void, onClose: () => void }) {
  const blank = { title: "", shift: "AM", assignedTo: "", items: [] };
  const [form, setForm] = useState<any>(checklist ? { ...checklist } : blank);
  const [newItem, setNewItem] = useState("");
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const addItem = () => { if (!newItem.trim()) return; setForm((f: any) => ({ ...f, items: [...f.items, { id: Date.now(), text: newItem.trim(), done: false, assignedTo: "" }] })); setNewItem(""); };

  return (
    <Modal title={checklist ? "Edit Checklist" : "New Daily Checklist"} onClose={onClose} width={420}>
      <Field label="CHECKLIST TITLE"><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Front of House Opening" style={inpStyle} /></Field>
      <Field label="SHIFT">
        <select value={form.shift} onChange={e => set("shift", e.target.value)} style={{ ...inpStyle, height: 42 }}>
          {["AM", "PM"].map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="ASSIGNED TO (OWNER)"><input value={form.assignedTo || ""} onChange={e => set("assignedTo", e.target.value)} placeholder="e.g. Lead Server" style={inpStyle} /></Field>
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 18, marginTop: 4 }}>
        <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: T.muted, letterSpacing: .8, display: "block", marginBottom: 12 }}>CHECKLIST ITEMS</label>
        {form.items.map((i: any) => (
          <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <input value={i.text} onChange={e => setForm((f: any) => ({ ...f, items: f.items.map((x: any) => x.id === i.id ? { ...x, text: e.target.value } : x) }))} style={{ ...inpStyle, flex: 1, padding: "7px 11px", fontSize: 12 }} />
            <input value={i.assignedTo || ""} onChange={e => setForm((f: any) => ({ ...f, items: f.items.map((x: any) => x.id === i.id ? { ...x, assignedTo: e.target.value } : x) }))} placeholder="Assign..." style={{ ...inpStyle, width: 80, padding: "7px 11px", fontSize: 11 }} />
            <button onClick={() => setForm((f: any) => ({ ...f, items: f.items.filter((x: any) => x.id !== i.id) }))} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 16 }}>�</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} placeholder="Add item..." style={{ ...inpStyle, flex: 1, padding: "7px 11px", fontSize: 12 }} />
          <Btn onClick={addItem} variant="outline" small>+ Add</Btn>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.title.trim()) onSave(form); }} variant="primary">{checklist ? "Save Changes" : "Create Checklist"}</Btn>
      </div>
    </Modal>
  );
}

