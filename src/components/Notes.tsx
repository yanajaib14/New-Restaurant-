import React, { useRef } from 'react';
import { T, NOTE_TAG_COLORS, Note, Task } from '../types';
import { Modal, Field, inpStyle, Btn, Pill } from './UI';
import { Share2 } from 'lucide-react';

const LINK_PATTERN = /((?:https?:\/\/|www\.)[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

const buildHref = (value: string) => {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

const linkifyText = (text: string) => {
  if (!text) return text;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = LINK_PATTERN.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = start + raw.length;

    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));

    const trailing = (raw.match(/[.,!?;:)\]]+$/) || [""])[0];
    const clean = trailing ? raw.slice(0, raw.length - trailing.length) : raw;

    if (clean) {
      nodes.push(
        <a
          key={`${start}-${clean}`}
          href={buildHref(clean)}
          target="_blank"
          rel="noreferrer"
          style={{ color: T.blue, textDecoration: "underline" }}
          onClick={e => e.stopPropagation()}
        >
          {clean}
        </a>
      );
    }

    if (trailing) nodes.push(trailing);
    lastIndex = end;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length ? nodes : text;
};

const makePreview = (text: string, max = 180) => {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}...`;
};

export function NoteModal({ note, tasks, onSave, onClose }: { note: Note | null, tasks: Task[], onSave: (form: any) => void, onClose: () => void }) {
  const blank = { title: "", body: "", tag: "General", files: [], linkedTaskId: null };
  const [form, setForm] = React.useState<any>(note ? { ...note, files: [...(note.files || [])] } : blank);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const fileRef = useRef<HTMLInputElement>(null);

  const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    try {
      const mapped = await Promise.all(picked.map(async (f: File) => ({
        id: Date.now() + Math.random(),
        name: f.name,
        size: f.size,
        type: f.type,
        // Data URLs persist after reload; blob URLs do not.
        url: await toDataUrl(f),
        isImage: f.type.startsWith("image/"),
      })));
      setForm((frm: any) => ({ ...frm, files: [...frm.files, ...mapped] }));
    } catch (err) {
      console.error("Attachment read error:", err);
      alert("Failed to attach one or more files. Please try again.");
    }
  };

  return (
    <Modal title={note ? "Edit Note" : "New Note"} onClose={onClose} width={560}>
      <Field label="TITLE"><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Note title⬦" style={inpStyle} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0 }}>
        <Field label="TAG">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.keys(NOTE_TAG_COLORS).map(tag => {
              const tc = NOTE_TAG_COLORS[tag];
              const active = form.tag === tag;
              return (
                <button key={tag} onClick={() => set("tag", tag)}
                  style={{ cursor: "pointer", borderRadius: 24, padding: "5px 14px", fontSize: 12, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontWeight: 600, border: `1px solid ${active ? tc.dot : T.border}`, background: active ? tc.bg : "#FFF", color: active ? tc.dot : T.muted, transition: "all .2s" }}>
                  {tag}
                </button>
              );
            })}
          </div>
        </Field>
      </div>
      <Field label="BODY">
        <textarea value={form.body} onChange={e => set("body", e.target.value)} placeholder="Write your note here⬦" rows={4}
          style={{ ...inpStyle, resize: "vertical", lineHeight: 1.6 }} />
      </Field>
      <Field label="LINKED TASK (OPTIONAL)">
        <select value={form.linkedTaskId || ""} onChange={e => set("linkedTaskId", e.target.value ? Number(e.target.value) : null)} style={inpStyle}>
          <option value="">None</option>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.task}</option>)}
        </select>
      </Field>
      <Field label="ATTACHMENTS">
        <div style={{ border: `2px dashed ${T.border}`, borderRadius: 10, padding: "18px 16px", textAlign: "center", cursor: "pointer", background: T.bg }}
          onClick={() => fileRef.current?.click()}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>Attach</div>
          <div style={{ fontSize: 13, color: T.muted, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontWeight: 500 }}>Click to upload or drag & drop</div>
          <div style={{ fontSize: 11, color: T.subtle, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>Photos, PDFs, docs</div>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFiles} style={{ display: "none" }} />
        </div>
        {form.files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {form.files.map((f: any) => (
              <div key={f.id} style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: f.isImage ? "4px" : "6px 10px", overflow: "hidden" }}>
                {f.isImage ? <img src={f.url} alt={f.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} /> : <span style={{ fontSize: 11, fontWeight: 700 }}>FILE</span>}
                {!f.isImage && <span style={{ fontSize: 11, color: T.muted, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>}
                <button onClick={() => setForm((frm: any) => ({ ...frm, files: frm.files.filter((x: any) => x.id !== f.id) }))} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,.45)", border: "none", borderRadius: "50%", width: 16, height: 16, color: "#FFF", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}>x</button>
              </div>
            ))}
          </div>
        )}
      </Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { if (form.title.trim()) onSave(form); }} variant="primary">{note ? "Save Changes" : "Add Note"}</Btn>
      </div>
    </Modal>
  );
}

export function NoteCard({ note, onOpen, onDelete, isDriveConnected, onSaveToDrive, onOpenLinkedTask }: { note: Note, onOpen: (n: Note) => void, onDelete: (id: number) => void, isDriveConnected: boolean, onSaveToDrive: (file: any) => void, onOpenLinkedTask?: (taskId: number) => void, key?: any }) {
  const tc = NOTE_TAG_COLORS[note.tag] || NOTE_TAG_COLORS["General"];
  const preview = makePreview(note.body);
  return (
    <div className="mobile-card" style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
      onClick={() => onOpen(note)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.08)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.03)"; e.currentTarget.style.transform = "translateY(0)"; }}>
      {/* Tag accent bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${tc.dot} 0%, ${tc.dot}55 100%)` }} />
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <Pill label={note.tag} color={tc.text} bg={tc.bg} border={`${tc.dot}33`} size={10} />
          <span style={{ fontSize: 11, color: T.subtle, fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>{note.date}</span>
        </div>
        <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 17, fontWeight: 700, color: T.text, lineHeight: 1.25 }}>{note.title}</div>
        {preview && (
          <div style={{ fontSize: 13, color: T.text, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", lineHeight: 1.65, flex: 1, opacity: 0.72, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden", wordBreak: "break-word" }}>
            {linkifyText(preview)}
          </div>
        )}
        {note.linkedTaskId && (
          <div style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.blue, display: "inline-block", flexShrink: 0 }} />
            Linked Task #{note.linkedTaskId}
            {onOpenLinkedTask && (
              <button onClick={e => { e.stopPropagation(); onOpenLinkedTask(note.linkedTaskId as number); }} style={{ marginLeft: 4, background: T.blueLight, border: `1px solid ${T.blueBorder}`, borderRadius: 8, padding: "2px 8px", fontSize: 10, color: T.blue, cursor: "pointer", fontWeight: 600 }}>Open</button>
            )}
          </div>
        )}
        {note.files && note.files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {note.files.slice(0, 4).map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 5, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: f.isImage ? "2px" : "4px 8px", overflow: "hidden", position: "relative" }}>
                {f.isImage
                  ? <img src={f.url} alt={f.name} style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 6, cursor: "pointer" }} onClick={e => { e.stopPropagation(); window.open(f.url, "_blank"); }} />
                  : <>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>FILE</span>
                    <a href={f.url} download={f.name} style={{ fontSize: 10, color: T.blue, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", textDecoration: "none", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>{f.name}</a>
                  </>
                }
                {isDriveConnected && (
                  <button onClick={e => { e.stopPropagation(); onSaveToDrive(f); }} title="Save to Drive" style={{ background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10, position: "absolute", top: 2, right: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>G</button>
                )}
              </div>
            ))}
            {note.files.length > 4 && <span style={{ fontSize: 11, color: T.muted, padding: "4px 8px", background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>+{note.files.length - 4}</span>}
          </div>
        )}
      </div>
      {/* Action bar */}
      <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${T.border}` }}>
        <button onClick={e => { e.stopPropagation(); onOpen(note); }} style={{ flex: 1, background: "none", border: "none", padding: "12px", color: T.muted, cursor: "pointer", fontSize: 13, fontWeight: 600, borderRight: `1px solid ${T.border}` }}>Open</button>
        <button onClick={e => { e.stopPropagation(); const subject = encodeURIComponent(note.title); const body = encodeURIComponent(note.body + "\n\n---\nSent from Restaurant Launch Planner"); window.location.href = `mailto:?subject=${subject}&body=${body}`; }} style={{ flex: 1, background: "none", border: "none", padding: "12px", color: T.gold, cursor: "pointer", fontSize: 13, fontWeight: 600, borderRight: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Share2 size={12} />Share</button>
        <button onClick={e => { e.stopPropagation(); onDelete(note.id); }} style={{ flex: 1, background: "none", border: "none", padding: "12px", color: T.red, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Delete</button>
      </div>
    </div>
  );
}

export function NoteDetailModal({ note, onClose, onEdit, onDelete, isDriveConnected, onSaveToDrive, onOpenLinkedTask }: { note: Note, onClose: () => void, onEdit: (n: Note) => void, onDelete: (id: number) => void, isDriveConnected: boolean, onSaveToDrive: (file: any) => void, onOpenLinkedTask?: (taskId: number) => void }) {
  const tc = NOTE_TAG_COLORS[note.tag] || NOTE_TAG_COLORS["General"];

  return (
    <Modal title={note.title} onClose={onClose} width={720}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
        <Pill label={note.tag} color={tc.text} bg={tc.bg} border={`${tc.dot}33`} size={10} />
        <span style={{ fontSize: 11, color: T.subtle, fontFamily: "'IBM Plex Mono',monospace" }}>{note.date}</span>
      </div>

      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, fontSize: 14, lineHeight: 1.75, color: T.text, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {linkifyText(note.body || "")}
      </div>

      {note.linkedTaskId && (
        <div style={{ marginTop: 10, fontSize: 12, color: T.muted }}>
          Linked Task: #{note.linkedTaskId}
          {onOpenLinkedTask && <button onClick={() => onOpenLinkedTask(note.linkedTaskId as number)} style={{ marginLeft: 8, background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, color: T.blue, cursor: "pointer" }}>Open Task</button>}
        </div>
      )}

      {note.files && note.files.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>ATTACHMENTS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {note.files.map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 8, padding: f.isImage ? "4px" : "6px 10px", position: "relative" }}>
                {f.isImage
                  ? <img src={f.url} alt={f.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, cursor: "pointer" }} onClick={() => window.open(f.url, "_blank")} />
                  : <>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>FILE</span>
                    <a href={f.url} download={f.name} style={{ fontSize: 11, color: T.blue, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", textDecoration: "none", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</a>
                  </>
                }
                {isDriveConnected && (
                  <button
                    onClick={() => onSaveToDrive(f)}
                    title="Save to Google Drive"
                    style={{ background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10, position: "absolute", top: 2, right: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                  >
                    G
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, flexWrap: "wrap" }}>
        <Btn onClick={() => onEdit(note)} variant="ghost">Edit</Btn>
        <Btn onClick={() => {
          const subject = encodeURIComponent(note.title);
          const body = encodeURIComponent(note.body + "\n\n---\nSent from Restaurant Launch Planner");
          window.location.href = `mailto:?subject=${subject}&body=${body}`;
        }} variant="outline"><Share2 size={14} /> Share</Btn>
        <Btn onClick={() => onDelete(note.id)} variant="danger">Delete</Btn>
      </div>
    </Modal>
  );
}


