import React, { useState } from 'react';
import { Eye, EyeOff, PenLine, Trash2, ExternalLink, Link2, Image, Film, Instagram } from 'lucide-react';
import { T, MarketingPost, TrainingModule, DailyChecklist, DigitalAsset } from '../types';
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
                  <button onClick={() => onEdit(p)} title="Edit" style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center" }}><PenLine size={12} /></button>
                  <button onClick={() => onDelete(p.id)} title="Delete" style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center" }}><Trash2 size={12} /></button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 4 }}>{p.platform.toUpperCase()}</div>
                <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 15, fontWeight: 700, color: T.text }}>{p.title}</div>
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
            <Btn onClick={() => onSave({ ...form, _delete: true })} variant="outline" style={{ color: T.red, borderColor: T.redBorder }} title="Delete post"><Trash2 size={13} /></Btn>
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
                  <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 17, fontWeight: 700, color: T.text, marginTop: 8 }}>{m.title}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onEdit(m)} title="Edit" style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center" }}><PenLine size={12} /></button>
                  <button onClick={() => onDelete(m.id)} title="Delete" style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center" }}><Trash2 size={12} /></button>
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
                      {step.done && <span style={{ color: T.green, fontSize: 10 }}>x</span>}
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
            <button onClick={() => setForm((f: any) => ({ ...f, steps: f.steps.filter((x: any) => x.id !== s.id) }))} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 16 }}>x</button>
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
            <Btn onClick={() => onSave({ ...form, _delete: true })} variant="outline" style={{ color: T.red, borderColor: T.redBorder }} title="Delete module"><Trash2 size={13} /></Btn>
          </div>
        )}
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.title.trim()) onSave(form); }} variant="primary">{module ? "Save Changes" : "Create Module"}</Btn>
      </div>
    </Modal>
  );
}

// Inspiration Library (folders + links/photos)
const DROPBOX_PHOTOS_URL = "https://www.dropbox.com/scl/fo/2bqe785ejhqtovanktrb7/AMn-iAg9rAWSmq7yXP7uQyE?rlkey=fm5kpcuktza3p1y2l35kz7huq&st=gjgw1few&dl=0";

const SOCIAL_DOMAINS: Record<string, { label: string; color: string; bg: string }> = {
  "instagram.com": { label: "Instagram", color: "#C13584", bg: "#FDF0F8" },
  "instagr.am": { label: "Instagram", color: "#C13584", bg: "#FDF0F8" },
  "tiktok.com": { label: "TikTok", color: "#010101", bg: "#F5F5F5" },
  "youtube.com": { label: "YouTube", color: "#FF0000", bg: "#FFF5F5" },
  "youtu.be": { label: "YouTube", color: "#FF0000", bg: "#FFF5F5" },
  "pinterest.com": { label: "Pinterest", color: "#E60023", bg: "#FFF0F0" },
  "dropbox.com": { label: "Dropbox", color: "#0061FF", bg: "#EFF6FF" },
};

function detectSocial(url: string) {
  try {
    const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
    for (const [domain, info] of Object.entries(SOCIAL_DOMAINS)) {
      if (hostname.includes(domain)) return info;
    }
  } catch {}
  return null;
}

export function DigitalAssetManager({ assets, onAdd, onEdit, onDelete }: { assets: DigitalAsset[], onAdd: () => void, onEdit: (a: DigitalAsset) => void, onDelete: (id: number) => void }) {
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState("All");

  const ensureUrl = (value: string) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    return raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  };

  const normalizeDropbox = (value: string, mode: "open" | "preview") => {
    try {
      const input = ensureUrl(value);
      if (!input) return "";
      const url = new URL(input);
      if (!url.hostname.includes("dropbox.com")) return input;

      if (mode === "preview") {
        url.searchParams.delete("dl");
        url.searchParams.set("raw", "1");
      } else {
        url.searchParams.delete("raw");
        if (!url.searchParams.has("dl")) {
          url.searchParams.set("dl", "0");
        }
      }

      return url.toString();
    } catch {
      return ensureUrl(value);
    }
  };

  const getOpenUrl = (asset: DigitalAsset) => {
    const base = ensureUrl(asset.url || "");
    if (!base) return "";
    if ((asset.assetType || "Link") === "Photo") {
      return normalizeDropbox(base, "open");
    }
    return base;
  };

  const getPreviewUrl = (asset: DigitalAsset) => {
    const base = ensureUrl(asset.url || "");
    if (!base) return "";
    if ((asset.assetType || "Link") === "Photo") {
      return normalizeDropbox(base, "preview");
    }
    return base;
  };

  const escapeCsv = (value: unknown) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const normalized = assets.map(a => ({
    ...a,
    folder: String(a.folder || "Inbox"),
    assetType: (a.assetType === "Photo" ? "Photo" : "Link") as "Photo" | "Link",
  }));

  const folders = ["All", ...Array.from(new Set(normalized.map(a => a.folder))).sort((a, b) => a.localeCompare(b))];
  const query = search.trim().toLowerCase();
  const filtered = normalized.filter(a => {
    const folderMatch = folderFilter === "All" || a.folder === folderFilter;
    const text = `${a.name} ${a.category} ${a.folder} ${a.tags || ""} ${a.notes || ""} ${a.url || ""}`.toLowerCase();
    const searchMatch = !query || text.includes(query);
    return folderMatch && searchMatch;
  });

  const grouped = filtered.reduce<Record<string, DigitalAsset[]>>((acc, item) => {
    const key = String(item.folder || "Inbox");
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const groupedFolders = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  const exportCurrentView = () => {
    if (filtered.length === 0) {
      alert("No assets to export for this filter.");
      return;
    }

    const header = ["Folder", "Title", "Type", "Category", "URL", "Tags", "Notes"];
    const lines = [header.join(",")];

    filtered.forEach(a => {
      lines.push([
        escapeCsv(a.folder || "Inbox"),
        escapeCsv(a.name),
        escapeCsv(a.assetType || "Link"),
        escapeCsv(a.category || "Inspiration"),
        escapeCsv(a.url || ""),
        escapeCsv(a.tags || ""),
        escapeCsv(a.notes || ""),
      ].join(","));
    });

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const stamp = new Date().toISOString().slice(0, 10);
    const folderName = (folderFilter === "All" ? "all" : folderFilter).replace(/\s+/g, "-").toLowerCase();
    const fileName = `inspiration-${folderName}-${stamp}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fu" style={{ marginTop: 40 }}>
      <SectionHeader title="Inspiration Library" subtitle="Save IG reels, links, and ideas you send each other — all in one place"
        action={<Btn onClick={onAdd} variant="primary">+ Save Link / Idea</Btn>} />

      {/* Dropbox Photos shortcut */}
      <div style={{ background: T.champagne, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Image size={18} color="#FFF" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Shared Photo Album</div>
            <div style={{ fontSize: 12, color: T.subtle }}>All your restaurant photos organized in Dropbox</div>
          </div>
        </div>
        <a
          href={DROPBOX_PHOTOS_URL}
          target="_blank"
          rel="noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#111", color: "#FFF", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 13, textDecoration: "none", cursor: "pointer" }}
        >
          <ExternalLink size={14} />
          Open Dropbox Album
        </a>
      </div>

      <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, marginBottom: 16, display: "grid", gap: 10 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, tags, notes, or URL..."
          style={inpStyle}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {folders.map(f => {
            const active = folderFilter === f;
            return (
              <button
                key={f}
                onClick={() => setFolderFilter(f)}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${active ? T.blueBorder : T.border}`,
                  background: active ? T.blueLight : "#FFF",
                  color: active ? T.blue : T.muted,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "5px 10px",
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, color: T.subtle }}>
            {filtered.length} saved {filtered.length === 1 ? "item" : "items"}{folderFilter !== "All" ? ` in ${folderFilter}` : ""}
          </div>
          <Btn onClick={exportCurrentView} variant="outline" small>Export CSV</Btn>
        </div>
      </div>

      {groupedFolders.length === 0 ? (
        <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 32, textAlign: "center", color: T.muted, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📌</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No saved links yet</div>
          <div>Paste any IG reel, TikTok, YouTube, or website link and save it here so it never gets lost in your chats.</div>
        </div>
      ) : groupedFolders.map(folderName => (
        <div key={folderName} style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: 0.9, color: T.subtle, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
              <span>📁</span> {folderName}
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>{grouped[folderName].length} item{grouped[folderName].length === 1 ? "" : "s"}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {grouped[folderName].map(a => {
              const social = a.url ? detectSocial(a.url) : null;
              const openUrl = getOpenUrl(a);
              return (
                <div key={a.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  {/* Social/platform banner */}
                  {social && (
                    <div style={{ background: social.bg, borderBottom: `1px solid ${T.border}`, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 99, background: social.color }} />
                      <div style={{ fontSize: 10, fontWeight: 700, color: social.color, letterSpacing: 0.5 }}>{social.label}</div>
                    </div>
                  )}
                  {a.assetType === "Photo" && a.url && (
                    <a href={openUrl} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                      <img src={getPreviewUrl(a)} alt={a.name} style={{ width: "100%", height: 180, objectFit: "cover" }} />
                    </a>
                  )}
                  <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3, marginBottom: 5 }}>{a.name}</div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          <Pill label={a.category || "Inspiration"} color={T.blue} bg={T.blueLight} border={T.blueBorder} />
                          {a.assetType === "Photo" && <Pill label="Photo" color={T.green} bg={T.greenLight} border={T.greenBorder} />}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                        <button onClick={() => onEdit(a)} title="Edit" style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center" }}><PenLine size={12} /></button>
                        <button onClick={() => onDelete(a.id)} title="Delete" style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={12} /></button>
                      </div>
                    </div>

                    {a.url && (
                      <a href={openUrl} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.muted, textDecoration: "none", background: T.champagne, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", overflow: "hidden" }}>
                        <ExternalLink size={12} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.url}</span>
                      </a>
                    )}

                    {a.notes && <div style={{ fontSize: 12, color: T.muted, fontStyle: "italic", lineHeight: 1.4 }}>{a.notes}</div>}
                    {a.tags && (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {a.tags.split(",").map(tag => tag.trim()).filter(Boolean).map(tag => (
                          <span key={tag} style={{ fontSize: 10, background: T.champagne, border: `1px solid ${T.border}`, borderRadius: 99, padding: "2px 8px", color: T.subtle }}>#{tag}</span>
                        ))}
                      </div>
                    )}
                    {a.loginInfo && <AssetLogin info={a.loginInfo} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: T.subtle, marginTop: 8 }}>Tip: use folder names like "IG Reels", "Menu Ideas", "Interiors", "Vibe References"</div>
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

export function DigitalAssetModal({ asset, onSave, onClose }: { asset: DigitalAsset | null, onSave: (form: any) => void, onClose: () => void }) {
  const blank: Partial<DigitalAsset> = { name: "", category: "Inspiration", folder: "Inbox", assetType: "Link", url: "", loginInfo: "", notes: "", tags: "" };
  const [form, setForm] = useState<any>(asset ? { ...asset } : blank);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Modal title={asset ? "Edit Asset" : "New Inspiration Asset"} onClose={onClose} width={460}>
      <Field label="TITLE"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Cozy bar moodboard" style={inpStyle} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="FOLDER"><input value={form.folder || ""} onChange={e => set("folder", e.target.value)} placeholder="e.g. Interiors" style={inpStyle} /></Field>
        <Field label="TYPE">
          <select value={form.assetType || "Link"} onChange={e => set("assetType", e.target.value)} style={{ ...inpStyle, height: 42 }}>
            {(["Link", "Photo"] as const).map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="CATEGORY">
        <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inpStyle, height: 42 }}>
          {["Inspiration", "IG Reel", "Instagram", "TikTok", "YouTube", "Social Media", "Branding", "Menu Ideas", "Interiors", "Vibe", "Packaging", "Competitors", "Software", "Other"].map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label={form.assetType === "Photo" ? "PHOTO URL" : "LINK URL"}><input value={form.url} onChange={e => set("url", e.target.value)} placeholder="https://..." style={inpStyle} /></Field>
      {form.assetType === "Photo" && (
        <div style={{ fontSize: 11, color: T.subtle, marginTop: -6, marginBottom: 2 }}>
          Dropbox photo links are auto-converted for in-app preview.
        </div>
      )}
      <Field label="TAGS (OPTIONAL)"><input value={form.tags || ""} onChange={e => set("tags", e.target.value)} placeholder="e.g. moody, warm, greens, wood" style={inpStyle} /></Field>
      <Field label="LOGIN INFO (OPTIONAL)"><textarea value={form.loginInfo || ""} onChange={e => set("loginInfo", e.target.value)} placeholder="Username: admin&#10;Password: ..." style={{ ...inpStyle, height: 76, resize: "none", padding: "10px" }} /></Field>
      <Field label="NOTES (OPTIONAL)"><input value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Why this is useful" style={inpStyle} /></Field>
      
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        {asset && (
          <div style={{ marginRight: "auto" }}>
            <Btn onClick={() => onSave({ ...form, _delete: true })} variant="outline" style={{ color: T.red, borderColor: T.redBorder }} title="Delete asset"><Trash2 size={13} /></Btn>
          </div>
        )}
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (String(form.name || "").trim()) onSave(form); }} variant="primary">{asset ? "Save Changes" : "Add Asset"}</Btn>
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
                <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 16, fontWeight: 700, color: T.text, marginTop: 8 }}>{c.title}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onEdit(c)} title="Edit" style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center" }}><PenLine size={12} /></button>
                <button onClick={() => onDelete(c.id)} title="Delete" style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center" }}><Trash2 size={12} /></button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {c.items.map(item => (
                <div key={item.id} onClick={() => onToggleItem(c.id, item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <div style={{ width: 18, height: 18, border: `2px solid ${item.done ? T.green : T.border}`, borderRadius: 5, background: item.done ? T.greenLight : "#FFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {item.done && <span style={{ color: T.green, fontSize: 11 }}>x</span>}
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
            <button onClick={() => setForm((f: any) => ({ ...f, items: f.items.filter((x: any) => x.id !== i.id) }))} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 16 }}>x</button>
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


