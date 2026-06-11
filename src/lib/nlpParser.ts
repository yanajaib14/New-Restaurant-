// Natural-language quick-task parser.
// Pattern: "@B finalize interim agreement by Friday" / "@C order glassware by next Tuesday"
// Extracts: assignedTo (B|C), title, due date (YYYY-MM-DD), best-guess category.

import { CATEGORIES } from "../types";

export interface ParsedQuickTask {
  assignedTo: "B" | "C";
  title: string;
  due: string | null; // YYYY-MM-DD
  category: string;
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const CATEGORY_KEYWORDS: Array<{ category: string; words: string[] }> = [
  { category: "Menu & Bar", words: ["menu", "cocktail", "drink", "wine", "bar", "glassware", "dish", "recipe", "plate", "food"] },
  { category: "Lease & TI", words: ["lease", "landlord", "contractor", "build", "renovation", "construction", "ti ", "buildout"] },
  { category: "Permits", words: ["permit", "license", "inspection", "health dept", "llc", "compliance", "insurance"] },
  { category: "Staffing", words: ["hire", "hiring", "staff", "interview", "candidate", "chef", "server", "bartender", "training", "onboard"] },
  { category: "Marketing", words: ["marketing", "instagram", "social", "logo", "brand", "domain", "website", "photo shoot", "press", "launch party"] },
  { category: "Financials", words: ["budget", "invoice", "payment", "loan", "bank", "accounting", "payroll", "quote", "deposit"] },
  { category: "IT & Systems", words: ["pos", "wifi", "software", "system", "printer", "reservation", "toast", "square"] },
  { category: "Operations", words: ["vendor", "supplier", "order", "delivery", "equipment", "inventory", "cleaning", "checklist", "agreement", "contract"] },
];

const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Resolve phrases like "friday", "next tuesday", "tomorrow", "today", "june 20", "6/20", "in 3 days" to YYYY-MM-DD. */
export function parseDeadlinePhrase(phrase: string, now: Date = new Date()): string | null {
  const p = phrase.trim().toLowerCase().replace(/[.,!]+$/, "");
  if (!p) return null;

  if (p === "today" || p === "tonight" || p === "eod") return toIsoDate(now);
  if (p === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return toIsoDate(d);
  }

  const inDays = p.match(/^in\s+(\d{1,2})\s+days?$/);
  if (inDays) {
    const d = new Date(now);
    d.setDate(d.getDate() + Number(inDays[1]));
    return toIsoDate(d);
  }

  if (p === "next week") {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return toIsoDate(d);
  }
  if (p === "end of week" || p === "this week" || p === "eow") {
    const d = new Date(now);
    const delta = (5 - d.getDay() + 7) % 7; // upcoming Friday
    d.setDate(d.getDate() + (delta === 0 ? 0 : delta));
    return toIsoDate(d);
  }
  if (p === "end of month" || p === "eom") {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return toIsoDate(d);
  }

  // "friday" / "next friday" / "this friday"
  const dayMatch = p.match(/^(next\s+|this\s+)?([a-z]+)$/);
  if (dayMatch) {
    const idx = DAY_NAMES.findIndex(n => n.startsWith(dayMatch[2]) && dayMatch[2].length >= 3);
    if (idx >= 0) {
      const d = new Date(now);
      let delta = (idx - d.getDay() + 7) % 7;
      if (delta === 0) delta = 7; // "by friday" said on a Friday means next occurrence
      if (dayMatch[1] && dayMatch[1].startsWith("next") && delta <= 3) delta += 7;
      d.setDate(d.getDate() + delta);
      return toIsoDate(d);
    }
  }

  // Explicit dates: 2026-06-20, 6/20, 6/20/2026, june 20
  const iso = p.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return toIsoDate(new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));

  const slash = p.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (slash) {
    const year = slash[3] ? (Number(slash[3]) < 100 ? 2000 + Number(slash[3]) : Number(slash[3])) : now.getFullYear();
    const d = new Date(year, Number(slash[1]) - 1, Number(slash[2]));
    if (!slash[3] && d < now) d.setFullYear(d.getFullYear() + 1);
    return toIsoDate(d);
  }

  const monthName = p.match(/^([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?$/);
  if (monthName) {
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const mi = months.findIndex(m => m.startsWith(monthName[1]) && monthName[1].length >= 3);
    if (mi >= 0) {
      const d = new Date(now.getFullYear(), mi, Number(monthName[2]));
      if (d < now) d.setFullYear(d.getFullYear() + 1);
      return toIsoDate(d);
    }
  }

  return null;
}

export function guessCategory(text: string): string {
  const t = ` ${text.toLowerCase()} `;
  for (const { category, words } of CATEGORY_KEYWORDS) {
    if (words.some(w => t.includes(w))) return category;
  }
  return CATEGORIES.includes("Operations") ? "Operations" : CATEGORIES[0];
}

/**
 * Parse "@B finalize interim agreement by Friday" style input.
 * Returns null when the text doesn't start with a partner mention.
 */
export function parseQuickTask(input: string, now: Date = new Date()): ParsedQuickTask | null {
  const m = input.trim().match(/^@([bc])\b[:,]?\s+(.+)$/i);
  if (!m) return null;

  const assignedTo = m[1].toUpperCase() as "B" | "C";
  let body = m[2].trim();
  let due: string | null = null;

  // Split on the LAST " by " so titles containing "by" still work.
  const byIdx = body.toLowerCase().lastIndexOf(" by ");
  if (byIdx > 0) {
    const candidate = body.slice(byIdx + 4);
    const parsed = parseDeadlinePhrase(candidate, now);
    if (parsed) {
      due = parsed;
      body = body.slice(0, byIdx).trim();
    }
  }
  if (!due) {
    // also allow trailing "due friday" / "deadline friday"
    const dueMatch = body.match(/\s(?:due|deadline)\s+(.+)$/i);
    if (dueMatch) {
      const parsed = parseDeadlinePhrase(dueMatch[1], now);
      if (parsed) {
        due = parsed;
        body = body.slice(0, body.length - dueMatch[0].length).trim();
      }
    }
  }

  if (!body) return null;
  const title = body.charAt(0).toUpperCase() + body.slice(1);
  return { assignedTo, title, due, category: guessCategory(body) };
}

/**
 * Scan a block of text (e.g. an AI reply) for any lines that propose a task
 * in the "@B ... by ..." / "@C ..." format. Returns the parsed tasks, de-duped.
 */
export function extractProposedTasks(text: string, now: Date = new Date()): ParsedQuickTask[] {
  const out: ParsedQuickTask[] = [];
  const seen = new Set<string>();
  for (const rawLine of String(text || "").split(/\n+/)) {
    // strip common list markers / bold so "- **@B do x by Fri**" still parses
    const line = rawLine.replace(/^[\s>*\-•\d.]+/, "").replace(/\*\*/g, "").trim();
    const m = line.match(/@[bc]\b/i);
    if (!m) continue;
    const parsed = parseQuickTask(line.slice(line.toLowerCase().indexOf("@")), now);
    if (!parsed) continue;
    const key = `${parsed.assignedTo}:${parsed.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(parsed);
  }
  return out;
}

/**
 * Returns "B" or "C" ONLY when the assignee is literally the B/C shorthand
 * (e.g. "B", "C", "B - notes"). Real names like "Bob" or "Carlos" return null
 * so they're shown as their own initials instead of being mistaken for B/C.
 */
export function partnerOf(assignedTo?: string | null): "B" | "C" | null {
  const a = String(assignedTo || "").trim().toUpperCase();
  if (!a) return null;
  if (a === "B" || /^B[\s\-(:]/.test(a)) return "B";
  if (a === "C" || /^C[\s\-(:]/.test(a)) return "C";
  return null;
}
