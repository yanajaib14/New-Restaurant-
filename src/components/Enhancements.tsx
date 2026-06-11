// New launch-hub enhancements: partner accountability, iOS sheets, phase tracker,
// daily debrief, AI copilot panel, voice input, shake-to-undo, presence, photo strip.
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { T, Task, TaskTodoItem, DecisionLog, Permit, DigitalAsset } from "../types";
import { Btn, inpStyle } from "./UI";
import { partnerOf, extractProposedTasks, ParsedQuickTask } from "../lib/nlpParser";
import { Mic, MicOff, X, RefreshCw, Sparkles, Lightbulb, ExternalLink, Image as ImageIcon, ChevronRight, Phone, Mail, Plus } from "lucide-react";

export type PartnerFilter = string; // "All" or an exact assignee value

/* ───────────────────────── Brand logo (hand-drawn house) ───────────────────────── */

const CLOUD_PATH = "M5,12 q-5,0 -3,-5 q-1,-5 5,-4 q2,-4 7,-1 q6,-1 4,5 q3,4 -3,5 q-5,3 -10,0 z";

export function HouseLogo({ size = 40, color = "#111111", strokeWidth = 3.2 }: { size?: number; color?: string; strokeWidth?: number }) {
  // Prefer the real uploaded drawing at /logo.png (drop your file in public/logo.png).
  // Falls back to a faithful vector trace if that file isn't present.
  const [useImg, setUseImg] = useState(true);
  if (useImg) {
    // The original drawing (public/logo.png, 801×1000) has wide white margins —
    // crop tightly to the artwork (measured bbox ~x256–584, y350–742, centered).
    const CROP = { w: 801, h: 1000, x: 188, y: 314, side: 464 };
    const k = size / CROP.side;
    return (
      <span style={{ width: size, height: size, flexShrink: 0, display: "inline-block", overflow: "hidden" }}>
        <img
          src="/logo.png"
          alt="Glai Gung Won"
          onError={() => setUseImg(false)}
          style={{ width: CROP.w * k, height: CROP.h * k, marginLeft: -CROP.x * k, marginTop: -CROP.y * k, maxWidth: "none", display: "block" }}
        />
      </span>
    );
  }
  return (
    <svg
      width={size} height={size} viewBox="0 0 120 120" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Glai Gung Won"
      style={{ flexShrink: 0 }}
    >
      {/* House body */}
      <path d="M33 61 L33 97 L83 97 L83 61" />
      {/* Roof (slight right overhang) */}
      <path d="M27 62 L54 33 L88 62" />
      {/* Chimney */}
      <path d="M74 50 L74 31 L83 31 L83 50" />
      {/* Smoke puffs */}
      <path d={CLOUD_PATH} transform="translate(80 14) scale(0.95)" />
      <path d={CLOUD_PATH} transform="translate(97 5) scale(1.05)" />
      {/* Door — open at the bottom, legs extend from it */}
      <path d="M50 97 L50 79 L64 79 L64 97" />
      {/* Two squiggly legs */}
      <path d="M52 97 q-5 7 -1 12 q3 4 -2 9" />
      <path d="M63 97 q4 7 0 12 q-3 4 2 9" />
    </svg>
  );
}

/* ───────────────────────── AI proposed-task quick-create ───────────────────────── */

export function ProposedTasks({ content, onCreateTask }: { content: string; onCreateTask?: (t: ParsedQuickTask) => void | Promise<unknown> }) {
  const tasks = useMemo(() => (onCreateTask ? extractProposedTasks(content) : []), [content, onCreateTask]);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  if (!onCreateTask || tasks.length === 0) return null;
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
      {tasks.map((t, i) => {
        const key = `${t.assignedTo}:${t.title.toLowerCase()}`;
        const done = added[key];
        return (
          <button
            key={i}
            disabled={done}
            onClick={async () => { setAdded(p => ({ ...p, [key]: true })); await onCreateTask(t); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, textAlign: "left",
              border: `1px solid ${done ? PASTEL.mint.border : T.borderStrong}`,
              background: done ? PASTEL.mint.bg : "#FFF",
              color: done ? PASTEL.mint.text : T.text,
              borderRadius: 9, padding: "7px 11px", fontSize: 12, fontWeight: 700,
              cursor: done ? "default" : "pointer", lineHeight: 1.3,
            }}
          >
            {done ? "✓" : <Plus size={13} />}
            <span>
              {done ? "Added: " : "Add task: "}
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800 }}>[{t.assignedTo}]</span> {t.title}
              {t.due ? ` · ${t.due}` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Tap-to-call / tap-to-email actions ───────────────────────── */

export function ContactActions({ phone, email }: { phone?: string; email?: string }) {
  const tel = String(phone || "").replace(/[^\d+]/g, "");
  const mail = String(email || "").trim();
  if (!tel && !mail) return null;

  const base: React.CSSProperties = {
    flex: 1, minHeight: 42, borderRadius: 10, fontSize: 13, fontWeight: 700,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
    textDecoration: "none", cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      {tel && (
        <a href={`tel:${tel}`} style={{ ...base, background: "#EAF7EF", border: "1px solid #CFEBDC", color: "#2F7D5B" }}>
          <Phone size={15} /> Call
        </a>
      )}
      {mail && (
        <a href={`mailto:${mail}`} style={{ ...base, background: "#EAF3FB", border: "1px solid #D3E4F4", color: "#3C6E9F" }}>
          <Mail size={15} /> Email
        </a>
      )}
    </div>
  );
}

/* ───────────────────────── Soft pastel accent palette ───────────────────────── */

export interface PastelTone { bg: string; border: string; text: string }

export const PASTEL: Record<string, PastelTone> = {
  mint:     { bg: "#EAF7EF", border: "#CFEBDC", text: "#2F7D5B" },
  sky:      { bg: "#EAF3FB", border: "#D3E4F4", text: "#3C6E9F" },
  peach:    { bg: "#FDF1E7", border: "#F5DECB", text: "#B26A3D" },
  lavender: { bg: "#F4EFFA", border: "#E3DAF2", text: "#7B5EA7" },
  lemon:    { bg: "#FBF6E4", border: "#EFE5C5", text: "#94782F" },
  rose:     { bg: "#FBF0F2", border: "#F2D9DF", text: "#A75D72" },
};

export const PASTEL_CYCLE: PastelTone[] = [PASTEL.sky, PASTEL.peach, PASTEL.mint, PASTEL.lavender, PASTEL.lemon, PASTEL.rose];

/* ───────────────────────── Assignee badge + filter pills ───────────────────────── */

function assigneeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

/** Badge showing who a task/todo is assigned to. B/C use the bold black chip; any other name shows its initials. */
export function PartnerBadge({ assignedTo, size = 18 }: { assignedTo?: string | null; size?: number }) {
  const raw = String(assignedTo || "").trim();
  if (!raw) return null;
  const partner = partnerOf(assignedTo);

  if (partner) {
    const dark = partner === "B";
    return (
      <span
        title={`Assigned to ${raw}`}
        style={{
          width: size, height: size, minWidth: size, borderRadius: 6, flexShrink: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.58, fontWeight: 800, fontFamily: "var(--font-mono)",
          background: dark ? "#111111" : "#FFFFFF",
          color: dark ? "#FFFFFF" : "#111111",
          border: `1.5px solid #111111`,
          lineHeight: 1,
        }}
      >
        {partner}
      </span>
    );
  }

  // Any other assignee → soft chip with initials.
  return (
    <span
      title={`Assigned to ${raw}`}
      style={{
        height: size, minWidth: size, borderRadius: 6, flexShrink: 0, padding: "0 4px",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.5, fontWeight: 800, fontFamily: "var(--font-mono)",
        background: PASTEL.lavender.bg, color: PASTEL.lavender.text,
        border: `1.5px solid ${PASTEL.lavender.border}`, lineHeight: 1, letterSpacing: 0.3,
      }}
    >
      {assigneeInitials(raw)}
    </span>
  );
}

export type AssigneeFilter = string; // "All" or an exact assignee value

export function PartnerFilterPills({ value, onChange, options = [], compact }: {
  value: AssigneeFilter; onChange: (v: AssigneeFilter) => void; options?: string[]; compact?: boolean;
}) {
  const pills = ["All", ...options];
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} role="tablist" aria-label="Task assignee filter">
      {pills.map(id => {
        const active = value === id;
        const label = id === "All" ? (compact ? "All" : "All Tasks") : id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            style={{
              cursor: "pointer", borderRadius: 999, padding: compact ? "5px 12px" : "6px 14px", fontSize: 11,
              border: `1px solid ${active ? T.text : T.border}`,
              background: active ? T.text : "#FFF",
              color: active ? "#FFF" : T.muted,
              fontWeight: active ? 700 : 600,
              transition: "all .15s",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** True when an item passes the current assignee filter (exact match on the assignee value). */
export function matchesPartner(filter: AssigneeFilter, assignedTo?: string | null): boolean {
  if (filter === "All") return true;
  return String(assignedTo || "").trim().toLowerCase() === filter.trim().toLowerCase();
}

/* ───────────────────────── iOS-style bottom sheet ───────────────────────── */

export function BottomSheet({ open, onClose, title, children, isMobile, maxWidth = 480 }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; isMobile: boolean; maxWidth?: number;
}) {
  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const dragProps = isMobile ? {
    drag: "y" as const,
    dragConstraints: { top: 0, bottom: 0 },
    dragElastic: { top: 0, bottom: 0.6 },
    onDragEnd: (_: any, info: any) => { if (info.offset.y > 90 || info.velocity.y > 600) onClose(); },
  } : {};

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.42)", zIndex: 990, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}
          className="modal-backdrop-blur"
        >
          <motion.div
            initial={isMobile ? { y: "100%" } : { y: 24, opacity: 0, scale: 0.97 }}
            animate={isMobile ? { y: 0 } : { y: 0, opacity: 1, scale: 1 }}
            exit={isMobile ? { y: "100%" } : { y: 24, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 30, stiffness: 360 }}
            {...dragProps}
            onClick={e => e.stopPropagation()}
            style={{
              background: "#FFF",
              width: isMobile ? "100%" : "min(92vw, " + maxWidth + "px)",
              maxHeight: isMobile ? "86dvh" : "82vh",
              borderRadius: isMobile ? "20px 20px 0 0" : 18,
              boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
              display: "flex", flexDirection: "column",
              paddingBottom: isMobile ? "env(safe-area-inset-bottom, 0px)" : 0,
            }}
          >
            {isMobile && <div style={{ width: 38, height: 5, borderRadius: 99, background: T.borderStrong, margin: "10px auto 0" }} />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 10px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{title}</div>
              <button onClick={onClose} aria-label="Close" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 99, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.muted }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ overflowY: "auto", padding: "4px 18px 20px", WebkitOverflowScrolling: "touch" }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────── Multi-phase progress tracker ───────────────────────── */

export interface LaunchPhase {
  name: string;
  short: string;
  categories: string[];
  done: number;
  total: number;
  pct: number;
}

export const PHASE_DEFS: Array<{ name: string; short: string; categories: string[] }> = [
  { name: "Foundations & Permits", short: "Foundations", categories: ["Permits", "Lease & TI", "Financials"] },
  { name: "Kitchen Setup", short: "Kitchen", categories: ["Menu & Bar", "Operations"] },
  { name: "Staffing & Training", short: "Staffing", categories: ["Staffing"] },
  { name: "Pre-Launch", short: "Pre-Launch", categories: ["Marketing", "IT & Systems"] },
];

export function computePhases(tasks: Task[]): LaunchPhase[] {
  return PHASE_DEFS.map(def => {
    const phaseTasks = tasks.filter(t => def.categories.includes(t.category));
    const done = phaseTasks.filter(t => t.status === "Complete").length;
    const total = phaseTasks.length;
    return { ...def, done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  });
}

export function PhaseTracker({ tasks, isMobile }: { tasks: Task[]; isMobile: boolean }) {
  const phases = useMemo(() => computePhases(tasks), [tasks]);
  const prevPcts = useRef<number[]>(phases.map(p => p.pct));
  const [celebrating, setCelebrating] = useState<number | null>(null);

  useEffect(() => {
    phases.forEach((p, i) => {
      if (p.total > 0 && p.pct === 100 && prevPcts.current[i] < 100) {
        setCelebrating(i);
        setTimeout(() => setCelebrating(c => (c === i ? null : c)), 1600);
      }
    });
    prevPcts.current = phases.map(p => p.pct);
  }, [phases]);

  return (
    <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 16, padding: isMobile ? 12 : 18, marginBottom: isMobile ? 14 : 18 }}>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: isMobile ? 10 : 14 }}>
        LAUNCH PHASES
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
        {phases.map((p, i) => {
          const complete = p.total > 0 && p.pct === 100;
          const tone = [PASTEL.sky, PASTEL.peach, PASTEL.mint, PASTEL.lavender][i] || PASTEL.sky;
          return (
            <div
              key={p.name}
              className={celebrating === i ? "phase-celebrate" : undefined}
              style={{
                border: `1px solid ${tone.border}`,
                background: tone.bg,
                borderRadius: 12, padding: isMobile ? "11px 11px 12px" : "12px 12px 14px", position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 99, fontSize: 10, fontWeight: 800,
                  background: complete ? tone.text : "#FFF", color: complete ? "#FFF" : tone.text,
                  border: `1.5px solid ${complete ? tone.text : tone.border}`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {complete ? "✓" : i + 1}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>{isMobile ? p.short : p.name}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: tone.text, marginBottom: 6 }}>{p.pct}%</div>
              <div style={{ height: 5, borderRadius: 99, background: "#FFFFFF", overflow: "hidden", marginBottom: 5, border: `1px solid ${tone.border}` }}>
                <div style={{ width: `${p.pct}%`, height: "100%", background: tone.text, borderRadius: 99, transition: "width .5s ease" }} />
              </div>
              <div style={{ fontSize: 10, color: T.subtle }}>{p.done}/{p.total} tasks</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Daily Debrief ───────────────────────── */

interface DebriefData {
  tasks: Task[];
  taskTodos: TaskTodoItem[];
  decisionLogs: DecisionLog[];
  permits: Permit[];
  prog: number;
  appTitle: string;
  parseDate: (raw?: string) => Date | null;
}

function buildLocalDebrief(d: DebriefData): { dueNow: Task[]; thisWeek: Task[]; decisions: DecisionLog[]; suggestion: string } {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const open = d.tasks.filter(t => t.status !== "Complete");
  const withDates = open.map(t => ({ t, due: d.parseDate(t.due) }));

  const dueNow = withDates
    .filter(x => (x.due && x.due <= startToday) || x.t.status === "Overdue")
    .sort((a, b) => (a.due?.getTime() || 0) - (b.due?.getTime() || 0))
    .map(x => x.t);

  const weekEnd = new Date(startToday); weekEnd.setDate(weekEnd.getDate() + 7);
  const thisWeek = withDates
    .filter(x => x.due && x.due > startToday && x.due <= weekEnd)
    .sort((a, b) => (a.due as Date).getTime() - (b.due as Date).getTime())
    .map(x => x.t);

  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);
  const decisions = d.decisionLogs
    .filter(dec => {
      const dd = dec.date ? new Date(`${dec.date}T12:00:00`) : null;
      return dd && dd >= threeDaysAgo;
    })
    .slice(0, 3);
  const recentFallback = decisions.length ? decisions : d.decisionLogs.slice().sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 2);

  let suggestion: string;
  if (dueNow.length > 0) {
    suggestion = `Clear "${dueNow[0].task}" first — it's the oldest blocker on the critical path.`;
  } else if (thisWeek.length > 0) {
    suggestion = `Nothing overdue. Get ahead on "${thisWeek[0].task}" (due ${thisWeek[0].due}).`;
  } else {
    suggestion = `You're at ${d.prog}% launch progress with nothing urgent. Good moment to review the next phase's task list.`;
  }

  return { dueNow: dueNow.slice(0, 5), thisWeek: thisWeek.slice(0, 5), decisions: recentFallback, suggestion };
}

export function DebriefModal({ open, onClose, data, isMobile, onViewTask }: {
  open: boolean; onClose: () => void; data: DebriefData; isMobile: boolean; onViewTask: (task: Task) => void;
}) {
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const local = useMemo(() => buildLocalDebrief(data), [data, refreshKey]);

  const fetchAiSuggestion = useCallback(async () => {
    setLoading(true);
    setAiSuggestion(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: "Generate the smart suggestion for today's debrief.",
          systemInstruction: `You write ONE short smart suggestion (max 2 sentences, no greeting, no emojis, action only) for a restaurant launch daily debrief for "${data.appTitle}".
Launch progress: ${data.prog}%.
Due now/overdue: ${local.dueNow.map(t => `${t.task} (${t.category}, due ${t.due || "n/a"})`).join("; ") || "none"}.
Due this week: ${local.thisWeek.map(t => `${t.task} (due ${t.due})`).join("; ") || "none"}.
Recent decisions: ${local.decisions.map(d2 => d2.title).join("; ") || "none"}.
Respond with ONLY the suggestion text.`,
        }),
      });
      clearTimeout(timer);
      if (res.ok) {
        const body = await res.json();
        const text = String(body?.text || "").replace(/\[\[.*?\]\]/g, "").trim();
        if (text) setAiSuggestion(text);
      }
    } catch { /* fall back to local suggestion */ }
    setLoading(false);
  }, [data.appTitle, data.prog, local]);

  useEffect(() => {
    if (open) fetchAiSuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refreshKey]);

  const Section = ({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: 1.1, fontWeight: 700, marginBottom: 7 }}>
        {icon} {label}
      </div>
      {children}
    </div>
  );

  const TaskLine = ({ t }: { t: Task }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${T.border}`, borderRadius: 10, background: T.bg, padding: "8px 10px", marginBottom: 6 }}>
      <PartnerBadge assignedTo={t.assignedTo} size={16} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, lineHeight: 1.35 }}>{t.task}</div>
        <div style={{ fontSize: 10, color: T.subtle }}>{t.category}{t.due ? ` · due ${t.due}` : ""}</div>
      </div>
      <button onClick={() => onViewTask(t)} style={{ background: "#FFF", border: `1px solid ${T.borderStrong}`, borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: T.text, cursor: "pointer", flexShrink: 0 }}>
        View
      </button>
    </div>
  );

  return (
    <BottomSheet open={open} onClose={onClose} title="📋 Daily Debrief" isMobile={isMobile} maxWidth={520}>
      <Section icon="⏰" label="DUE NOW">
        {local.dueNow.length === 0
          ? <div style={{ fontSize: 12, color: T.muted }}>Nothing overdue. You're clear.</div>
          : local.dueNow.map(t => <TaskLine key={`now-${t.id}`} t={t} />)}
      </Section>
      <Section icon="📋" label="THIS WEEK">
        {local.thisWeek.length === 0
          ? <div style={{ fontSize: 12, color: T.muted }}>No deadlines in the next 7 days.</div>
          : local.thisWeek.map(t => <TaskLine key={`wk-${t.id}`} t={t} />)}
      </Section>
      <Section icon="✅" label="RECENT DECISIONS">
        {local.decisions.length === 0
          ? <div style={{ fontSize: 12, color: T.muted }}>No decisions logged recently.</div>
          : local.decisions.map(d2 => (
            <div key={`dec-${d2.id}`} style={{ fontSize: 12, color: T.text, border: `1px solid ${T.border}`, borderRadius: 10, background: T.bg, padding: "8px 10px", marginBottom: 6, lineHeight: 1.4 }}>
              <strong>{d2.title}</strong>{d2.decision ? ` — ${d2.decision}` : ""}
            </div>
          ))}
      </Section>
      <Section icon="💡" label="SMART SUGGESTION">
        <div style={{ fontSize: 13, color: T.text, background: T.champagne, border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: "10px 12px", lineHeight: 1.5, minHeight: 40 }}>
          {loading ? "Thinking..." : (aiSuggestion || local.suggestion)}
        </div>
      </Section>
      <Btn onClick={() => setRefreshKey(k => k + 1)} variant="primary" style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.6 : 1 }}>
        <RefreshCw size={13} style={{ marginRight: 6 }} /> Refresh
      </Btn>
    </BottomSheet>
  );
}

/* ───────────────────────── AI Copilot slide-over panel ───────────────────────── */

export function AiCopilotPanel({ open, onClose, messages, onSend, loading, isMobile, onCreateTask }: {
  open: boolean; onClose: () => void;
  messages: Array<{ role: string; content: string; suggestions?: string[] }>;
  onSend: (msg: string) => void; loading: boolean; isMobile: boolean;
  onCreateTask?: (t: ParsedQuickTask) => void | Promise<unknown>;
}) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };
  const last = messages[messages.length - 1];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.25)", zIndex: 940 }}
          />
          <motion.aside
            initial={isMobile ? { y: "100%" } : { x: "105%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "105%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            style={{
              position: "fixed", zIndex: 950, background: "#FFF", display: "flex", flexDirection: "column",
              ...(isMobile
                ? { left: 0, right: 0, bottom: 0, height: "82dvh", borderRadius: "20px 20px 0 0", boxShadow: "0 -10px 40px rgba(0,0,0,0.2)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }
                : { top: 0, right: 0, bottom: 0, width: 390, borderLeft: `1px solid ${T.border}`, boxShadow: "-12px 0 36px rgba(0,0,0,0.12)" }),
            }}
            aria-label="AI Copilot"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} />
                <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>AI Copilot</span>
              </div>
              <button onClick={onClose} aria-label="Close copilot" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 99, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.muted }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, WebkitOverflowScrolling: "touch" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "85%", padding: "10px 13px", borderRadius: 12, background: msg.role === "user" ? T.text : T.surface, color: msg.role === "user" ? "#FFF" : T.text, border: `1px solid ${msg.role === "user" ? T.text : T.border}`, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && <ProposedTasks content={msg.content} onCreateTask={onCreateTask} />}
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 5, padding: "4px 2px" }}>
                  {[0, .2, .4].map((d, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.subtle, animation: "pulse 1.2s infinite", animationDelay: `${d}s` }} />)}
                </div>
              )}
              <div ref={endRef} />
            </div>
            {!loading && last?.role === "assistant" && (last.suggestions?.length || 0) > 0 && (
              <div style={{ padding: "0 14px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                {last.suggestions!.map(q => (
                  <button key={q} onClick={() => onSend(q)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "5px 11px", color: T.text, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Ask: what's due Friday?"
                style={{ ...inpStyle, flex: 1, background: T.surface, height: 42 }}
              />
              <VoiceMicButton onTranscript={text => setInput(prev => (prev ? prev + " " : "") + text)} />
              <Btn onClick={handleSend} variant="primary" small style={{ opacity: loading ? 0.6 : 1 }}>Send</Btn>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────── Voice-to-task mic button (Web Speech API) ───────────────────────── */

export function VoiceMicButton({ onTranscript, title }: { onTranscript: (text: string) => void; title?: string }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const stop = () => {
    try { recRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
  };

  const start = () => {
    if (!SpeechRec) {
      alert("Voice input isn't supported in this browser. Try Safari (iOS) or Chrome.");
      return;
    }
    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = String(e.results?.[0]?.[0]?.transcript || "").trim();
      if (text) onTranscript(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  useEffect(() => () => stop(), []);

  return (
    <button
      onClick={() => (listening ? stop() : start())}
      title={title || (SpeechRec ? "Speak a task" : "Voice input not supported")}
      aria-label="Voice input"
      style={{
        width: 42, height: 42, minWidth: 42, borderRadius: 10, cursor: "pointer",
        border: `1px solid ${listening ? T.red : T.borderStrong}`,
        background: listening ? T.redLight : "#FFF",
        color: listening ? T.red : T.text,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        animation: listening ? "pulse 1.2s infinite" : "none",
      }}
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  );
}

/* ───────────────────────── Shake-to-undo (mobile) ───────────────────────── */

export interface UndoableAction {
  label: string;
  undo: () => void | Promise<void>;
  at: number;
}

export function ShakeToUndoListener({ enabled, lastAction, onConsume }: {
  enabled: boolean;
  lastAction: UndoableAction | null;
  onConsume: () => void;
}) {
  const [toastVisible, setToastVisible] = useState(false);
  const lastShake = useRef(0);
  const lastAccel = useRef<{ x: number; y: number; z: number } | null>(null);
  const actionRef = useRef(lastAction);
  actionRef.current = lastAction;

  useEffect(() => {
    if (!enabled) return;

    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      const prev = lastAccel.current;
      lastAccel.current = { x: a.x, y: a.y, z: a.z };
      if (!prev) return;
      const delta = Math.abs(a.x - prev.x) + Math.abs(a.y - prev.y) + Math.abs(a.z - prev.z);
      const now = Date.now();
      // Require a real shake, throttle to one trigger per 2.5s, and only when a recent (<60s) action exists.
      if (delta > 30 && now - lastShake.current > 2500) {
        lastShake.current = now;
        const action = actionRef.current;
        if (action && now - action.at < 60000) {
          setToastVisible(true);
          setTimeout(() => setToastVisible(false), 5000);
        }
      }
    };

    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [enabled]);

  if (!toastVisible || !lastAction) return null;

  return (
    <div style={{ position: "fixed", bottom: "calc(86px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)", zIndex: 999, animation: "slideInUp .25s ease-out" }}>
      <div style={{ background: "#111", color: "#FFF", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.3)", maxWidth: "88vw" }}>
        <span style={{ fontSize: 12, lineHeight: 1.4 }}>Undo: {lastAction.label}?</span>
        <button
          onClick={async () => {
            setToastVisible(false);
            await lastAction.undo();
            onConsume();
          }}
          style={{ background: "#FFF", color: "#111", border: "none", borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
        >
          Undo
        </button>
        <button onClick={() => setToastVisible(false)} aria-label="Dismiss" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: 2, display: "flex" }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── Partner presence indicator ───────────────────────── */

export interface PresenceInfo {
  user: string;
  view: string;
  at: number; // epoch ms
}

export function PresenceIndicator({ presence }: { presence: PresenceInfo | null }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  if (!presence || Date.now() - presence.at > 30 * 60 * 1000) return null;
  const mins = Math.max(0, Math.round((Date.now() - presence.at) / 60000));
  const fresh = mins < 3;
  const when = mins === 0 ? "now" : `${mins} min ago`;

  return (
    <div title={`${presence.user} was last active in ${presence.view}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 999, padding: "4px 11px", whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: fresh ? "#1F9D55" : T.subtle, animation: fresh ? "pulse 2s infinite" : "none", flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>
        {presence.user} · {when} · {presence.view}
      </span>
    </div>
  );
}

/* ───────────────────────── Inspiration preview grid + quick add ───────────────────────── */

const parseTags = (tags?: string): string[] =>
  String(tags || "").split(",").map(t => t.trim().replace(/^#/, "").toLowerCase()).filter(Boolean);

export function InspirationPreview({ assets, onOpenGallery, onQuickAdd, isMobile }: {
  assets: DigitalAsset[]; onOpenGallery: () => void; onQuickAdd: () => void; isMobile: boolean;
}) {
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const photos = useMemo(() => assets
    .filter(a => a.assetType === "Photo" || /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(a.url) || a.url.startsWith("data:image"))
    .sort((a, b) => Number(b.id) - Number(a.id)), [assets]);

  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    photos.forEach(p => parseTags(p.tags).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 8);
  }, [photos]);

  const visible = (tagFilter ? photos.filter(p => parseTags(p.tags).includes(tagFilter)) : photos).slice(0, 10);

  return (
    <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 16, padding: isMobile ? 12 : 18, marginBottom: isMobile ? 14 : 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: PASTEL.lemon.text, letterSpacing: 1.2, fontWeight: 600 }}>
          <Lightbulb size={11} style={{ verticalAlign: -1, marginRight: 5 }} />INSPIRATION
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={onQuickAdd} variant="primary" small>+ Add Idea</Btn>
          <Btn onClick={onOpenGallery} variant="outline" small>Open Library</Btn>
        </div>
      </div>
      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {allTags.map(t => {
            const active = tagFilter === t;
            return (
              <button key={t} onClick={() => setTagFilter(active ? null : t)}
                style={{ cursor: "pointer", borderRadius: 999, padding: "4px 11px", fontSize: 11, fontWeight: active ? 700 : 600, border: `1px solid ${active ? T.text : T.border}`, background: active ? T.text : T.surface, color: active ? "#FFF" : T.muted }}>
                #{t}
              </button>
            );
          })}
        </div>
      )}
      {visible.length === 0 ? (
        <div style={{ fontSize: 12, color: T.muted, background: T.bg, border: `1px dashed ${T.borderStrong}`, borderRadius: 10, padding: "18px 12px", textAlign: "center" }}>
          No inspiration photos yet. Tap <strong>+ Add Idea</strong> to drop a screenshot or paste a link.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(5, 1fr)", gap: 8 }}>
          {visible.map(p => (
            <a key={p.id} href={p.url.startsWith("data:") ? undefined : p.url} target="_blank" rel="noreferrer" onClick={e => { if (p.url.startsWith("data:")) { e.preventDefault(); onOpenGallery(); } }}
              style={{ display: "block", aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, background: T.surface, position: "relative" }}>
              <img src={p.url} alt={p.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function InspirationQuickAddSheet({ open, onClose, onSave, isMobile }: {
  open: boolean; onClose: () => void; isMobile: boolean;
  onSave: (payload: { name: string; url: string; sourceUrl?: string; tags: string; assetType: "Photo" | "Link" }) => Promise<void> | void;
}) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const SUGGESTED_TAGS = ["lighting", "cocktails", "seating", "barfinish", "menu", "decor", "plating", "signage"];

  const reset = () => { setName(""); setUrl(""); setTags(""); setPreview(null); setMode("upload"); };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { alert("Please choose an image."); return; }
    if (file.size > 4 * 1024 * 1024) { alert("Image is too large (max 4 MB). Take a screenshot or resize it."); return; }
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
    if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
  };

  const toggleTag = (t: string) => {
    const current = tags.split(",").map(s => s.trim()).filter(Boolean);
    setTags(current.includes(t) ? current.filter(x => x !== t).join(", ") : [...current, t].join(", "));
  };

  const save = async () => {
    const isUpload = mode === "upload";
    const finalUrl = isUpload ? preview : url.trim();
    if (!finalUrl) { alert(isUpload ? "Choose an image first." : "Paste a link first."); return; }
    setSaving(true);
    try {
      const looksLikeImage = !isUpload && /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(finalUrl);
      await onSave({
        name: name.trim() || (isUpload ? "Inspiration photo" : "Inspiration link"),
        url: finalUrl,
        sourceUrl: isUpload ? undefined : url.trim(),
        tags: tags.split(",").map(s => s.trim().replace(/^#/, "")).filter(Boolean).join(","),
        assetType: isUpload || looksLikeImage ? "Photo" : "Link",
      });
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={() => { reset(); onClose(); }} title="💡 Add Inspiration" isMobile={isMobile} maxWidth={460}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {([["upload", "Upload Screenshot"], ["url", "Paste Link"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)}
            style={{ flex: 1, cursor: "pointer", borderRadius: 10, padding: "10px 8px", fontSize: 12, fontWeight: 700, border: `1px solid ${mode === id ? T.text : T.border}`, background: mode === id ? T.text : "#FFF", color: mode === id ? "#FFF" : T.muted }}>
            {label}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div style={{ marginBottom: 12 }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <button onClick={() => fileRef.current?.click()}
            style={{ width: "100%", border: `1.5px dashed ${T.borderStrong}`, borderRadius: 12, background: T.surface, padding: preview ? 8 : "26px 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {preview
              ? <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} />
              : (<><ImageIcon size={22} color={T.subtle} /><span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Tap to choose from camera roll</span></>)}
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Instagram / TikTok / web URL..." style={{ ...inpStyle, width: "100%", height: 44 }} inputMode="url" />
        </div>
      )}

      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (optional) — e.g. Brass bar shelf idea" style={{ ...inpStyle, width: "100%", height: 44, marginBottom: 12 }} />

      <div style={{ marginBottom: 6, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.subtle, letterSpacing: 1, fontWeight: 600 }}>HASHTAGS</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {SUGGESTED_TAGS.map(t => {
          const active = tags.toLowerCase().includes(t);
          return (
            <button key={t} onClick={() => toggleTag(t)}
              style={{ cursor: "pointer", borderRadius: 999, padding: "5px 11px", fontSize: 11, fontWeight: 600, border: `1px solid ${active ? T.text : T.border}`, background: active ? T.text : "#FFF", color: active ? "#FFF" : T.muted }}>
              #{t}
            </button>
          );
        })}
      </div>
      <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Custom tags, comma separated" style={{ ...inpStyle, width: "100%", height: 40, marginBottom: 16, fontSize: 12 }} />

      <Btn onClick={save} variant="primary" style={{ width: "100%", justifyContent: "center", opacity: saving ? 0.6 : 1 }}>
        {saving ? "Saving..." : "Save to Inspiration"}
      </Btn>
    </BottomSheet>
  );
}

/* ───────────────────────── Dropbox photo preview strip ───────────────────────── */

export function PhotoPreviewStrip({ isMobile }: { isMobile: boolean }) {
  const [photos, setPhotos] = useState<Array<{ name: string; url: string }> | null>(null);
  const [modalPhoto, setModalPhoto] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/dropbox/photos");
        if (!res.ok) { if (active) setPhotos([]); return; }
        const body = await res.json();
        if (active) setPhotos(Array.isArray(body?.photos) ? body.photos.slice(0, 10) : []);
      } catch {
        if (active) setPhotos([]);
      }
    };
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => { active = false; clearInterval(t); };
  }, []);

  if (!photos || photos.length === 0) return null; // hidden until Dropbox is configured

  return (
    <>
      <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 14, padding: isMobile ? 12 : 14, marginBottom: 18 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 10 }}>LATEST PHOTOS</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4 }}>
          {photos.map(p => (
            <button key={p.url} onClick={() => setModalPhoto(p)} style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", padding: 0, cursor: "pointer", flexShrink: 0, width: isMobile ? 84 : 110, height: isMobile ? 84 : 110, background: T.surface }}>
              <img src={p.url} alt={p.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>
      </div>
      {modalPhoto && (
        <div onClick={() => setModalPhoto(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 995, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: "92vw", maxHeight: "86vh", display: "flex", flexDirection: "column", gap: 8 }}>
            <img src={modalPhoto.url} alt={modalPhoto.name} style={{ maxWidth: "100%", maxHeight: "78vh", borderRadius: 12, objectFit: "contain" }} />
            <div style={{ color: "#FFF", fontSize: 12, textAlign: "center" }}>{modalPhoto.name}</div>
          </div>
        </div>
      )}
    </>
  );
}

/* ───────────────────────── Actionable blocker card ───────────────────────── */

const ACTION_KEYWORDS = ["agreement", "domain", "contract", "lease", "permit", "license", "deposit", "insurance"];

export function isActionableBlockerText(text: string): boolean {
  const t = text.toLowerCase();
  return ACTION_KEYWORDS.some(k => t.includes(k));
}

export function BlockerCard({ text, task, onView }: { text: string; task: Task | null; onView: (task: Task) => void }) {
  const actionable = task && isActionableBlockerText(text);
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 9, background: T.bg, padding: "8px 10px", fontSize: 12, color: T.text, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 8 }}>
      {task && <PartnerBadge assignedTo={task.assignedTo} size={16} />}
      <span style={{ flex: 1, minWidth: 0 }}>{text}</span>
      {actionable && (
        <button onClick={() => onView(task!)} style={{ background: "#FFF", border: `1px solid ${T.borderStrong}`, borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 800, color: T.text, cursor: "pointer", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3 }}>
          View <ChevronRight size={11} />
        </button>
      )}
    </div>
  );
}

/* ───────────────────────── Task detail sheet (blocker drill-in) ───────────────────────── */

export function TaskDetailSheet({ task, onClose, onMarkInProgress, onMarkComplete, onOpenFull, isMobile }: {
  task: Task | null; onClose: () => void; isMobile: boolean;
  onMarkInProgress: (t: Task) => void; onMarkComplete: (t: Task) => void; onOpenFull: (t: Task) => void;
}) {
  return (
    <BottomSheet open={!!task} onClose={onClose} title={task?.task || "Task"} isMobile={isMobile} maxWidth={460}>
      {task && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
            <PartnerBadge assignedTo={task.assignedTo} />
            <span style={{ fontSize: 11, borderRadius: 99, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, padding: "3px 10px", fontWeight: 700 }}>{task.category}</span>
            <span style={{ fontSize: 11, borderRadius: 99, border: `1px solid ${task.status === "Overdue" ? T.redBorder : T.border}`, background: task.status === "Overdue" ? T.redLight : T.surface, color: task.status === "Overdue" ? T.red : T.muted, padding: "3px 10px", fontWeight: 700 }}>{task.status}</span>
            {task.priority && <span style={{ fontSize: 11, borderRadius: 99, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, padding: "3px 10px", fontWeight: 700 }}>{task.priority}</span>}
          </div>
          <div style={{ fontSize: 13, color: T.text, marginBottom: 14 }}>
            <strong>Due:</strong> {task.due || "No deadline set"}
          </div>
          {(task.checklist?.length || 0) > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.subtle, letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>CHECKLIST</div>
              {task.checklist.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: c.done ? T.muted : T.text, textDecoration: c.done ? "line-through" : "none", padding: "4px 0" }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${c.done ? T.text : T.borderStrong}`, background: c.done ? T.text : "#FFF", color: "#FFF", fontSize: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.done ? "✓" : ""}</span>
                  {c.text}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {task.status !== "In Progress" && task.status !== "Complete" && (
              <Btn onClick={() => { onMarkInProgress(task); onClose(); }} variant="primary" style={{ width: "100%", justifyContent: "center" }}>Start — Mark In Progress</Btn>
            )}
            {task.status !== "Complete" && (
              <Btn onClick={() => { onMarkComplete(task); onClose(); }} variant="outline" style={{ width: "100%", justifyContent: "center" }}>✓ Mark Complete</Btn>
            )}
            <Btn onClick={() => { onOpenFull(task); onClose(); }} variant="ghost" style={{ width: "100%", justifyContent: "center" }}>
              <ExternalLink size={13} style={{ marginRight: 6 }} /> Open Full Editor
            </Btn>
          </div>
        </>
      )}
    </BottomSheet>
  );
}

/* ───────────────────────── Deadline reminder banner + daily notification ───────────────────────── */

export function ReminderBanner({ tasks, parseDate, onViewTask, isMobile }: {
  tasks: Task[]; parseDate: (raw?: string) => Date | null; onViewTask: (t: Task) => void; isMobile: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const supported = typeof window !== "undefined" && "Notification" in window;
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(supported ? Notification.permission : "unsupported");

  const { overdue, dueToday } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const open = tasks.filter(t => t.status !== "Complete");
    const od = open.filter(t => { const d = parseDate(t.due); return t.status === "Overdue" || (d ? d < start : false); });
    const dt = open.filter(t => { const d = parseDate(t.due); return d ? (d >= start && d < end) : false; });
    return { overdue: od, dueToday: dt };
  }, [tasks, parseDate]);

  // Fire a local notification at most once per calendar day when permission is granted.
  useEffect(() => {
    if (perm !== "granted") return;
    if (overdue.length === 0 && dueToday.length === 0) return;
    const key = "ggw_reminded_" + new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    const parts: string[] = [];
    if (overdue.length) parts.push(`${overdue.length} overdue`);
    if (dueToday.length) parts.push(`${dueToday.length} due today`);
    try {
      new Notification("Glai Gung Won — today's focus", { body: `${parts.join(" · ")}. Open the app to review.`, icon: "/icon.svg", badge: "/icon.svg" });
    } catch { /* notification may be blocked */ }
  }, [perm, overdue.length, dueToday.length]);

  const total = overdue.length + dueToday.length;
  if (dismissed || total === 0) return null;

  const requestPerm = async () => {
    if (!supported) return;
    try { setPerm(await Notification.requestPermission()); } catch { /* denied */ }
  };

  const top = [...overdue, ...dueToday].slice(0, 3);
  const summary = [overdue.length ? `${overdue.length} overdue` : "", dueToday.length ? `${dueToday.length} due today` : ""].filter(Boolean).join(" · ");

  return (
    <div style={{ background: PASTEL.peach.bg, border: `1px solid ${PASTEL.peach.border}`, borderRadius: 14, padding: isMobile ? 12 : 14, marginBottom: isMobile ? 14 : 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: PASTEL.peach.text, display: "flex", alignItems: "center", gap: 6 }}>
          ⏰ {summary}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {supported && perm === "default" && (
            <button onClick={requestPerm} style={{ background: "#FFF", border: `1px solid ${PASTEL.peach.border}`, color: PASTEL.peach.text, borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              Enable reminders
            </button>
          )}
          <button onClick={() => setDismissed(true)} aria-label="Dismiss reminders" style={{ background: "none", border: "none", color: PASTEL.peach.text, cursor: "pointer", padding: 2, display: "flex", lineHeight: 1 }}>
            <X size={15} />
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {top.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFF", border: `1px solid ${PASTEL.peach.border}`, borderRadius: 9, padding: "7px 10px" }}>
            <PartnerBadge assignedTo={t.assignedTo} size={16} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: T.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.task}</span>
            <span style={{ fontSize: 10, color: t.status === "Overdue" ? T.red : T.subtle, fontWeight: 700, flexShrink: 0 }}>{t.status === "Overdue" || (parseDate(t.due) && parseDate(t.due)! < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) ? "overdue" : "today"}</span>
            <button onClick={() => onViewTask(t)} style={{ background: "#FFF", border: `1px solid ${T.borderStrong}`, borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 800, color: T.text, cursor: "pointer", flexShrink: 0 }}>View</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Quick Add sheet (mobile FAB menu) ───────────────────────── */

export interface QuickAddOption {
  label: string;
  description?: string;
  icon: React.ReactNode;
  tone: PastelTone;
  onSelect: () => void;
}

export function QuickAddSheet({ open, onClose, options, isMobile }: {
  open: boolean; onClose: () => void; options: QuickAddOption[]; isMobile: boolean;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Quick Add" isMobile={isMobile} maxWidth={420}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingBottom: 6 }}>
        {options.map(opt => (
          <button
            key={opt.label}
            onClick={() => { onClose(); opt.onSelect(); }}
            style={{
              border: `1px solid ${opt.tone.border}`, background: opt.tone.bg, borderRadius: 14,
              padding: "14px 12px", cursor: "pointer", textAlign: "left",
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, minHeight: 92,
            }}
          >
            <span style={{
              width: 34, height: 34, borderRadius: 10, background: "#FFFFFF",
              border: `1px solid ${opt.tone.border}`, color: opt.tone.text,
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {opt.icon}
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.text, lineHeight: 1.25 }}>{opt.label}</span>
            {opt.description && <span style={{ fontSize: 10.5, color: T.muted, lineHeight: 1.35 }}>{opt.description}</span>}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

/* ───────────────────────── Success toast ───────────────────────── */

export function SuccessToast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          style={{ position: "fixed", bottom: "calc(86px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)", zIndex: 998 }}
        >
          <div style={{ background: "#111", color: "#FFF", borderRadius: 12, padding: "11px 18px", fontSize: 13, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.3)", maxWidth: "88vw", textAlign: "center" }}>
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
