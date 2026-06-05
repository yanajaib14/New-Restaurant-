import React, { useEffect, useState } from 'react';
import { T, WHEN_COLORS } from '../types';
import { Btn } from './UI';
import { PenLine, Trash2, Plus } from 'lucide-react';

type RuleItem = { id: number; title: string; detail: string };
type RuleCategory = { id: number; category: string; icon: string; rules: RuleItem[] };
type SideworkTask = { id: string | number; task: string; when: string; detail: string };
type RoleCard = {
  id: string;
  label: string;
  icon: string;
  color: string;
  colorLight: string;
  colorBorder: string;
  description: string;
  sidework: SideworkTask[];
};

const INIT_HOUSE_RULES: RuleCategory[] = [
  {
    id: 1,
    category: 'Attendance & Punctuality',
    icon: '⏰',
    rules: [
      {
        id: 101,
        title: 'Arrive 15 Minutes Early',
        detail:
          'All staff must arrive 15 minutes before their scheduled shift, clock in on time, and be ready to work. Lateness without notice is subject to disciplinary action.',
      },
      {
        id: 102,
        title: 'Call-Out Policy',
        detail:
          'If you cannot make your shift, notify management by phone at least 4 hours in advance. Text messages alone are not accepted. No-call/no-show is grounds for termination.',
      },
      {
        id: 103,
        title: 'Shift Swaps',
        detail:
          'All shift swaps must be approved by a manager in writing. You remain responsible for the shift until the swap is confirmed.',
      },
    ],
  },
  {
    id: 2,
    category: 'Uniform & Appearance',
    icon: '👔',
    rules: [
      {
        id: 201,
        title: 'Dress Code',
        detail:
          'FOH staff wear the designated uniform with black non-slip shoes. BOH staff wear kitchen blacks or chef coats with non-slip shoes. No jeans unless approved.',
      },
      {
        id: 202,
        title: 'Grooming Standards',
        detail:
          'Hair must be tied back in food-prep areas. Jewelry should be minimal, and strong fragrances are not allowed while working around guests or food.',
      },
      {
        id: 203,
        title: 'Name Badges',
        detail:
          'Wear your name badge at all times on the floor. It helps build guest trust and keeps the team presentation consistent.',
      },
    ],
  },
  {
    id: 3,
    category: 'Guest Service Standards',
    icon: '⭐',
    rules: [
      {
        id: 301,
        title: 'Greet Within 60 Seconds',
        detail:
          'Every guest should be acknowledged within 60 seconds, even during a rush. Eye contact and a quick greeting prevent guests from feeling ignored.',
      },
      {
        id: 302,
        title: 'No Personal Phones on the Floor',
        detail:
          'Personal phones are not used on the dining floor or behind the bar during service. Use them only during breaks in designated staff areas.',
      },
      {
        id: 303,
        title: 'Guest Complaints',
        detail:
          'Do not argue with guests. Acknowledge the issue, apologize, and escalate to a manager when needed. Focus on resolution, not blame.',
      },
      {
        id: 304,
        title: 'Check-Back Timing',
        detail:
          'Check back within 2 minutes of food delivery and ask if the guest needs anything else before leaving the table.',
      },
    ],
  },
  {
    id: 4,
    category: 'Food Safety & Hygiene',
    icon: '🧼',
    rules: [
      {
        id: 401,
        title: 'Handwashing',
        detail:
          'Wash hands for at least 20 seconds after restroom use, handling raw protein, touching your face, using a phone, or taking out trash.',
      },
      {
        id: 402,
        title: 'Temperature Logs',
        detail:
          'BOH staff log hot and cold holding temperatures every 2 hours. Hot food stays above 140 F and cold food below 40 F unless local policy states otherwise.',
      },
      {
        id: 403,
        title: 'FIFO Rotation',
        detail:
          'Use first in, first out rotation for all products. Older items move to the front, newer items to the back, and everything is labeled with date and contents.',
      },
      {
        id: 404,
        title: 'No Eating on the Line',
        detail:
          'Staff meals are eaten before or after service in designated areas. Do not snack or eat on the line during service.',
      },
    ],
  },
  {
    id: 5,
    category: 'Cash & POS Procedures',
    icon: '💳',
    rules: [
      {
        id: 501,
        title: 'Voids Need Approval',
        detail:
          'Any void, comp, or discount over the approved threshold requires manager approval. Unauthorized adjustments are a serious policy violation.',
      },
      {
        id: 502,
        title: 'Cash Handling',
        detail:
          'Count your bank at the start and end of every shift. Report any discrepancy before leaving, and never leave a drawer unattended.',
      },
      {
        id: 503,
        title: 'Tip Reporting',
        detail:
          'Report all tips accurately and follow the restaurant tip-out policy and applicable state regulations.',
      },
    ],
  },
  {
    id: 6,
    category: 'Communication & Teamwork',
    icon: '🤝',
    rules: [
      {
        id: 601,
        title: 'Respect in the Workplace',
        detail:
          'Harassment, discrimination, or bullying toward coworkers or guests is not tolerated and may result in immediate termination.',
      },
      {
        id: 602,
        title: 'Kitchen Communication',
        detail:
          'Use direct callouts like hot behind, corner, sharp, or eighty-six. Clear communication prevents accidents and keeps service moving.',
      },
      {
        id: 603,
        title: 'Problems Go Up, Not Around',
        detail:
          'Bring issues to management directly instead of venting on the floor. Fast escalation beats floor gossip every time.',
      },
    ],
  },
];

const INIT_ROLES: RoleCard[] = [
  {
    id: 'server',
    label: 'Server',
    icon: '🍽️',
    color: T.blue,
    colorLight: T.blueLight,
    colorBorder: T.blueBorder,
    description: 'Servers are the face of the guest experience. You own your tables from greeting to farewell.',
    sidework: [
      { id: 's1', task: 'Polish glassware and silverware', when: 'Opening', detail: 'Use a lint-free cloth and ensure every piece is spotless before service.' },
      { id: 's2', task: 'Set all tables', when: 'Opening', detail: 'Confirm every table matches the house setup diagram before doors open.' },
      { id: 's3', task: 'Restock server stations', when: 'Opening', detail: 'Restock napkins, straws, condiments, sweeteners, and to-go supplies.' },
      { id: 's4', task: 'Check POS assignments and table map', when: 'Opening', detail: 'Know your section, table numbers, and any menu item changes before service starts.' },
      { id: 's5', task: 'Reset tables after each turn', when: 'During Service', detail: 'Clear, sanitize, and fully reset each table before the next seating.' },
      { id: 's6', task: 'Refill condiments and sugar caddies', when: 'Closing', detail: 'Consolidate matching condiments, refill service supplies, and wipe containers clean.' },
      { id: 's7', task: 'Break down and clean station', when: 'Closing', detail: 'Empty ice bins, wipe shelves, sanitize touch points, and leave the station stocked for the next shift.' },
      { id: 's8', task: 'Sweep section and wipe tables', when: 'Closing', detail: 'Sweep under all tables and chairs and wipe down each table surface and chair back.' },
    ],
  },
  {
    id: 'bartender',
    label: 'Bartender',
    icon: '🍸',
    color: T.purple,
    colorLight: T.purpleLight,
    colorBorder: T.purpleBorder,
    description: 'Bartenders run the bar program, maintain the guest experience at the rail, and support ticket flow for the floor.',
    sidework: [
      { id: 'b1', task: 'Set up garnish station and tools', when: 'Opening', detail: 'Prep citrus, cherries, herbs, ice, jiggers, bar mats, and service tools.' },
      { id: 'b2', task: 'Check liquor par levels', when: 'Opening', detail: 'Review bottle counts, rotate stock, and flag anything below par to management.' },
      { id: 'b3', task: 'Test draft and beer lines', when: 'Opening', detail: 'Pull test pours, check for off-flavors, and clean drip trays.' },
      { id: 'b4', task: 'Stock polished glassware', when: 'Opening', detail: 'Make sure rocks, pint, wine, cocktail, and specialty glassware are fully stocked.' },
      { id: 'b5', task: 'Maintain bar cleanliness during service', when: 'During Service', detail: 'Wipe the bar top, clear empties quickly, and keep the well organized.' },
      { id: 'b6', task: 'Break down garnish station', when: 'Closing', detail: 'Wrap, label, or discard garnishes based on shelf life and sanitize the station.' },
      { id: 'b7', task: 'Clean pour spouts and tools', when: 'Closing', detail: 'Soak and sanitize pour spouts, jiggers, shakers, and tools before closing.' },
      { id: 'b8', task: 'Sanitize the full bar', when: 'Closing', detail: 'Clean rails, underbar, taps, shelves, bar mats, and behind-bar floors.' },
    ],
  },
  {
    id: 'host',
    label: 'Host / Hostess',
    icon: '🛎️',
    color: T.green,
    colorLight: T.greenLight,
    colorBorder: T.greenBorder,
    description: 'Hosts set the tone for the entire guest experience from the first hello to the final thank you.',
    sidework: [
      { id: 'h1', task: 'Inspect the dining room before open', when: 'Opening', detail: 'Walk every table and report any cleanliness or setup issues before guests arrive.' },
      { id: 'h2', task: 'Review reservations and notes', when: 'Opening', detail: 'Know all bookings, celebrations, VIPs, and large parties before service begins.' },
      { id: 'h3', task: 'Set up the host stand', when: 'Opening', detail: 'Restock menus, waitlist tools, loyalty material, and reservation paperwork.' },
      { id: 'h4', task: 'Manage waitlist and quote times', when: 'During Service', detail: 'Quote realistic waits and keep guests updated when estimates change.' },
      { id: 'h5', task: 'Communicate table turns with servers', when: 'During Service', detail: 'Give servers notice before seating and never drop guests into a section without communication.' },
      { id: 'h6', task: 'Clean and organize the host stand', when: 'Closing', detail: 'Reset menus, wipe surfaces, and organize the stand for the next shift.' },
      { id: 'h7', task: 'Wipe entrance and front windows', when: 'Closing', detail: 'Clean door glass, entry area, and mats so the restaurant opens sharp the next day.' },
    ],
  },
  {
    id: 'busser',
    label: 'Busser / Food Runner',
    icon: '🏃',
    color: T.orange,
    colorLight: T.orangeLight,
    colorBorder: T.orangeBorder,
    description: 'Bussers and runners keep service moving with speed, accuracy, and constant awareness of the room.',
    sidework: [
      { id: 'br1', task: 'Stock side stations', when: 'Opening', detail: 'Set up bus tubs, spray bottles, towels, napkins, and silverware rolls at every station.' },
      { id: 'br2', task: 'Pre-bus tables during service', when: 'During Service', detail: 'Clear clutter, refill water, and keep tables looking active and cared for.' },
      { id: 'br3', task: 'Run food accurately and quickly', when: 'During Service', detail: 'Confirm table numbers and seat positions before leaving expo.' },
      { id: 'br4', task: 'Communicate with servers and kitchen', when: 'During Service', detail: 'Call out what you are running and make sure expo is never abandoned mid-ticket.' },
      { id: 'br5', task: 'Deep clean bus stations', when: 'Closing', detail: 'Wash tubs, sanitize shelves, wipe walls, and restock for the next shift.' },
      { id: 'br6', task: 'Sweep and mop dining room', when: 'Closing', detail: 'Clean under tables, booths, and service areas before final close.' },
      { id: 'br7', task: 'Break down linen and restock napkins', when: 'Closing', detail: 'Sort dirty linen and prep clean napkin rolls for the opening team.' },
    ],
  },
  {
    id: 'line_cook',
    label: 'Line Cook',
    icon: '🔥',
    color: T.red,
    colorLight: T.redLight,
    colorBorder: T.redBorder,
    description: 'Line cooks are responsible for food quality, station prep, consistency, and a clean, safe line.',
    sidework: [
      { id: 'lc1', task: 'Set station mise en place', when: 'Opening', detail: 'Have every item prepped, labeled, dated, and ready before the first ticket fires.' },
      { id: 'lc2', task: 'Review prep list and eighty-sixes', when: 'Opening', detail: 'Know what is low, what is missing, and what the floor must hear before service.' },
      { id: 'lc3', task: 'Log temperatures', when: 'Opening', detail: 'Record holding temperatures and flag anything out of range immediately.' },
      { id: 'lc4', task: 'Maintain station cleanliness', when: 'During Service', detail: 'Keep boards sanitized, wipe surfaces regularly, and avoid clutter during the rush.' },
      { id: 'lc5', task: 'Break down and sanitize station', when: 'Closing', detail: 'Wrap, label, and store product properly, then clean pans, shelves, and equipment.' },
      { id: 'lc6', task: 'Clean grill, flat top, and fryers', when: 'Closing', detail: 'Scrape, degrease, and clean all hot-line equipment per close checklist.' },
      { id: 'lc7', task: 'Take out trash and replace liners', when: 'Closing', detail: 'Empty all cans, reline them, and clear trash before final mop.' },
      { id: 'lc8', task: 'Sweep and mop line and walk-in threshold', when: 'Closing', detail: 'Finish with a clean floor, especially under equipment and in traffic zones.' },
    ],
  },
  {
    id: 'dishwasher',
    label: 'Dishwasher',
    icon: '🫧',
    color: '#4A9AA8',
    colorLight: '#EEF8FA',
    colorBorder: '#B0DBE2',
    description: 'Dishwashers keep the whole operation moving. Clean equipment and dish flow support every department.',
    sidework: [
      { id: 'd1', task: 'Check machine and chemical levels', when: 'Opening', detail: 'Run a test cycle and confirm sanitizer, detergent, and rinse performance.' },
      { id: 'd2', task: 'Set up dish station', when: 'Opening', detail: 'Prepare soak bins, racks, scraping area, and clear storage for clean dishes.' },
      { id: 'd3', task: 'Keep dish flow continuous', when: 'During Service', detail: 'Prioritize glassware and critical kitchen tools so nothing bottlenecks service.' },
      { id: 'd4', task: 'Empty and sanitize machine', when: 'Closing', detail: 'Run the final cycle, clean strainers, wipe the machine down, and leave it open to dry.' },
      { id: 'd5', task: 'Clean floor drains', when: 'Closing', detail: 'Clear debris from all drains and sanitize covers before final close.' },
      { id: 'd6', task: 'Degrease the dish area', when: 'Closing', detail: 'Clean walls, racks, bins, hood surfaces, and splash zones thoroughly.' },
      { id: 'd7', task: 'Final sweep and mop', when: 'Closing', detail: 'Sweep the full dish pit and mop corners, drain lines, and under the machine.' },
    ],
  },
];

const HOUSE_RULES_STORAGE_KEY = 'restaurant_house_rules_v1';
const TEAM_ROLES_STORAGE_KEY = 'restaurant_team_roles_v1';

const readStoredArray = <T,>(key: string, fallback: T[]): T[] => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
};

const writeStoredArray = (key: string, value: unknown[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write errors.
  }
};

export function TeamOnboarding() {
  const isMobile = window.innerWidth < 1024;
  const [section, setSection] = useState('roles');
  const [activeRole, setActiveRole] = useState('server');
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | number | null>(null);
  const [whenFilter, setWhenFilter] = useState('All');
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [editingRule, setEditingRule] = useState<(RuleItem & { catId: number }) | null>(null);
  const [editingTask, setEditingTask] = useState<(SideworkTask & { roleId: string }) | null>(null);
  const [houseRules, setHouseRules] = useState<RuleCategory[]>(() => readStoredArray<RuleCategory>(HOUSE_RULES_STORAGE_KEY, INIT_HOUSE_RULES));
  const [roles, setRoles] = useState<RoleCard[]>(() => readStoredArray<RoleCard>(TEAM_ROLES_STORAGE_KEY, INIT_ROLES));
  const [newRuleText, setNewRuleText] = useState({ title: '', detail: '' });
  const [newTaskText, setNewTaskText] = useState({ task: '', when: 'Opening', detail: '' });
  const [addingRuleTo, setAddingRuleTo] = useState<number | null>(null);
  const [addingTaskTo, setAddingTaskTo] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<RuleCategory | null>(null);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatText, setNewCatText] = useState({ category: '', icon: '' });

  const role = roles.find((entry) => entry.id === activeRole);
  const filteredSidework = role
    ? whenFilter === 'All'
      ? role.sidework
      : role.sidework.filter((task) => task.when === whenFilter)
    : [];

  const toggleCheck = (roleId: string, taskId: string | number) => {
    const key = `${roleId}:${taskId}`;
    setCheckedTasks((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const isChecked = (roleId: string, taskId: string | number) => Boolean(checkedTasks[`${roleId}:${taskId}`]);

  const roleProgress = (entry: RoleCard) => {
    const total = entry.sidework.length;
    const done = entry.sidework.filter((task) => isChecked(entry.id, task.id)).length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  const saveRule = (catId: number, rule: RuleItem) => {
    setHouseRules((previous) =>
      previous.map((cat) =>
        cat.id === catId ? { ...cat, rules: cat.rules.map((item) => (item.id === rule.id ? rule : item)) } : cat,
      ),
    );
    setEditingRule(null);
  };

  const addRule = (catId: number) => {
    if (!newRuleText.title.trim()) return;
    setHouseRules((previous) =>
      previous.map((cat) =>
        cat.id === catId ? { ...cat, rules: [...cat.rules, { id: Date.now(), ...newRuleText }] } : cat,
      ),
    );
    setNewRuleText({ title: '', detail: '' });
    setAddingRuleTo(null);
  };

  const deleteRule = (catId: number, ruleId: number) => {
    setHouseRules((previous) =>
      previous.map((cat) =>
        cat.id === catId ? { ...cat, rules: cat.rules.filter((rule) => rule.id !== ruleId) } : cat,
      ),
    );
  };

  const saveCategory = (updated: RuleCategory) => {
    setHouseRules((prev) => prev.map((cat) => cat.id === updated.id ? { ...cat, category: updated.category, icon: updated.icon } : cat));
    setEditingCat(null);
  };

  const addCategory = () => {
    if (!newCatText.category.trim()) return;
    setHouseRules((prev) => [...prev, { id: Date.now(), category: newCatText.category, icon: newCatText.icon || '📋', rules: [] }]);
    setNewCatText({ category: '', icon: '' });
    setAddingCat(false);
  };

  const deleteCategory = (catId: number) => {
    setHouseRules((prev) => prev.filter((cat) => cat.id !== catId));
    if (activeCat === catId) setActiveCat(null);
  };

  const addTask = (roleId: string) => {
    if (!newTaskText.task.trim()) return;
    setRoles((previous) =>
      previous.map((entry) =>
        entry.id === roleId ? { ...entry, sidework: [...entry.sidework, { id: Date.now(), ...newTaskText }] } : entry,
      ),
    );
    setNewTaskText({ task: '', when: 'Opening', detail: '' });
    setAddingTaskTo(null);
  };

  const deleteTask = (roleId: string, taskId: string | number) => {
    setRoles((previous) =>
      previous.map((entry) =>
        entry.id === roleId ? { ...entry, sidework: entry.sidework.filter((task) => task.id !== taskId) } : entry,
      ),
    );
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#FAFAFA',
    border: `1px solid ${T.border}`,
    borderRadius: 7,
    padding: '8px 11px',
    color: T.text,
    fontSize: 12,
    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  };

  useEffect(() => {
    writeStoredArray(HOUSE_RULES_STORAGE_KEY, houseRules as unknown[]);
  }, [houseRules]);

  useEffect(() => {
    writeStoredArray(TEAM_ROLES_STORAGE_KEY, roles as unknown[]);
  }, [roles]);

  return (
    <div className="fu">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 22, margin: '0 0 3px', fontWeight: 700, color: T.text }}>
            Team Onboarding
          </h2>
          <p style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", color: T.muted, fontSize: 12, margin: 0 }}>
            House rules, role responsibilities, and sidework checklists for every team member
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          padding: 3,
          gap: 3,
          marginBottom: 22,
          width: isMobile ? '100%' : 'fit-content',
          overflowX: isMobile ? 'auto' : 'visible',
        }}
      >
        {[
          ['roles', 'Roles & Sidework'],
          ['rules', 'House Rules'],
          ['checklist', 'Shift Checklist'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            style={{
              background: section === id ? '#FFF' : 'transparent',
              border: section === id ? `1px solid ${T.borderStrong}` : '1px solid transparent',
              borderRadius: 8,
              padding: isMobile ? '8px 12px' : '8px 20px',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
              fontWeight: section === id ? 600 : 400,
              color: section === id ? T.text : T.muted,
              boxShadow: section === id ? '0 1px 4px rgba(0,0,0,.07)' : 'none',
              transition: 'all .15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '220px 1fr', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {roles.map((entry) => {
              const { done, total, pct } = roleProgress(entry);
              const active = activeRole === entry.id;
              return (
                <button
                  key={entry.id}
                  onClick={() => {
                    setActiveRole(entry.id);
                    setWhenFilter('All');
                    setExpandedTask(null);
                  }}
                  style={{
                    background: active ? '#FFF' : T.bg,
                    border: `1px solid ${active ? entry.colorBorder : T.border}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all .15s',
                    boxShadow: active ? '0 2px 8px rgba(0,0,0,.06)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{entry.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: active ? entry.color : T.text }}>{entry.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 3, background: T.border, borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: entry.color, borderRadius: 2, transition: 'width .3s' }} />
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: T.muted }}>{done}/{total}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {role && (
            <div>
              <div style={{ background: '#FFF', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 14 : 20, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 26 }}>{role.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 18, fontWeight: 700, color: T.text }}>{role.label}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{role.description}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {['All', 'Opening', 'During Service', 'Closing'].map((when) => {
                    const colors = WHEN_COLORS[when] || { bg: T.bg, dot: T.muted, border: T.border };
                    const active = whenFilter === when;
                    return (
                      <button
                        key={when}
                        onClick={() => setWhenFilter(when)}
                        style={{
                          cursor: 'pointer',
                          borderRadius: 20,
                          padding: '5px 12px',
                          fontSize: 11,
                          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                          border: `1px solid ${active ? colors.dot : T.border}`,
                          background: active ? colors.bg : '#FFF',
                          color: active ? colors.dot : T.muted,
                          fontWeight: active ? 600 : 400,
                          transition: 'all .15s',
                        }}
                      >
                        {when}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: '#FFF', border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {filteredSidework.map((task, index) => {
                  const checked = isChecked(role.id, task.id);
                  const colors = WHEN_COLORS[task.when] || WHEN_COLORS.Opening;
                  const isExpanded = expandedTask === task.id;
                  const isEditing = editingTask?.id === task.id;
                  return (
                    <div key={task.id} style={{ borderBottom: `1px solid ${T.border}`, background: checked ? role.colorLight : index % 2 === 0 ? '#FFF' : T.bg }}>
                      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 12, padding: isMobile ? '11px 12px' : '13px 18px' }}>
                        <button
                          onClick={() => toggleCheck(role.id, task.id)}
                          style={{
                            width: 20,
                            height: 20,
                            minWidth: 20,
                            border: `2px solid ${checked ? role.color : T.border}`,
                            borderRadius: 4,
                            background: checked ? role.color : '#FFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            flexShrink: 0,
                            transition: 'all .15s',
                          }}
                        >
                          {checked && <span style={{ color: '#FFF', fontSize: 12, lineHeight: 1 }}>x</span>}
                        </button>
                        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: checked ? T.muted : T.text, textDecoration: checked ? 'line-through' : 'none' }}>{task.task}</span>
                            <span style={{ fontSize: 10, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontWeight: 500, padding: '2px 8px', borderRadius: 12, background: colors.bg, color: colors.dot, border: `1px solid ${T.border}` }}>{task.when}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                          <button
                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                            style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 8px', color: T.muted, cursor: 'pointer', fontSize: 11, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
                          >
                            {'>'}
                          </button>
                          <button
                            onClick={() => setEditingTask(isEditing ? null : { ...task, roleId: role.id })}
                            title="Edit task"
                            style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 8px', color: T.muted, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center' }}
                          >
                            <PenLine size={12} />
                          </button>
                          <button
                            onClick={() => deleteTask(role.id, task.id)}
                            title="Delete task"
                            style={{ background: 'none', border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: '3px 8px', color: T.red, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {isExpanded && !isEditing && (
                        <div style={{ padding: isMobile ? '0 12px 12px 44px' : '0 18px 14px 50px', fontSize: 12, color: '#555', lineHeight: 1.7, fontStyle: 'italic' }}>{task.detail}</div>
                      )}
                      {isEditing && editingTask && (
                        <div style={{ padding: isMobile ? '0 12px 12px 44px' : '0 18px 14px 50px' }}>
                          <input value={editingTask.task} onChange={(event) => setEditingTask((previous) => (previous ? { ...previous, task: event.target.value } : previous))} style={{ ...inputStyle, marginBottom: 8 }} />
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <select value={editingTask.when} onChange={(event) => setEditingTask((previous) => (previous ? { ...previous, when: event.target.value } : previous))} style={{ ...inputStyle, width: isMobile ? '100%' : 160 }}>
                              {['Opening', 'During Service', 'Closing'].map((when) => (
                                <option key={when}>{when}</option>
                              ))}
                            </select>
                          </div>
                          <textarea value={editingTask.detail} onChange={(event) => setEditingTask((previous) => (previous ? { ...previous, detail: event.target.value } : previous))} rows={2} style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Btn
                              variant="primary"
                              small
                              onClick={() => {
                                setRoles((previous) =>
                                  previous.map((entry) =>
                                    entry.id === editingTask.roleId
                                      ? { ...entry, sidework: entry.sidework.map((taskItem) => (taskItem.id === editingTask.id ? { id: editingTask.id, task: editingTask.task, when: editingTask.when, detail: editingTask.detail } : taskItem)) }
                                      : entry,
                                  ),
                                );
                                setEditingTask(null);
                              }}
                            >
                              Save
                            </Btn>
                            <Btn variant="ghost" small onClick={() => setEditingTask(null)}>
                              Cancel
                            </Btn>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {addingTaskTo === role.id ? (
                  <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, background: T.bg }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 160px', gap: 8, marginBottom: 8 }}>
                      <input value={newTaskText.task} onChange={(event) => setNewTaskText((previous) => ({ ...previous, task: event.target.value }))} placeholder="Sidework task name..." style={inputStyle} />
                      <select value={newTaskText.when} onChange={(event) => setNewTaskText((previous) => ({ ...previous, when: event.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {['Opening', 'During Service', 'Closing'].map((when) => (
                          <option key={when}>{when}</option>
                        ))}
                      </select>
                    </div>
                    <textarea value={newTaskText.detail} onChange={(event) => setNewTaskText((previous) => ({ ...previous, detail: event.target.value }))} placeholder="Describe the task in detail..." rows={2} style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn variant="primary" small onClick={() => addTask(role.id)}>
                        Add Task
                      </Btn>
                      <Btn variant="ghost" small onClick={() => setAddingTaskTo(null)}>
                        Cancel
                      </Btn>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '10px 18px', borderTop: `1px solid ${T.border}` }}>
                    <button
                      onClick={() => setAddingTaskTo(role.id)}
                      style={{ background: 'none', border: `1px dashed ${T.borderStrong}`, borderRadius: 7, padding: '6px 14px', color: T.muted, cursor: 'pointer', fontSize: 12, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}
                    >
                      + Add Sidework Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {section === 'rules' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
            <button
              onClick={() => setActiveCat(null)}
              style={{ cursor: 'pointer', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", border: `1px solid ${activeCat === null ? T.gold : T.border}`, background: activeCat === null ? T.goldLight : '#FFF', color: activeCat === null ? T.gold : T.muted, fontWeight: activeCat === null ? 600 : 400 }}
            >
              All Categories
            </button>
            {houseRules.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
                style={{ cursor: 'pointer', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", border: `1px solid ${activeCat === cat.id ? T.gold : T.border}`, background: activeCat === cat.id ? T.goldLight : '#FFF', color: activeCat === cat.id ? T.gold : T.muted, fontWeight: activeCat === cat.id ? 600 : 400 }}
              >
                {cat.icon} {cat.category}
              </button>
            ))}
            <button
              onClick={() => setAddingCat(true)}
              style={{ cursor: 'pointer', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", border: `1px dashed ${T.borderStrong}`, background: '#FFF', color: T.muted, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={11} /> New Category
            </button>
          </div>

          {/* Add Category inline form */}
          {addingCat && (
            <div style={{ background: '#FFF', border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: T.muted, marginBottom: 4 }}>ICON (emoji)</div>
                <input value={newCatText.icon} onChange={(e) => setNewCatText((p) => ({ ...p, icon: e.target.value }))} placeholder="📋" style={{ ...inputStyle, width: 60 }} maxLength={2} />
              </div>
              <div style={{ flex: 3, minWidth: 160 }}>
                <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: T.muted, marginBottom: 4 }}>CATEGORY NAME</div>
                <input value={newCatText.category} onChange={(e) => setNewCatText((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Health & Safety" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="primary" small onClick={addCategory}>Add</Btn>
                <Btn variant="ghost" small onClick={() => { setAddingCat(false); setNewCatText({ category: '', icon: '' }); }}>Cancel</Btn>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${isMobile ? 260 : 420}px,1fr))`, gap: 14 }}>
            {houseRules
              .filter((cat) => activeCat === null || cat.id === activeCat)
              .map((cat) => (
                <div key={cat.id} style={{ background: '#FFF', border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
                  {/* Category header */}
                  {editingCat?.id === cat.id ? (
                    <div style={{ padding: '12px 18px', background: T.goldLight, borderBottom: `1px solid ${T.goldBorder}`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input value={editingCat.icon} onChange={(e) => setEditingCat((p) => p ? { ...p, icon: e.target.value } : p)} style={{ ...inputStyle, width: 52 }} maxLength={2} placeholder="📋" />
                      <input value={editingCat.category} onChange={(e) => setEditingCat((p) => p ? { ...p, category: e.target.value } : p)} style={{ ...inputStyle, flex: 1, minWidth: 120 }} placeholder="Category name" />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn variant="primary" small onClick={() => saveCategory(editingCat)}>Save</Btn>
                        <Btn variant="ghost" small onClick={() => setEditingCat(null)}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '14px 18px', background: T.goldLight, borderBottom: `1px solid ${T.goldBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{cat.icon}</span>
                        <span style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 14, fontWeight: 700, color: T.text }}>{cat.category}</span>
                        <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: T.muted }}>{cat.rules.length} rules</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => setEditingCat({ ...cat })} title="Edit category" style={{ background: 'none', border: `1px solid ${T.goldBorder}`, borderRadius: 6, padding: '4px 6px', color: T.gold, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><PenLine size={12} /></button>
                        <button onClick={() => deleteCategory(cat.id)} title="Delete category" style={{ background: 'none', border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: '4px 6px', color: T.red, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  )}
                  {cat.rules.map((rule, index) => {
                    const isExpanded = expandedRule === `${cat.id}:${rule.id}`;
                    const isEditing = editingRule?.id === rule.id;
                    return (
                      <div key={rule.id} style={{ borderBottom: `1px solid ${T.border}`, background: index % 2 === 0 ? '#FFF' : T.bg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.gold, flexShrink: 0 }} />
                          <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpandedRule(isExpanded ? null : `${cat.id}:${rule.id}`)}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{rule.title}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button
                              onClick={() => setExpandedRule(isExpanded ? null : `${cat.id}:${rule.id}`)}
                              style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 7px', color: T.muted, cursor: 'pointer', fontSize: 11, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
                            >
                              {'>'}
                            </button>
                            <button
                              onClick={() => setEditingRule(isEditing ? null : { ...rule, catId: cat.id })}
                              title="Edit rule"
                              style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 6px', color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <PenLine size={12} />
                            </button>
                            <button
                              onClick={() => deleteRule(cat.id, rule.id)}
                              title="Delete rule"
                              style={{ background: 'none', border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: '4px 6px', color: T.red, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        {isExpanded && !isEditing && <div style={{ padding: '0 18px 12px 34px', fontSize: 12, color: '#555', lineHeight: 1.7 }}>{rule.detail}</div>}
                        {isEditing && editingRule && (
                          <div style={{ padding: '0 18px 12px 34px' }}>
                            <input value={editingRule.title} onChange={(event) => setEditingRule((previous) => (previous ? { ...previous, title: event.target.value } : previous))} style={{ ...inputStyle, marginBottom: 8 }} />
                            <textarea value={editingRule.detail} onChange={(event) => setEditingRule((previous) => (previous ? { ...previous, detail: event.target.value } : previous))} rows={3} style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }} />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Btn variant="primary" small onClick={() => saveRule(cat.id, { id: editingRule.id, title: editingRule.title, detail: editingRule.detail })}>
                                Save
                              </Btn>
                              <Btn variant="ghost" small onClick={() => setEditingRule(null)}>
                                Cancel
                              </Btn>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {addingRuleTo === cat.id ? (
                    <div style={{ padding: 14, borderTop: `1px solid ${T.border}`, background: T.bg }}>
                      <input value={newRuleText.title} onChange={(event) => setNewRuleText((previous) => ({ ...previous, title: event.target.value }))} placeholder="Rule title..." style={{ ...inputStyle, marginBottom: 8 }} />
                      <textarea value={newRuleText.detail} onChange={(event) => setNewRuleText((previous) => ({ ...previous, detail: event.target.value }))} placeholder="Describe the rule in detail..." rows={2} style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn variant="primary" small onClick={() => addRule(cat.id)}>
                          Add Rule
                        </Btn>
                        <Btn variant="ghost" small onClick={() => setAddingRuleTo(null)}>
                          Cancel
                        </Btn>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '10px 18px' }}>
                      <button onClick={() => setAddingRuleTo(cat.id)} style={{ background: 'none', border: `1px dashed ${T.borderStrong}`, borderRadius: 7, padding: '5px 12px', color: T.muted, cursor: 'pointer', fontSize: 12, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
                        + Add Rule
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {section === 'checklist' && (
        <div>
          <div style={{ background: T.goldLight, border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '12px 18px', marginBottom: 18, fontSize: 12, color: T.gold }}>
            Use this checklist at the start of each shift to confirm all team members have completed their sidework.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${isMobile ? 240 : 340}px,1fr))`, gap: 14 }}>
            {roles.map((entry) => {
              const { done, total, pct } = roleProgress(entry);
              return (
                <div key={entry.id} style={{ background: '#FFF', border: `1px solid ${pct === 100 ? entry.colorBorder : T.border}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .3s' }}>
                  <div style={{ padding: '12px 16px', background: pct === 100 ? entry.colorLight : T.bg, borderBottom: `1px solid ${pct === 100 ? entry.colorBorder : T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background .3s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{entry.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: pct === 100 ? entry.color : T.text }}>{entry.label}</span>
                      {pct === 100 && <span style={{ fontSize: 11, color: entry.color }}>All done</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 4, background: T.border, borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: entry.color, borderRadius: 2, transition: 'width .3s' }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: T.muted }}>{done}/{total}</span>
                    </div>
                  </div>
                  {['Opening', 'During Service', 'Closing'].map((period) => {
                    const periodTasks = entry.sidework.filter((task) => task.when === period);
                    if (!periodTasks.length) return null;
                    const colors = WHEN_COLORS[period];
                    return (
                      <div key={period}>
                        <div style={{ padding: '6px 16px', background: colors.bg, borderBottom: `1px solid ${T.border}` }}>
                          <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: colors.dot, letterSpacing: 0.8 }}>{period.toUpperCase()}</span>
                        </div>
                        {periodTasks.map((task) => {
                          const checked = isChecked(entry.id, task.id);
                          return (
                            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: checked ? entry.colorLight : '#FFF', transition: 'background .15s' }} onClick={() => toggleCheck(entry.id, task.id)}>
                              <div style={{ width: 16, height: 16, minWidth: 16, border: `2px solid ${checked ? entry.color : T.border}`, borderRadius: 3, background: checked ? entry.color : '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                                {checked && <span style={{ color: '#FFF', fontSize: 10 }}>x</span>}
                              </div>
                              <span style={{ fontSize: 12, color: checked ? T.muted : T.text, textDecoration: checked ? 'line-through' : 'none', userSelect: 'none' }}>{task.task}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <Btn variant="ghost" onClick={() => setCheckedTasks({})}>
              Reset All Checkboxes
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

