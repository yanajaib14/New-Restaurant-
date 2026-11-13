import React, { useState } from 'react';
import { T } from '../types';
import { Btn } from './UI';
import { Trash2 } from 'lucide-react';

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

const DRAFT_KEY = 'restaurant_team_onboarding_shared_draft_v1';
const EMPTY_RECORD = { id: 1, roles: [] as RoleCard[], rule_categories: [] as RuleCategory[], completion: {} as Record<string, boolean> };
const normalizeRecord = (record: any) => ({
  id: 1,
  roles: Array.isArray(record?.roles) ? record.roles : [],
  rule_categories: Array.isArray(record?.rule_categories) ? record.rule_categories : [],
  completion: record?.completion && typeof record.completion === 'object' ? record.completion : {},
});

export function TeamOnboarding({ record, onSave, loadError }: { record: any | null; onSave: (payload: any) => Promise<boolean>; loadError?: string }) {
  const isMobile = window.innerWidth < 1024;
  const [section, setSection] = useState<'roles' | 'rules' | 'checklist'>('roles');
  const [data, setData] = useState(() => normalizeRecord(record ?? EMPTY_RECORD));
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [whenFilter, setWhenFilter] = useState('All');
  const [pending, setPending] = useState(false);
  const pendingRef = React.useRef(false);
  const [saveError, setSaveError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [remoteRecord, setRemoteRecord] = useState<any | null>(null);
  const lastRecordRef = React.useRef(JSON.stringify(normalizeRecord(record ?? EMPTY_RECORD)));
  const pendingPayloadRef = React.useRef<string | null>(null);
  const editVersionRef = React.useRef(0);
  const [recoveryDraft, setRecoveryDraft] = useState<any | null>(null);
  const [roleDraft, setRoleDraft] = useState({ label: '', icon: '', description: '' });
  const [taskDraft, setTaskDraft] = useState({ task: '', when: 'Opening', detail: '' });
  const [categoryDraft, setCategoryDraft] = useState({ category: '', icon: '' });
  const [ruleDraft, setRuleDraft] = useState({ title: '', detail: '' });
  const [legacyReview, setLegacyReview] = useState(false);

  React.useEffect(() => {
    const incoming = normalizeRecord(record ?? EMPTY_RECORD);
    const fingerprint = JSON.stringify(incoming);
    if (fingerprint === lastRecordRef.current) return;
    lastRecordRef.current = fingerprint;
    if (pendingRef.current && pendingPayloadRef.current === fingerprint) {
      setRemoteRecord(null);
      return;
    }
    if (dirty || pendingRef.current) {
      setRemoteRecord(incoming);
      return;
    }
    setData(incoming);
    setRemoteRecord(null);
  }, [record, dirty]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) setRecoveryDraft(normalizeRecord(JSON.parse(raw)));
    } catch { /* Ignore invalid local recovery data. */ }
  }, []);

  const update = (change: (current: typeof data) => typeof data) => {
    editVersionRef.current += 1;
    setData(current => change(current));
    setDirty(true);
    setSaveError('');
  };
  const saveShared = async () => {
    if (pendingRef.current || !dirty) return;
    pendingRef.current = true;
    setPending(true);
    setSaveError('');
    const payload = { id: 1, roles: data.roles, rule_categories: data.rule_categories, completion: data.completion };
    const payloadFingerprint = JSON.stringify(normalizeRecord(payload));
    const saveVersion = editVersionRef.current;
    pendingPayloadRef.current = payloadFingerprint;
    try {
      if (await onSave(payload) !== true) throw new Error('Could not save shared onboarding. Your draft is kept on this device.');
      window.localStorage.removeItem(DRAFT_KEY);
      setRecoveryDraft(null);
      if (editVersionRef.current === saveVersion) {
        setDirty(false);
        setRemoteRecord(current => current && JSON.stringify(normalizeRecord(current)) === payloadFingerprint ? null : current);
      }
    } catch (error) {
      try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload)); } catch { /* Keep the in-memory draft. */ }
      setSaveError(error instanceof Error ? error.message : 'Could not save shared onboarding. Your draft is kept on this device.');
    } finally {
      pendingPayloadRef.current = null;
      pendingRef.current = false;
      setPending(false);
    }
  };
  const restoreDraft = () => {
    if (!recoveryDraft) return;
    editVersionRef.current += 1;
    setData(normalizeRecord(recoveryDraft));
    setDirty(true);
    setRecoveryDraft(null);
  };
  const reloadRemoteRecord = () => {
    if (!remoteRecord) return;
    editVersionRef.current += 1;
    setData(normalizeRecord(remoteRecord));
    setDirty(false);
    setRemoteRecord(null);
    setSaveError('');
  };
  const addRole = () => {
    if (!roleDraft.label.trim()) return;
    const id = `role-${Date.now()}`;
    const role: RoleCard = { id, label: roleDraft.label.trim(), icon: roleDraft.icon.trim(), color: T.blue, colorLight: T.blueLight, colorBorder: T.blueBorder, description: roleDraft.description.trim(), sidework: [] };
    update(current => ({ ...current, roles: [...current.roles, role] }));
    setActiveRoleId(id);
    setRoleDraft({ label: '', icon: '', description: '' });
  };
  const addTask = (roleId: string) => {
    if (!taskDraft.task.trim()) return;
    update(current => ({ ...current, roles: current.roles.map(role => role.id === roleId ? { ...role, sidework: [...role.sidework, { id: Date.now(), ...taskDraft, task: taskDraft.task.trim() }] } : role) }));
    setTaskDraft({ task: '', when: 'Opening', detail: '' });
  };
  const addCategory = () => {
    if (!categoryDraft.category.trim()) return;
    update(current => ({ ...current, rule_categories: [...current.rule_categories, { id: Date.now(), ...categoryDraft, category: categoryDraft.category.trim(), rules: [] }] }));
    setCategoryDraft({ category: '', icon: '' });
  };
  const addRule = (categoryId: number) => {
    if (!ruleDraft.title.trim()) return;
    update(current => ({ ...current, rule_categories: current.rule_categories.map(category => category.id === categoryId ? { ...category, rules: [...category.rules, { id: Date.now(), ...ruleDraft, title: ruleDraft.title.trim() }] } : category) }));
    setRuleDraft({ title: '', detail: '' });
  };
  const toggleCompletion = (roleId: string, taskId: string | number) => {
    const key = `${roleId}:${taskId}`;
    update(current => ({ ...current, completion: { ...current.completion, [key]: !current.completion[key] } }));
  };
  const role = data.roles.find(item => item.id === activeRoleId) ?? data.roles[0];
  const inputStyle: React.CSSProperties = { width: '100%', background: '#FAFAFA', border: `1px solid ${T.border}`, borderRadius: 7, padding: '8px 11px', color: T.text, fontSize: 12, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" };
  const cardStyle: React.CSSProperties = { background: '#FFF', border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 };
  const actionStyle: React.CSSProperties = { background: '#FFF', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 7px', color: T.muted, cursor: 'pointer' };

  return <div className="fu">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
      <div><h2 style={{ fontSize: 24, margin: 0, color: T.text }}>Team Onboarding</h2><p style={{ color: T.muted, fontSize: 13, margin: '5px 0 0' }}>Manage shared roles, sidework, rule categories, rules, and completion.</p></div>
      <Btn onClick={() => void saveShared()} variant="primary" disabled={pending || !dirty}>{pending ? 'Saving…' : 'Save shared changes'}</Btn>
    </div>
    {loadError && <p role="alert" style={{ color: T.red, background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 8, padding: 10 }}>{loadError} Editing is still available; shared changes can be saved when the connection recovers.</p>}
    {saveError && <p role="alert" style={{ color: T.red, background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 8, padding: 10 }}>{saveError}</p>}
    {remoteRecord && <div role="status" style={{ ...cardStyle, marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ flex: 1 }}>Shared onboarding changed elsewhere while you have local edits. Your current draft is preserved.</span><Btn small variant="outline" onClick={() => setRemoteRecord(null)}>Keep my draft</Btn><Btn small variant="danger" onClick={reloadRemoteRecord}>Reload shared data and discard my draft</Btn></div>}
    {recoveryDraft && <div role="status" style={{ ...cardStyle, marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ flex: 1 }}>A saved draft from a previous unsuccessful save is available on this device.</span><Btn small variant="primary" onClick={restoreDraft}>Restore draft</Btn><Btn small variant="ghost" onClick={() => { window.localStorage.removeItem(DRAFT_KEY); setRecoveryDraft(null); }}>Discard draft</Btn></div>}
    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
      {([['roles', 'Roles & Sidework'], ['rules', 'Rules'], ['checklist', 'Completion']] as const).map(([id, label]) => <button key={id} onClick={() => setSection(id)} style={{ ...actionStyle, padding: '8px 14px', background: section === id ? T.goldLight : '#FFF', fontWeight: section === id ? 700 : 500 }}>{label}</button>)}
    </div>
    {section === 'roles' && <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '230px 1fr', gap: 14 }}>
      <aside style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'start' }}>
        <strong>Roles</strong>{data.roles.map(item => <div key={item.id} style={{ display: 'flex', gap: 6 }}><button onClick={() => setActiveRoleId(item.id)} style={{ ...actionStyle, textAlign: 'left', flex: 1, background: (role?.id === item.id) ? T.goldLight : '#FFF' }}>{item.icon} {item.label}</button><button aria-label={`Delete ${item.label}`} onClick={() => update(current => ({ ...current, roles: current.roles.filter(entry => entry.id !== item.id) }))} style={actionStyle}><Trash2 size={13}/></button></div>)}
        {!data.roles.length && <span style={{ color: T.muted, fontSize: 12 }}>No roles defined.</span>}
        <input placeholder="Role title" value={roleDraft.label} onChange={e => setRoleDraft(p => ({ ...p, label: e.target.value }))} style={inputStyle}/><div style={{ display: 'flex', gap: 6 }}><input aria-label="Role icon" placeholder="Icon" value={roleDraft.icon} onChange={e => setRoleDraft(p => ({ ...p, icon: e.target.value }))} style={{ ...inputStyle, width: 65 }}/><input placeholder="Short description" value={roleDraft.description} onChange={e => setRoleDraft(p => ({ ...p, description: e.target.value }))} style={inputStyle}/></div><Btn small variant="outline" onClick={addRole}>Add role</Btn>
      </aside>
      {role ? <section style={{ ...cardStyle }}><div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}><span style={{ fontSize: 22 }}>{role.icon}</span><input aria-label="Role title" value={role.label} onChange={e => update(current => ({ ...current, roles: current.roles.map(entry => entry.id === role.id ? { ...entry, label: e.target.value } : entry) }))} style={{ ...inputStyle, fontWeight: 700 }}/><button title="Delete role" onClick={() => update(current => ({ ...current, roles: current.roles.filter(entry => entry.id !== role.id) }))} style={actionStyle}><Trash2 size={14}/></button></div><textarea aria-label="Role description" value={role.description || ''} onChange={e => update(current => ({ ...current, roles: current.roles.map(entry => entry.id === role.id ? { ...entry, description: e.target.value } : entry) }))} rows={2} style={{ ...inputStyle, resize: 'vertical', marginBottom: 12 }}/>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>{['All', 'Opening', 'During Service', 'Closing'].map(when => <button key={when} onClick={() => setWhenFilter(when)} style={{ ...actionStyle, background: whenFilter === when ? T.goldLight : '#FFF' }}>{when}</button>)}</div>
        {(role.sidework || []).filter(task => whenFilter === 'All' || task.when === whenFilter).map(task => { const key = `${role.id}:${task.id}`; const checked = Boolean(data.completion[key]); return <div key={key} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 8, padding: '10px 0', borderTop: `1px solid ${T.border}`, alignItems: 'center' }}><input type="checkbox" checked={checked} onChange={() => toggleCompletion(role.id, task.id)}/><div><input value={task.task} aria-label="Sidework task" onChange={e => update(current => ({ ...current, roles: current.roles.map(entry => entry.id === role.id ? { ...entry, sidework: entry.sidework.map(t => t.id === task.id ? { ...t, task: e.target.value } : t) } : entry) }))} style={inputStyle}/><div style={{ display: 'flex', gap: 6, marginTop: 5 }}><select value={task.when} aria-label="Sidework timing" onChange={e => update(current => ({ ...current, roles: current.roles.map(entry => entry.id === role.id ? { ...entry, sidework: entry.sidework.map(t => t.id === task.id ? { ...t, when: e.target.value } : t) } : entry) }))} style={inputStyle}>{['Opening', 'During Service', 'Closing'].map(when => <option key={when}>{when}</option>)}</select><input value={task.detail} aria-label="Sidework details" placeholder="Details" onChange={e => update(current => ({ ...current, roles: current.roles.map(entry => entry.id === role.id ? { ...entry, sidework: entry.sidework.map(t => t.id === task.id ? { ...t, detail: e.target.value } : t) } : entry) }))} style={inputStyle}/></div></div><button aria-label="Delete sidework" onClick={() => update(current => ({ ...current, roles: current.roles.map(entry => entry.id === role.id ? { ...entry, sidework: entry.sidework.filter(t => t.id !== task.id) } : entry) }))} style={actionStyle}><Trash2 size={13}/></button></div>; })}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 8 }}><input placeholder="New sidework task" value={taskDraft.task} onChange={e => setTaskDraft(p => ({ ...p, task: e.target.value }))} style={{ ...inputStyle, marginBottom: 6 }}/><div style={{ display: 'flex', gap: 6 }}><select value={taskDraft.when} onChange={e => setTaskDraft(p => ({ ...p, when: e.target.value }))} style={inputStyle}>{['Opening', 'During Service', 'Closing'].map(when => <option key={when}>{when}</option>)}</select><input placeholder="Details" value={taskDraft.detail} onChange={e => setTaskDraft(p => ({ ...p, detail: e.target.value }))} style={inputStyle}/><Btn small onClick={() => addTask(role.id)}>Add</Btn></div></div>
      </section> : <div style={{ ...cardStyle, color: T.muted }}>Add a role to define its sidework tasks.</div>}
    </div>}
    {section === 'rules' && <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(220px, 1fr) 2fr', gap: 14 }}><section style={cardStyle}><strong>Rule categories</strong>{data.rule_categories.map(category => <div key={category.id} style={{ display: 'flex', gap: 6, marginTop: 8 }}><input value={category.category} aria-label="Rule category" onChange={e => update(current => ({ ...current, rule_categories: current.rule_categories.map(c => c.id === category.id ? { ...c, category: e.target.value } : c) }))} style={inputStyle}/><button onClick={() => update(current => ({ ...current, rule_categories: current.rule_categories.filter(c => c.id !== category.id) }))} style={actionStyle}><Trash2 size={13}/></button></div>)}<div style={{ display: 'flex', gap: 6, marginTop: 12 }}><input placeholder="New category" value={categoryDraft.category} onChange={e => setCategoryDraft(p => ({ ...p, category: e.target.value }))} style={inputStyle}/><input aria-label="Category icon" placeholder="Icon" value={categoryDraft.icon} onChange={e => setCategoryDraft(p => ({ ...p, icon: e.target.value }))} style={{ ...inputStyle, width: 65 }}/><Btn small onClick={addCategory}>Add</Btn></div></section><section style={cardStyle}><strong>Rules</strong>{data.rule_categories.map(category => <div key={category.id} style={{ borderTop: `1px solid ${T.border}`, marginTop: 10, paddingTop: 10 }}><h3 style={{ margin: 0, fontSize: 14 }}>{category.icon} {category.category}</h3>{category.rules.map(rule => <div key={rule.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '8px 0' }}><div><input value={rule.title} aria-label="Rule title" onChange={e => update(current => ({ ...current, rule_categories: current.rule_categories.map(c => c.id === category.id ? { ...c, rules: c.rules.map(r => r.id === rule.id ? { ...r, title: e.target.value } : r) } : c) }))} style={{ ...inputStyle, marginBottom: 5 }}/><textarea value={rule.detail} aria-label="Rule details" onChange={e => update(current => ({ ...current, rule_categories: current.rule_categories.map(c => c.id === category.id ? { ...c, rules: c.rules.map(r => r.id === rule.id ? { ...r, detail: e.target.value } : r) } : c) }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }}/></div><button aria-label="Delete rule" onClick={() => update(current => ({ ...current, rule_categories: current.rule_categories.map(c => c.id === category.id ? { ...c, rules: c.rules.filter(r => r.id !== rule.id) } : c) }))} style={actionStyle}><Trash2 size={13}/></button></div>)}<div style={{ display: 'flex', gap: 6 }}><input placeholder="Rule title" value={ruleDraft.title} onChange={e => setRuleDraft(p => ({ ...p, title: e.target.value }))} style={inputStyle}/><input placeholder="Rule details" value={ruleDraft.detail} onChange={e => setRuleDraft(p => ({ ...p, detail: e.target.value }))} style={inputStyle}/><Btn small onClick={() => addRule(category.id)}>Add rule</Btn></div></div>)}{!data.rule_categories.length && <p style={{ color: T.muted, fontSize: 12 }}>No rule categories or policies are preloaded.</p>}</section></div>}
    {section === 'checklist' && <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${isMobile ? 250 : 340}px,1fr))`, gap: 12 }}>{data.roles.map(entry => { const tasks = entry.sidework || []; const done = tasks.filter(task => data.completion[`${entry.id}:${task.id}`]).length; return <section key={entry.id} style={cardStyle}><h3 style={{ margin: '0 0 8px' }}>{entry.icon} {entry.label} <small style={{ color: T.muted }}>{done}/{tasks.length}</small></h3>{tasks.map(task => { const key = `${entry.id}:${task.id}`; return <label key={key} style={{ display: 'flex', gap: 8, padding: '6px 0', borderTop: `1px solid ${T.border}` }}><input type="checkbox" checked={Boolean(data.completion[key])} onChange={() => toggleCompletion(entry.id, task.id)}/><span>{task.task}</span></label>; })}{!tasks.length && <p style={{ color: T.muted, fontSize: 12 }}>No sidework defined.</p>}</section>; })}{!data.roles.length && <div style={{ ...cardStyle, color: T.muted }}>Completion appears here after roles and sidework are defined.</div>}</div>}
    <div style={{ marginTop: 20, ...cardStyle }}><button onClick={() => setLegacyReview(value => !value)} style={{ ...actionStyle, fontWeight: 700 }}>Review legacy sample definitions ({INIT_ROLES.length} roles, {INIT_HOUSE_RULES.length} categories) {legacyReview ? '−' : '+'}</button><p style={{ color: T.muted, fontSize: 12, marginBottom: 0 }}>These are old illustrative samples, not approved house policy. They are never imported automatically.</p>{legacyReview && <div style={{ marginTop: 12 }}><p style={{ fontSize: 12, color: T.muted }}>Review every definition before importing. Import adds copies to your current draft; save shared changes to publish them.</p><div style={{ maxHeight: 420, overflow: 'auto', fontSize: 12, marginBottom: 10 }}>{INIT_ROLES.map(item => <section key={item.id} style={{ borderTop: `1px solid ${T.border}`, padding: '8px 0' }}><strong>Role: {item.label}</strong><p>{item.description}</p>{item.sidework.map(task => <div key={task.id} style={{ margin: '6px 0 6px 12px' }}><strong>{task.when}: {task.task}</strong><div>{task.detail}</div></div>)}</section>)}{INIT_HOUSE_RULES.map(category => <section key={category.id} style={{ borderTop: `1px solid ${T.border}`, padding: '8px 0' }}><strong>Rule category: {category.category}</strong>{category.rules.map(rule => <div key={rule.id} style={{ margin: '6px 0 6px 12px' }}><strong>{rule.title}</strong><div>{rule.detail}</div></div>)}</section>)}</div><Btn variant="outline" onClick={() => { update(current => ({ ...current, roles: [...current.roles, ...INIT_ROLES.map(item => ({ ...item, id: `${item.id}-${Date.now()}`, sidework: item.sidework.map(task => ({ ...task, id: `${task.id}-${Date.now()}` })) }))], rule_categories: [...current.rule_categories, ...INIT_HOUSE_RULES.map(item => ({ ...item, id: Date.now() + item.id, rules: item.rules.map(rule => ({ ...rule, id: Date.now() + rule.id })) }))] })); setLegacyReview(false); }}>Import reviewed samples into draft</Btn></div>}</div>
  </div>;
}
