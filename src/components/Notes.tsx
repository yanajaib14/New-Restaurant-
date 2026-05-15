import React, { useRef } from 'react';
import { T, NOTE_TAG_COLORS, Note, Task } from '../types';
import { Modal, Field, inpStyle, Btn, Pill } from './UI';
import { Share2, Eye, Trash2, Paperclip, Link2, X, UploadCloud, PenLine, ZoomIn, Copy, Check } from 'lucide-react';

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

const countWords = (text: string) => (text || "").trim().split(/\s+/).filter(Boolean).length;

const formatBytes = (size: number) => {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const MAX_NOTE_FILE_BYTES = 900 * 1024;
const MAX_NOTE_TOTAL_BYTES = 2 * 1024 * 1024;

const resizeImageFile = (file: File, maxWidth = 1600, quality = 0.82) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
      const width = Math.max(1, Math.round(img.width * ratio));
      const height = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error(`Failed to process ${file.name}`));
    img.src = String(reader.result || "");
  };
  reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
  reader.readAsDataURL(file);
});

export function NoteModal({ note, tasks, onSave, onClose }: { note: Note | null, tasks: Task[], onSave: (form: any) => void | Promise<boolean>, onClose: () => void }) {
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
      const mapped = await Promise.all(picked.map(async (f: File) => {
        const isImage = f.type.startsWith("image/");
        const url = isImage ? await resizeImageFile(f) : await toDataUrl(f);
        const estSize = Math.round((url.length * 3) / 4);
        if (estSize > MAX_NOTE_FILE_BYTES) {
          throw new Error(`${f.name} is too large after compression. Please use a smaller image.`);
        }
        return {
          id: Date.now() + Math.random(),
          name: f.name,
          size: estSize,
          type: isImage ? "image/jpeg" : f.type,
          // Data URLs persist after reload; blob URLs do not.
          url,
          isImage,
        };
      }));

      const currentFiles = Array.isArray(form.files) ? form.files : [];
      const nextFiles = [...currentFiles, ...mapped];
      const totalSize = nextFiles.reduce((sum: number, file: any) => sum + Number(file.size || 0), 0);
      if (totalSize > MAX_NOTE_TOTAL_BYTES) {
        throw new Error("Attachments are too large in total. Keep total note attachments under 2MB.");
      }

      setForm((frm: any) => ({ ...frm, files: nextFiles }));
    } catch (err) {
      console.error("Attachment read error:", err);
      alert((err as Error)?.message || "Failed to attach one or more files. Please try again.");
    }
  };

  return (
    <Modal title={note ? "Edit Note" : "Quick Entry"} onClose={onClose} width={640}>
      <Field label="TITLE"><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Note title..." autoFocus style={{ ...inpStyle, border: "none", borderBottom: `1px solid ${T.border}`, borderRadius: 0, paddingLeft: 0, background: "transparent", fontSize: 18, fontWeight: 700 }} /></Field>
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
        <textarea value={form.body} onChange={e => set("body", e.target.value)} placeholder="Write your note here..." rows={8}
          style={{ ...inpStyle, resize: "vertical", lineHeight: 1.7, borderRadius: 18, background: T.bg }} />
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
          <UploadCloud size={24} style={{ margin: "0 auto 8px", color: T.blue }} />
          <div style={{ fontSize: 14, marginBottom: 6, color: T.text, fontWeight: 700 }}>Attach files</div>
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
                <button onClick={() => setForm((frm: any) => ({ ...frm, files: frm.files.filter((x: any) => x.id !== f.id) }))} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,.45)", border: "none", borderRadius: "50%", width: 18, height: 18, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}><X size={11} /></button>
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

export function NoteCard({ note, onOpen, onDelete, isDriveConnected, onSaveToDrive, onOpenLinkedTask, listMode = false }: { note: Note, onOpen: (n: Note) => void, onDelete: (id: number) => void, isDriveConnected: boolean, onSaveToDrive: (file: any) => void, onOpenLinkedTask?: (taskId: number) => void, listMode?: boolean, key?: any }) {
  const tc = NOTE_TAG_COLORS[note.tag] || NOTE_TAG_COLORS["General"];
  const preview = makePreview(note.body);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const wordCount = countWords(note.body);
  return (
    <div className="mobile-card" style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, overflow: "hidden", display: "flex", flexDirection: listMode && !isMobile ? "row" : "column", transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "pointer", boxShadow: "0 10px 30px rgba(23,33,37,0.045)" }}
      onClick={() => onOpen(note)}
      onMouseEnter={e => { if (isMobile) return; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.08)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { if (isMobile) return; e.currentTarget.style.boxShadow = "0 10px 30px rgba(23,33,37,0.045)"; e.currentTarget.style.transform = "translateY(0)"; }}>
      {/* Tag accent bar */}
      <div style={{ width: listMode && !isMobile ? 5 : "auto", height: listMode && !isMobile ? "auto" : 5, background: `linear-gradient(180deg, ${tc.dot} 0%, ${tc.dot}55 100%)`, flexShrink: 0 }} />
      <div style={{ padding: listMode && !isMobile ? "18px 20px" : "18px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <Pill label={note.tag} color={tc.text} bg={tc.bg} border={`${tc.dot}33`} size={10} />
          <span style={{ fontSize: 11, color: T.subtle, fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>{note.date}</span>
        </div>
        <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: listMode && !isMobile ? 19 : 17, fontWeight: 800, color: T.text, lineHeight: 1.25 }}>{note.title}</div>
        {preview && (
          <div style={{ fontSize: 13, color: T.text, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", lineHeight: 1.65, flex: 1, opacity: 0.72, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden", wordBreak: "break-word" }}>
            {linkifyText(preview)}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {wordCount > 0 && <span style={{ fontSize: 10, color: T.subtle, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, textTransform: "uppercase" }}>{wordCount} words</span>}
          {(note.files || []).length > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: T.subtle, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, textTransform: "uppercase" }}><Paperclip size={12} />{note.files.length}</span>}
        </div>
        {note.linkedTaskId && (
          <div style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 6 }}>
            <Link2 size={12} color={T.blue} />
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
      <div style={{ display: "flex", flexDirection: listMode && !isMobile ? "column" : "row", gap: 0, borderTop: listMode && !isMobile ? "none" : `1px solid ${T.border}`, borderLeft: listMode && !isMobile ? `1px solid ${T.border}` : "none", minWidth: listMode && !isMobile ? 148 : undefined }}>
        <button onClick={e => { e.stopPropagation(); onOpen(note); }} style={{ flex: 1, background: "none", border: "none", padding: isMobile ? "14px 10px" : "12px", color: T.muted, cursor: "pointer", fontSize: 13, fontWeight: 600, borderRight: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Eye size={14} />{!isMobile && "Open"}</button>
        <button onClick={e => { e.stopPropagation(); const subject = encodeURIComponent(note.title); const body = encodeURIComponent(note.body + "\n\n---\nSent from Restaurant Launch Planner"); window.location.href = `mailto:?subject=${subject}&body=${body}`; }} style={{ flex: 1, background: "none", border: "none", padding: isMobile ? "14px 10px" : "12px", color: T.gold, cursor: "pointer", fontSize: 13, fontWeight: 600, borderRight: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Share2 size={14} />{!isMobile && "Share"}</button>
        <button onClick={e => { e.stopPropagation(); onDelete(note.id); }} style={{ flex: 1, background: "none", border: "none", padding: isMobile ? "14px 10px" : "12px", color: T.red, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Trash2 size={14} />{!isMobile && "Delete"}</button>
      </div>
    </div>
  );
}

export function NoteDetailModal({ note, tasks, onClose, onSave, onDelete, isDriveConnected, onSaveToDrive, onOpenLinkedTask }: { note: Note, tasks: Task[], onClose: () => void, onSave: (form: any) => Promise<boolean>, onDelete: (id: number) => void, isDriveConnected: boolean, onSaveToDrive: (file: any) => void, onOpenLinkedTask?: (taskId: number) => void }) {
  const [form, setForm] = React.useState<any>({ ...note, files: [...(note.files || [])] });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const currentTagColor = NOTE_TAG_COLORS[form.tag] || NOTE_TAG_COLORS["General"];
  const [editMode, setEditMode] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
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
      const mapped = await Promise.all(picked.map(async (f: File) => {
        const isImage = f.type.startsWith("image/");
        const url = isImage ? await resizeImageFile(f) : await toDataUrl(f);
        const estSize = Math.round((url.length * 3) / 4);
        if (estSize > MAX_NOTE_FILE_BYTES) {
          throw new Error(`${f.name} is too large after compression. Please use a smaller image.`);
        }
        return { id: Date.now() + Math.random(), name: f.name, size: estSize, type: isImage ? "image/jpeg" : f.type, url, isImage };
      }));
      const currentFiles = Array.isArray(form.files) ? form.files : [];
      const nextFiles = [...currentFiles, ...mapped];
      const totalSize = nextFiles.reduce((sum: number, file: any) => sum + Number(file.size || 0), 0);
      if (totalSize > MAX_NOTE_TOTAL_BYTES) {
        throw new Error("Attachments are too large in total. Keep total note attachments under 2MB.");
      }
      setForm((frm: any) => ({ ...frm, files: nextFiles }));
    } catch (err) {
      alert((err as Error)?.message || "Failed to attach one or more files. Please try again.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!String(form.title || "").trim()) return;
    setSaving(true);
    const ok = await onSave(form);
    setSaving(false);
    if (ok) setEditMode(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(form.body || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const imageFiles = (form.files || []).filter((f: any) => f.isImage);
  const docFiles = (form.files || []).filter((f: any) => !f.isImage);

  return (
    <>
      {/* Full-screen image lightbox */}
      {imagePreview && (
        <div
          onClick={() => setImagePreview(null)}
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(10,14,15,0.94)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}
        >
          <img src={imagePreview} alt="Preview" style={{ maxWidth: "92vw", maxHeight: "92vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }} />
          <button
            onClick={() => setImagePreview(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 44, height: 44, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      <Modal title="📝 Note" onClose={onClose} width={960}>
        {/* Tag color accent bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${currentTagColor.dot}, ${currentTagColor.dot}33)`, borderRadius: 4, marginBottom: 22, marginTop: -8 }} />

        {/* Header row: tag pill + metadata + edit toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Pill label={form.tag} color={currentTagColor.text} bg={currentTagColor.bg} border={`${currentTagColor.dot}33`} size={10} />
            <span style={{ fontSize: 11, color: T.subtle, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>{note.date}</span>
            <span style={{ fontSize: 11, color: T.subtle, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>{countWords(form.body)} words</span>
            {(form.files || []).length > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: T.subtle, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>
                <Paperclip size={11} />{form.files.length}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleCopy}
              title="Copy note text"
              style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "6px 12px", fontSize: 12, color: copied ? T.green : T.muted, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all .2s" }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => { setEditMode(v => !v); }}
              style={{ background: editMode ? T.goldLight : T.bg, border: `1px solid ${editMode ? T.goldBorder : T.border}`, borderRadius: 10, padding: "6px 14px", fontSize: 12, color: editMode ? T.gold : T.muted, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, transition: "all .2s" }}
            >
              {editMode ? <Eye size={13} /> : <PenLine size={13} />}
              {editMode ? "Preview" : "Edit"}
            </button>
          </div>
        </div>

        {/* Title */}
        {editMode ? (
          <input
            value={form.title}
            onChange={e => set("title", e.target.value)}
            placeholder="Note title"
            style={{ ...inpStyle, border: "none", borderBottom: `2px solid ${currentTagColor.dot}55`, borderRadius: 0, padding: "0 0 14px", background: "transparent", fontSize: 26, lineHeight: 1.15, fontWeight: 800, marginBottom: 20, width: "100%", outline: "none" }}
          />
        ) : (
          <h2 style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 26, fontWeight: 800, color: T.text, lineHeight: 1.2, margin: "0 0 20px", letterSpacing: -0.4 }}>{form.title}</h2>
        )}

        {/* Tag selector — edit mode only */}
        {editMode && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: 1 }}>TAG</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.keys(NOTE_TAG_COLORS).map(tag => {
                const tc2 = NOTE_TAG_COLORS[tag];
                const active = form.tag === tag;
                return (
                  <button key={tag} onClick={() => set("tag", tag)}
                    style={{ cursor: "pointer", borderRadius: 14, padding: "7px 12px", fontSize: 12, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontWeight: 700, border: `1px solid ${active ? tc2.dot : T.border}`, background: active ? tc2.bg : "#FFF", color: active ? tc2.text : T.muted, transition: "all .15s" }}>
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Body — view: linkified text | edit: textarea */}
        {editMode ? (
          <textarea
            value={form.body || ""}
            onChange={e => set("body", e.target.value)}
            placeholder="Write your whole note here..."
            rows={16}
            style={{ ...inpStyle, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, fontSize: 15, lineHeight: 1.85, resize: "vertical", minHeight: 320, width: "100%", boxSizing: "border-box" }}
          />
        ) : (
          <div style={{ background: T.bg, borderRadius: 16, padding: "18px 20px", fontSize: 15, lineHeight: 1.85, color: T.text, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", minHeight: 80, marginBottom: 4, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
            {(form.body || "").trim() ? (
              (form.body || "").split("\n").map((line: string, i: number, arr: string[]) => (
                <React.Fragment key={i}>
                  {linkifyText(line)}
                  {i < arr.length - 1 && <br />}
                </React.Fragment>
              ))
            ) : (
              <span style={{ color: T.subtle, fontStyle: "italic" }}>No note content. Click Edit to add text.</span>
            )}
          </div>
        )}

        {/* Linked task — edit mode only */}
        {editMode && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: 1 }}>LINKED TASK</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select value={form.linkedTaskId || ""} onChange={e => set("linkedTaskId", e.target.value ? Number(e.target.value) : null)} style={{ ...inpStyle, maxWidth: 420 }}>
                <option value="">None</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.task}</option>)}
              </select>
              {form.linkedTaskId && onOpenLinkedTask && (
                <button onClick={() => onOpenLinkedTask(form.linkedTaskId as number)} style={{ background: T.blueLight, border: `1px solid ${T.blueBorder}`, borderRadius: 10, padding: "9px 12px", fontSize: 12, color: T.blue, cursor: "pointer", fontWeight: 700 }}>Open Task</button>
              )}
            </div>
          </div>
        )}

        {/* Linked task badge — view mode */}
        {!editMode && form.linkedTaskId && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: T.blue, background: T.blueLight, border: `1px solid ${T.blueBorder}`, borderRadius: 10, padding: "5px 12px" }}>
            <Link2 size={12} />Linked Task #{form.linkedTaskId}
            {onOpenLinkedTask && (
              <button onClick={() => onOpenLinkedTask(form.linkedTaskId as number)} style={{ marginLeft: 6, background: "none", border: "none", color: T.blue, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Open →</button>
            )}
          </div>
        )}

        {/* Attachments section */}
        {(imageFiles.length > 0 || docFiles.length > 0 || editMode) && (
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: 1 }}>
              ATTACHMENTS {form.files.length > 0 && `(${form.files.length})`}
            </div>

            {/* Image gallery grid */}
            {imageFiles.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginBottom: docFiles.length > 0 ? 12 : 0 }}>
                {imageFiles.map((f: any) => (
                  <div key={f.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "1", cursor: "zoom-in", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: `1px solid ${T.border}` }}
                    onClick={() => setImagePreview(f.url)}
                    title={f.name}
                  >
                    <img src={f.url} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .2s" }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.28) 0%, transparent 50%)", borderRadius: 12, pointerEvents: "none" }} />
                    <ZoomIn size={14} style={{ position: "absolute", bottom: 6, right: 6, color: "#fff", opacity: 0.85 }} />
                    {editMode && (
                      <button
                        onClick={e => { e.stopPropagation(); setForm((frm: any) => ({ ...frm, files: frm.files.filter((x: any) => x.id !== f.id) })); }}
                        style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 22, height: 22, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    )}
                    {isDriveConnected && !editMode && (
                      <button onClick={e => { e.stopPropagation(); onSaveToDrive(f); }} title="Save to Drive" style={{ position: "absolute", top: 5, left: 5, background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>G</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Doc/file list */}
            {docFiles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: editMode ? 12 : 0 }}>
                {docFiles.map((f: any) => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 12px", position: "relative" }}>
                    <span style={{ fontSize: 18 }}>📄</span>
                    <div>
                      <a href={f.url} download={f.name} style={{ fontSize: 12, color: T.blue, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", textDecoration: "none", fontWeight: 600, display: "block", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</a>
                      <span style={{ fontSize: 10, color: T.subtle, fontFamily: "'IBM Plex Mono',monospace" }}>{formatBytes(f.size)}</span>
                    </div>
                    {editMode && (
                      <button onClick={() => setForm((frm: any) => ({ ...frm, files: frm.files.filter((x: any) => x.id !== f.id) }))} style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: "50%", width: 20, height: 20, color: T.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, marginLeft: 4 }}><X size={11} /></button>
                    )}
                    {isDriveConnected && !editMode && (
                      <button onClick={() => onSaveToDrive(f)} title="Save to Drive" style={{ background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>G</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload zone — edit mode only */}
            {editMode && (
              <div
                style={{ border: `2px dashed ${T.border}`, borderRadius: 12, padding: "16px 14px", textAlign: "center", cursor: "pointer", background: T.bg, transition: "border-color .2s" }}
                onClick={() => fileRef.current?.click()}
                onMouseEnter={e => (e.currentTarget.style.borderColor = currentTagColor.dot)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
              >
                <UploadCloud size={22} style={{ margin: "0 auto 6px", color: T.blue }} />
                <div style={{ fontSize: 13, color: T.text, fontWeight: 700 }}>Add photos, screenshots or files</div>
                <div style={{ fontSize: 11, color: T.subtle, fontFamily: "'IBM Plex Mono',monospace", marginTop: 3 }}>Images, PDFs, docs • max 2MB total</div>
                <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFiles} style={{ display: "none" }} />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24, flexWrap: "wrap", borderTop: `1px solid ${T.border}`, paddingTop: 18 }}>
          {editMode ? (
            <>
              <Btn onClick={() => setEditMode(false)} variant="ghost">Cancel</Btn>
              <Btn onClick={() => onDelete(note.id)} variant="danger"><Trash2 size={13} /> Delete</Btn>
              <Btn onClick={handleSave} variant="primary" disabled={saving}>
                {saving ? "Saving…" : "Save Note"}
              </Btn>
            </>
          ) : (
            <>
              <Btn onClick={onClose} variant="ghost">Close</Btn>
              <Btn onClick={() => {
                const subject = encodeURIComponent(form.title);
                const body = encodeURIComponent((form.body || "") + "\n\n---\nSent from Restaurant Launch Planner");
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
              }} variant="outline"><Share2 size={14} /> Share</Btn>
              <Btn onClick={() => onDelete(note.id)} variant="danger"><Trash2 size={13} /> Delete</Btn>
              <Btn onClick={() => setEditMode(true)} variant="primary"><PenLine size={14} /> Edit Note</Btn>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
