import React, { useState } from 'react';
import { T, WHEN_COLORS } from '../types';
import { Btn } from './UI';

const INIT_HOUSE_RULES = [
  { id: 1, category: "Attendance & Punctuality", icon: "A", rules: [
    { id: 101, title: "Arrive 15 Minutes Early", detail: "All staff must clock in ready to work � not arriving � 15 minutes before their scheduled shift. Lateness without prior notice is subject to disciplinary action." },
    { id: 102, title: "Call-Out Policy", detail: "If you cannot make your shift, you must notify management at least 4 hours in advance by phone call � texts alone are not accepted. Failure to show without notice (no-call/no-show) may result in termination." },
    { id: 103, title: "Shift Swaps", detail: "All shift swaps must be approved by a manager in writing (text or email). You are responsible for your shift until a manager confirms the swap." },
  ]},
  { id: 2, category: "Uniform & Appearance", icon: "�x", rules: [
    { id: 201, title: "Dress Code", detail: "All FOH staff must wear the designated uniform: black non-slip shoes, black pants or skirt (no jeans), and the provided restaurant shirt. BOH staff: chef coat or kitchen blacks, non-slip shoes mandatory." },
    { id: 202, title: "Grooming Standards", detail: "Hair must be tied back for all kitchen staff. Jewelry must be minimal and tasteful for FOH. No strong perfumes or colognes � we work with food." },
    { id: 203, title: "Name Badges", detail: "Name badges must be worn at all times while on the floor. This builds guest trust and is part of the brand experience." },
  ]},
  { id: 3, category: "Guest Service Standards", icon: "⭐", rules: [
    { id: 301, title: "Greet Within 60 Seconds", detail: "Every guest who enters must be acknowledged within 60 seconds � eye contact, a smile, and a greeting. Even if you're busy, a brief acknowledgment prevents guests from feeling ignored." },
    { id: 302, title: "No Personal Phones on the Floor", detail: "Personal phones are strictly prohibited on the dining floor or bar during service. Phones may only be used during breaks in designated staff areas." },
    { id: 303, title: "Guest Complaints", detail: "Never argue with a guest. Acknowledge, apologize, and find a solution. If you cannot resolve the issue, immediately involve a manager. The guest is always right � even when they are not." },
    { id: 304, title: "Table Visits & Check-Backs", detail: "Check back within 2 minutes of delivering food. Always ask: 'Is there anything else I can get for you?' before walking away." },
  ]},
  { id: 4, category: "Food Safety & Hygiene", icon: "�x��", rules: [
    { id: 401, title: "Handwashing", detail: "Wash hands for a minimum of 20 seconds: after using the restroom, after handling raw proteins, after touching your face or phone, and after taking out trash. No exceptions." },
    { id: 402, title: "Temperature Logs", detail: "BOH staff must log hot and cold holding temperatures every 2 hours. Hot food must be held above 140°F; cold food below 40°F. Out-of-range readings must be reported to a manager immediately." },
    { id: 403, title: "FIFO � First In, First Out", detail: "All food products must be rotated using FIFO. Older products go in front, newer in back. Every item in the walk-in must be labeled with date and contents." },
    { id: 404, title: "No Eating on the Line", detail: "Staff meals must be eaten before or after service, in the designated break area. No tasting directly from the line during service." },
  ]},
  { id: 5, category: "Cash & POS Procedures", icon: "�x�", rules: [
    { id: 501, title: "No Voids Without Manager Approval", detail: "Any void, comp, or discount over $10 requires manager approval. Unauthorized voids are a terminable offense." },
    { id: 502, title: "Cash Handling", detail: "Count your bank at the start and end of every shift. Any discrepancy over $5 must be reported to a manager before leaving. Never leave your drawer open unattended." },
    { id: 503, title: "Tip Reporting", detail: "All tips must be reported accurately. Tip pooling or tip-out procedures follow state law and the house policy outlined in your onboarding packet." },
  ]},
  { id: 6, category: "Communication & Teamwork", icon: "�x��", rules: [
    { id: 601, title: "Respect in the Workplace", detail: "Harassment, discrimination, or bullying of any kind � toward coworkers or guests � will result in immediate termination. This is a zero-tolerance policy." },
    { id: 602, title: "Kitchen Communication", detail: "Always use clear, verbal callouts in the kitchen: '86'd items', 'hot behind', 'sharp', 'corner'. Kitchen communication prevents accidents and keeps service smooth." },
    { id: 603, title: "Problems Go Up, Not Around", detail: "If you have an issue � with a coworker, a policy, or a guest situation � bring it to a manager directly. Do not vent to coworkers on the floor." },
  ]},
];

const INIT_ROLES = [
  { id: "server", label: "Server", icon: "�x��️", color: T.blue, colorLight: T.blueLight, colorBorder: T.blueBorder,
    description: "Servers are the face of the guest experience. You own your tables from greeting to farewell.",
    sidework: [
      { id: "s1", task: "Polish glassware & silverware", when: "Opening", detail: "Hold glassware over hot steam, polish with lint-free cloth until spotless. Silverware rolled in napkins � no water spots." },
      { id: "s2", task: "Set all tables", when: "Opening", detail: "Full cover setup: charger, napkin fold, water glass, bread plate, fork/knife/spoon placement per house diagram." },
      { id: "s3", task: "Restock server stations", when: "Opening", detail: "Ensure stations have: straws, sugar caddies, salt/pepper, sweeteners, extra napkins, and to-go containers." },
      { id: "s4", task: "Check POS assignments & table map", when: "Opening", detail: "Know your section. Confirm table numbers and any 86'd items with the kitchen before service begins." },
      { id: "s5", task: "Clean & restock tables after each turn", when: "During Service", detail: "Clear within 3 minutes of guests leaving. Full reset before next seating � no crumbs, clean condiments." },
      { id: "s6", task: "Marry condiments & refill sugar caddies", when: "Closing", detail: "Combine matching sauces (never mix brands). Refill all sugar caddies. Wipe down all condiment bottles." },
      { id: "s7", task: "Break down & clean station", when: "Closing", detail: "Empty ice bins, wipe down entire station including shelves, restock for AM crew." },
      { id: "s8", task: "Sweep section & wipe tables", when: "Closing", detail: "Sweep under tables and around chairs. Wipe down all table surfaces and chair backs." },
    ]
  },
  { id: "bartender", label: "Bartender", icon: "�x��", color: T.purple, colorLight: T.purpleLight, colorBorder: T.purpleBorder,
    description: "Bartenders run the bar program, maintain the guest experience at the bar, and support the floor with drink tickets.",
    sidework: [
      { id: "b1", task: "Bar setup & mise en place", when: "Opening", detail: "Prep all garnishes: citrus cuts, cherries, olives, herbs. Fill ice well to top. Set out speed pourers, bar mats, coasters." },
      { id: "b2", task: "Check liquor par levels", when: "Opening", detail: "Count and verify all bottles against par sheet. Pull from storage and rotate stock using FIFO. Flag any low stock to manager." },
      { id: "b3", task: "Verify beer lines & draft system", when: "Opening", detail: "Run a pour from each tap. Check for off-flavors. Clean drip trays and replace liners." },
      { id: "b4", task: "Stock glassware", when: "Opening", detail: "All glassware polished and stacked. Rocks, highball, wine, martini, pint � all positions filled." },
      { id: "b5", task: "Maintain bar cleanliness during service", when: "During Service", detail: "Wipe bar top every 20 minutes. Clear empty glasses immediately. Keep well area organized and clean." },
      { id: "b6", task: "Break down garnish station", when: "Closing", detail: "Wrap and date all cut garnishes. Discard anything past 24 hours. Sanitize garnish trays." },
      { id: "b7", task: "Clean speed pourers & jiggers", when: "Closing", detail: "Remove all speed pourers, soak in hot water, rinse, dry. Sanitize jiggers and bar tools." },
      { id: "b8", task: "Wipe down & sanitize full bar", when: "Closing", detail: "Back bar, speed rail, underbar, taps, drip trays. Mop behind bar. Count and record drawer." },
    ]
  },
  { id: "host", label: "Host / Hostess", icon: "�xa�", color: T.green, colorLight: T.greenLight, colorBorder: T.greenBorder,
    description: "Hosts set the tone for the entire guest experience from the first moment they arrive.",
    sidework: [
      { id: "h1", task: "Inspect dining room before open", when: "Opening", detail: "Walk every table: check setting, cleanliness, chair alignment, lighting levels. Report anything off to manager." },
      { id: "h2", task: "Print & review reservation sheet", when: "Opening", detail: "Know all reservations, special occasions (birthdays/anniversaries), VIPs, and large parties for the shift." },
      { id: "h3", task: "Set up host stand", when: "Opening", detail: "Restock menus (clean, no torn pages), to-go menus, business cards, loyalty cards, waitlist clipboard." },
      { id: "h4", task: "Manage waitlist & quote accurate wait times", when: "During Service", detail: "Never quote under � underpromise and overdeliver. Update guests every 10 minutes if wait exceeds estimate." },
      { id: "h5", task: "Communicate table turns with servers", when: "During Service", detail: "Give servers 2-minute warning before seating. Never drop guests without server awareness." },
      { id: "h6", task: "Clean & organize host stand", when: "Closing", detail: "Wipe down stand, organize menus, count and report any damaged menus. Restock all collateral." },
      { id: "h7", task: "Wipe down entrance & front windows", when: "Closing", detail: "Front door glass cleaned, entry mat shaken out, any retail display organized." },
    ]
  },
  { id: "busser", label: "Busser / Food Runner", icon: "�x��", color: T.orange, colorLight: T.orangeLight, colorBorder: T.orangeBorder,
    description: "Bussers and food runners are the engine of service � speed, accuracy, and teamwork are your superpowers.",
    sidework: [
      { id: "br1", task: "Stock side stations", when: "Opening", detail: "Fill all bus tubs. Restock: napkins, straws, condiments, extra silverware rolls. Check every station has a spray bottle and towel." },
      { id: "br2", task: "Pre-bus tables during service", when: "During Service", detail: "Clear empty plates, refill water, remove any clutter. Never let a table look abandoned � always be visible and moving." },
      { id: "br3", task: "Run food accurately & promptly", when: "During Service", detail: "Confirm table number and seat position before leaving expo. Use 'tray jack' for large runs. Announce each dish clearly." },
      { id: "br4", task: "Communicate with servers & kitchen", when: "During Service", detail: "Call out 'running 4' when picking up. Alert servers when food is up. Never leave expo without confirming the full ticket." },
      { id: "br5", task: "Deep clean bus stations", when: "Closing", detail: "Empty, wash, and sanitize all bus tubs. Wipe down station shelves and walls. Restock for AM." },
      { id: "br6", task: "Sweep & mop dining room", when: "Closing", detail: "Sweep entire floor including under booths. Mop in sections, moving chairs. Mop storage area last." },
      { id: "br7", task: "Break down linen & restock napkins", when: "Closing", detail: "Pull all used linens to laundry bag. Roll silverware into clean napkins for AM opening count." },
    ]
  },
  { id: "line_cook", label: "Line Cook", icon: "�x�⬍�x��", color: T.red, colorLight: T.redLight, colorBorder: T.redBorder,
    description: "Line cooks are responsible for food quality, station prep, and kitchen cleanliness. Consistency is everything.",
    sidework: [
      { id: "lc1", task: "Station setup & mise en place", when: "Opening", detail: "Every item prepped, labeled, dated, and at the correct temperature before first ticket. No shortcuts on mise en place." },
      { id: "lc2", task: "Review prep list & 86 items", when: "Opening", detail: "Check the prep list. Know what's low or unavailable. Communicate any 86s to expo and FOH immediately." },
      { id: "lc3", task: "Temperature checks", when: "Opening", detail: "Log all hot and cold holding temps. Hot above 140°F, cold below 40°F. Record in the temperature log." },
      { id: "lc4", task: "Maintain station cleanliness during service", when: "During Service", detail: "Wipe down station every 30 minutes. No standing water. Keep cutting boards sanitized between uses." },
      { id: "lc5", task: "Break down & clean station", when: "Closing", detail: "Empty and sanitize all hotel pans. Wrap and label all ingredients with name + date. Clean behind and under equipment." },
      { id: "lc6", task: "Clean grill, flat top & fryers", when: "Closing", detail: "Scrape grill and flat top while warm. Clean fryer baskets. Change fryer oil per schedule. Degrease all surfaces." },
      { id: "lc7", task: "Take out trash & replace liners", when: "Closing", detail: "All trash cans emptied and relined. Trash consolidated and taken to dumpster. Grease trap checked." },
      { id: "lc8", task: "Sweep & mop station & walk-in area", when: "Closing", detail: "Sweep entire kitchen including under equipment. Mop with sanitizer solution. Walk-in threshold swept clean." },
    ]
  },
  { id: "dishwasher", label: "Dishwasher", icon: "�x��", color: "#4A9AA8", colorLight: "#EEF8FA", colorBorder: "#B0DBE2",
    description: "Dishwashers keep the entire operation moving. Without a clean dish, nothing gets served.",
    sidework: [
      { id: "d1", task: "Check dish machine & chemical levels", when: "Opening", detail: "Run a test cycle. Confirm sanitizer and detergent levels. Check rinse temperature reaches 180°F (high temp) or sanitizer ppm is correct (low temp)." },
      { id: "d2", task: "Set up dish station", when: "Opening", detail: "Pre-soak bins ready. Scrape table set. Clean drying rack. Storage area cleared for incoming clean dishes." },
      { id: "d3", task: "Run continuous during service", when: "During Service", detail: "Nothing piles up. Prioritize glassware and cooking equipment needed by bar and kitchen. Communicate when running low on anything." },
      { id: "d4", task: "Empty and sanitize dish machine", when: "Closing", detail: "Run final cycle empty. Open door, wipe interior, clean strainer baskets. Leave door open overnight." },
      { id: "d5", task: "Clean all floor drains", when: "Closing", detail: "Remove drain covers, clean out debris, sanitize covers. Drains must be clear � never clogged." },
      { id: "d6", task: "Degrease and sanitize entire dish area", when: "Closing", detail: "Walls, hood, drying racks, pre-soak bins. Use degreaser on walls and hood filters." },
      { id: "d7", task: "Final sweep & mop", when: "Closing", detail: "Sweep entire dish pit. Mop with hot water and sanitizer. Check corners and under dish machine." },
    ]
  },
];

export function TeamOnboarding() {
  const isMobile = window.innerWidth < 1024;
  const [section, setSection] = useState("roles");   // "roles" | "rules" | "checklist"
  const [activeRole, setActiveRole] = useState("server");
  const [activeCat, setActiveCat] = useState<any>(null);
  const [expandedRule, setExpandedRule] = useState<any>(null);
  const [expandedTask, setExpandedTask] = useState<any>(null);
  const [whenFilter, setWhenFilter] = useState("All");
  const [checkedTasks, setCheckedTasks] = useState<any>({});
  const [editingRule, setEditingRule] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [houseRules, setHouseRules] = useState(INIT_HOUSE_RULES);
  const [roles, setRoles] = useState(INIT_ROLES);
  const [newRuleText, setNewRuleText] = useState({ title: "", detail: "" });
  const [newTaskText, setNewTaskText] = useState({ task: "", when: "Opening", detail: "" });
  const [addingRuleTo, setAddingRuleTo] = useState<any>(null);
  const [addingTaskTo, setAddingTaskTo] = useState<any>(null);

  const role = roles.find(r => r.id === activeRole);
  const filteredSidework = role ? (whenFilter === "All" ? role.sidework : role.sidework.filter(t => t.when === whenFilter)) : [];

  const toggleCheck = (roleId: string, taskId: string) => {
    const key = `${roleId}:${taskId}`;
    setCheckedTasks((p: any) => ({ ...p, [key]: !p[key] }));
  };
  const isChecked = (roleId: string, taskId: string) => !!checkedTasks[`${roleId}:${taskId}`];
  const roleProgress = (r: any) => {
    const total = r.sidework.length;
    const done = r.sidework.filter((t: any) => isChecked(r.id, t.id)).length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  const saveRule = (catId: number, rule: any) => {
    setHouseRules(p => p.map(cat => cat.id === catId
      ? { ...cat, rules: cat.rules.map(r => r.id === rule.id ? rule : r) }
      : cat
    ));
    setEditingRule(null);
  };
  const addRule = (catId: number) => {
    if (!newRuleText.title.trim()) return;
    setHouseRules(p => p.map(cat => cat.id === catId
      ? { ...cat, rules: [...cat.rules, { id: Date.now(), ...newRuleText }] }
      : cat
    ));
    setNewRuleText({ title: "", detail: "" });
    setAddingRuleTo(null);
  };
  const deleteRule = (catId: number, ruleId: number) => {
    setHouseRules(p => p.map(cat => cat.id === catId
      ? { ...cat, rules: cat.rules.filter(r => r.id !== ruleId) }
      : cat
    ));
  };

  const addTask = (roleId: string) => {
    if (!newTaskText.task.trim()) return;
    setRoles(p => p.map(r => r.id === roleId
      ? { ...r, sidework: [...r.sidework, { id: Date.now(), ...newTaskText }] }
      : r
    ));
    setNewTaskText({ task: "", when: "Opening", detail: "" } as any);
    setAddingTaskTo(null);
  };
  const deleteTask = (roleId: string, taskId: string) => {
    setRoles(p => p.map(r => r.id === roleId
      ? { ...r, sidework: r.sidework.filter(t => t.id !== taskId) }
      : r
    ));
  };

  const inpS: React.CSSProperties = { width: "100%", background: "#FAFAFA", border: `1px solid ${T.border}`, borderRadius: 7, padding: "8px 11px", color: T.text, fontSize: 12, fontFamily: "'Cormorant Garamond', serif" };

  return (
    <div className="fu">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, margin: "0 0 3px", fontWeight: 700, color: T.text }}>Team Onboarding</h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", color: T.muted, fontSize: 12, margin: 0 }}>House rules, role responsibilities, and sidework checklists for every team member</p>
        </div>
      </div>

      {/* Section toggle */}
      <div style={{ display: "flex", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 3, gap: 3, marginBottom: 22, width: isMobile ? "100%" : "fit-content", overflowX: isMobile ? "auto" : "visible" }}>
        {[["roles", "�x� Roles & Sidework"], ["rules", "�x9 House Rules"], ["checklist", "�S& Shift Checklist"]].map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)}
            style={{ background: section === id ? "#FFF" : "transparent", border: section === id ? `1px solid ${T.borderStrong}` : "1px solid transparent", borderRadius: 8, padding: isMobile ? "8px 12px" : "8px 20px", cursor: "pointer", fontSize: 12, fontFamily: "'Cormorant Garamond', serif", fontWeight: section === id ? 600 : 400, color: section === id ? T.text : T.muted, boxShadow: section === id ? "0 1px 4px rgba(0,0,0,.07)" : "none", transition: "all .15s", whiteSpace: "nowrap", flexShrink: 0 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ���� ROLES & SIDEWORK ���� */}
      {section === "roles" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "220px 1fr", gap: 14 }}>
          {/* Role selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {roles.map(r => {
              const { done, total, pct } = roleProgress(r);
              const active = activeRole === r.id;
              return (
                <button key={r.id} onClick={() => { setActiveRole(r.id); setWhenFilter("All"); setExpandedTask(null); }}
                  style={{ background: active ? "#FFF" : T.bg, border: `1px solid ${active ? r.colorBorder : T.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", textAlign: "left", transition: "all .15s", boxShadow: active ? "0 2px 8px rgba(0,0,0,.06)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: active ? r.color : T.text }}>{r.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 3, background: T.border, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: r.color, borderRadius: 2, transition: "width .3s" }} />
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: T.muted }}>{done}/{total}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Role detail */}
          {role && (
            <div>
              {/* Role header */}
              <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 14 : 20, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 26 }}>{role.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700, color: T.text }}>{role.label}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{role.description}</div>
                  </div>
                </div>
                {/* When filter */}
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {["All", "Opening", "During Service", "Closing"].map(w => {
                    const wc = (WHEN_COLORS as any)[w] || { bg: T.bg, text: T.muted, border: T.border };
                    const active = whenFilter === w;
                    return (
                      <button key={w} onClick={() => setWhenFilter(w)}
                        style={{ cursor: "pointer", borderRadius: 20, padding: "5px 12px", fontSize: 11, fontFamily: "'Cormorant Garamond', serif", border: `1px solid ${active ? wc.text : T.border}`, background: active ? wc.bg : "#FFF", color: active ? wc.text : T.muted, fontWeight: active ? 600 : 400, transition: "all .15s" }}>
                        {w}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidework list */}
              <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                {filteredSidework.map((task, i) => {
                  const checked = isChecked(role.id, task.id);
                  const wc = (WHEN_COLORS as any)[task.when] || WHEN_COLORS["Opening"];
                  const isExp = expandedTask === task.id;
                  const isEdit = editingTask?.id === task.id;
                  return (
                    <div key={task.id} style={{ borderBottom: `1px solid ${T.border}`, background: checked ? T.greenLight : i % 2 === 0 ? "#FFF" : T.bg }}>
                      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 12, padding: isMobile ? "11px 12px" : "13px 18px" }}>
                        {/* Checkbox */}
                        <button onClick={() => toggleCheck(role.id, task.id)}
                          style={{ width: 20, height: 20, minWidth: 20, border: `2px solid ${checked ? T.green : T.border}`, borderRadius: 4, background: checked ? T.green : "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, transition: "all .15s" }}>
                          {checked && <span style={{ color: "#FFF", fontSize: 12, lineHeight: 1 }}>�S</span>}
                        </button>
                        {/* Task name */}
                        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setExpandedTask(isExp ? null : task.id)}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: checked ? T.muted : T.text, textDecoration: checked ? "line-through" : "none" }}>{task.task}</span>
                            <span style={{ fontSize: 10, fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, padding: "2px 8px", borderRadius: 12, background: wc.bg, color: wc.text, border: `1px solid ${wc.border}` }}>{task.when}</span>
                          </div>
                        </div>
                        {/* Expand / Edit / Delete */}
                        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                          <button onClick={() => setExpandedTask(isExp ? null : task.id)}
                            style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px", color: T.muted, cursor: "pointer", fontSize: 11, transform: isExp ? "rotate(180deg)" : "none", transition: "transform .15s" }}>��</button>
                          <button onClick={() => setEditingTask(isEdit ? null : { ...task, roleId: role.id })}
                            style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>Edit</button>
                          <button onClick={() => deleteTask(role.id, task.id)}
                            style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "3px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>Delete</button>
                        </div>
                      </div>
                      {/* Expanded detail */}
                      {isExp && !isEdit && (
                        <div style={{ padding: isMobile ? "0 12px 12px 44px" : "0 18px 14px 50px", fontSize: 12, color: "#555", lineHeight: 1.7, fontStyle: "italic" }}>{task.detail}</div>
                      )}
                      {/* Edit form */}
                      {isEdit && (
                        <div style={{ padding: isMobile ? "0 12px 12px 44px" : "0 18px 14px 50px" }}>
                          <input value={editingTask.task} onChange={e => setEditingTask((p: any) => ({ ...p, task: e.target.value }))} style={{ ...inpS, marginBottom: 8 }} />
                          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            <select value={editingTask.when} onChange={e => setEditingTask((p: any) => ({ ...p, when: e.target.value }))} style={{ ...inpS, width: isMobile ? "100%" : 160 }}>
                              {["Opening", "During Service", "Closing"].map(w => <option key={w}>{w}</option>)}
                            </select>
                          </div>
                          <textarea value={editingTask.detail} onChange={e => setEditingTask((p: any) => ({ ...p, detail: e.target.value }))} rows={2} style={{ ...inpS, resize: "vertical", marginBottom: 8 }} />
                          <div style={{ display: "flex", gap: 8 }}>
                            <Btn variant="primary" small onClick={() => { setRoles(p => p.map(r => r.id === editingTask.roleId ? { ...r, sidework: r.sidework.map(t => t.id === editingTask.id ? { ...editingTask } : t) } : r)); setEditingTask(null); }}>Save</Btn>
                            <Btn variant="ghost" small onClick={() => setEditingTask(null)}>Cancel</Btn>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Add new task */}
                {addingTaskTo === role.id ? (
                  <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, background: T.bg }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 160px", gap: 8, marginBottom: 8 }}>
                      <input value={newTaskText.task} onChange={e => setNewTaskText(p => ({ ...p, task: e.target.value }))} placeholder="Sidework task name⬦" style={inpS} />
                      <select value={newTaskText.when} onChange={e => setNewTaskText(p => ({ ...p, when: e.target.value }))} style={{ ...inpS, cursor: "pointer" }}>
                        {["Opening", "During Service", "Closing"].map(w => <option key={w}>{w}</option>)}
                      </select>
                    </div>
                    <textarea value={newTaskText.detail} onChange={e => setNewTaskText(p => ({ ...p, detail: e.target.value }))} placeholder="Describe the task in detail⬦" rows={2} style={{ ...inpS, resize: "vertical", marginBottom: 8 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn variant="primary" small onClick={() => addTask(role.id)}>Add Task</Btn>
                      <Btn variant="ghost" small onClick={() => setAddingTaskTo(null)}>Cancel</Btn>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "10px 18px", borderTop: `1px solid ${T.border}` }}>
                    <button onClick={() => setAddingTaskTo(role.id)}
                      style={{ background: "none", border: `1px dashed ${T.borderStrong}`, borderRadius: 7, padding: "6px 14px", color: T.muted, cursor: "pointer", fontSize: 12, fontFamily: "'Cormorant Garamond', serif" }}>+ Add Sidework Task</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ���� HOUSE RULES ���� */}
      {section === "rules" && (
        <div>
          {/* Category filter pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
            <button onClick={() => setActiveCat(null)} style={{ cursor: "pointer", borderRadius: 20, padding: "5px 12px", fontSize: 11, fontFamily: "'Cormorant Garamond', serif", border: `1px solid ${!activeCat ? T.gold : T.border}`, background: !activeCat ? T.goldLight : "#FFF", color: !activeCat ? T.gold : T.muted, fontWeight: !activeCat ? 600 : 400 }}>All Categories</button>
            {houseRules.map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
                style={{ cursor: "pointer", borderRadius: 20, padding: "5px 12px", fontSize: 11, fontFamily: "'Cormorant Garamond', serif", border: `1px solid ${activeCat === cat.id ? T.gold : T.border}`, background: activeCat === cat.id ? T.goldLight : "#FFF", color: activeCat === cat.id ? T.gold : T.muted, fontWeight: activeCat === cat.id ? 600 : 400 }}>
                {cat.icon} {cat.category}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${isMobile ? 260 : 420}px,1fr))`, gap: 14 }}>
            {houseRules.filter(cat => !activeCat || cat.id === activeCat).map(cat => (
              <div key={cat.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                {/* Category header */}
                <div style={{ padding: "14px 18px", background: T.goldLight, borderBottom: `1px solid ${T.goldBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, fontWeight: 700, color: T.text }}>{cat.category}</span>
                    <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: T.muted }}>{cat.rules.length} rules</span>
                  </div>
                </div>
                {/* Rules list */}
                {cat.rules.map((rule, i) => {
                  const isExp = expandedRule === `${cat.id}:${rule.id}`;
                  const isEdit = editingRule?.id === rule.id;
                  return (
                    <div key={rule.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "#FFF" : T.bg }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 18px" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, flexShrink: 0 }} />
                        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setExpandedRule(isExp ? null : `${cat.id}:${rule.id}`)}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{rule.title}</span>
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => setExpandedRule(isExp ? null : `${cat.id}:${rule.id}`)}
                            style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 7px", color: T.muted, cursor: "pointer", fontSize: 11, transform: isExp ? "rotate(180deg)" : "none", transition: "transform .15s" }}>��</button>
                          <button onClick={() => setEditingRule(isEdit ? null : { ...rule, catId: cat.id })}
                            style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 7px", color: T.muted, cursor: "pointer", fontSize: 11 }}>Edit</button>
                          <button onClick={() => deleteRule(cat.id, rule.id)}
                            style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "3px 7px", color: T.red, cursor: "pointer", fontSize: 11 }}>Delete</button>
                        </div>
                      </div>
                      {isExp && !isEdit && (
                        <div style={{ padding: "0 18px 12px 34px", fontSize: 12, color: "#555", lineHeight: 1.7 }}>{rule.detail}</div>
                      )}
                      {isEdit && (
                        <div style={{ padding: "0 18px 12px 34px" }}>
                          <input value={editingRule.title} onChange={e => setEditingRule((p: any) => ({ ...p, title: e.target.value }))} style={{ ...inpS, marginBottom: 8 }} />
                          <textarea value={editingRule.detail} onChange={e => setEditingRule((p: any) => ({ ...p, detail: e.target.value }))} rows={3} style={{ ...inpS, resize: "vertical", marginBottom: 8 }} />
                          <div style={{ display: "flex", gap: 8 }}>
                            <Btn variant="primary" small onClick={() => saveRule(cat.id, { ...editingRule })}>Save</Btn>
                            <Btn variant="ghost" small onClick={() => setEditingRule(null)}>Cancel</Btn>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Add rule inline */}
                {addingRuleTo === cat.id ? (
                  <div style={{ padding: 14, borderTop: `1px solid ${T.border}`, background: T.bg }}>
                    <input value={newRuleText.title} onChange={e => setNewRuleText(p => ({ ...p, title: e.target.value }))} placeholder="Rule title⬦" style={{ ...inpS, marginBottom: 8 }} />
                    <textarea value={newRuleText.detail} onChange={e => setNewRuleText(p => ({ ...p, detail: e.target.value }))} placeholder="Describe the rule in detail⬦" rows={2} style={{ ...inpS, resize: "vertical", marginBottom: 8 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn variant="primary" small onClick={() => addRule(cat.id)}>Add Rule</Btn>
                      <Btn variant="ghost" small onClick={() => setAddingRuleTo(null)}>Cancel</Btn>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "10px 18px" }}>
                    <button onClick={() => setAddingRuleTo(cat.id)} style={{ background: "none", border: `1px dashed ${T.borderStrong}`, borderRadius: 7, padding: "5px 12px", color: T.muted, cursor: "pointer", fontSize: 12, fontFamily: "'Cormorant Garamond', serif" }}>+ Add Rule</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ���� SHIFT CHECKLIST ���� */}
      {section === "checklist" && (
        <div>
          <div style={{ background: T.goldLight, border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: "12px 18px", marginBottom: 18, fontSize: 12, color: T.gold }}>
            �S� Use this checklist at the start of each shift to confirm all team members have completed their sidework. Check off tasks as they are done.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${isMobile ? 240 : 340}px,1fr))`, gap: 14 }}>
            {roles.map(r => {
              const { done, total, pct } = roleProgress(r);
              return (
                <div key={r.id} style={{ background: "#FFF", border: `1px solid ${pct === 100 ? r.colorBorder : T.border}`, borderRadius: 12, overflow: "hidden", transition: "border-color .3s" }}>
                  {/* Role header */}
                  <div style={{ padding: "12px 16px", background: pct === 100 ? r.colorLight : T.bg, borderBottom: `1px solid ${pct === 100 ? r.colorBorder : T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background .3s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{r.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: pct === 100 ? r.color : T.text }}>{r.label}</span>
                      {pct === 100 && <span style={{ fontSize: 11, color: r.color }}>�S All done</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 60, height: 4, background: T.border, borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: r.color, borderRadius: 2, transition: "width .3s" }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: T.muted }}>{done}/{total}</span>
                    </div>
                  </div>
                  {/* Task checklist by period */}
                  {["Opening", "During Service", "Closing"].map(period => {
                    const periodTasks = r.sidework.filter(t => t.when === period);
                    if (!periodTasks.length) return null;
                    const wc = (WHEN_COLORS as any)[period];
                    return (
                      <div key={period}>
                        <div style={{ padding: "6px 16px", background: wc.bg, borderBottom: `1px solid ${wc.border}` }}>
                          <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: wc.text, letterSpacing: .8 }}>{period.toUpperCase()}</span>
                        </div>
                        {periodTasks.map(task => {
                          const checked = isChecked(r.id, task.id);
                          return (
                            <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: checked ? `${r.colorLight}` : "#FFF", transition: "background .15s" }}
                              onClick={() => toggleCheck(r.id, task.id)}>
                              <div style={{ width: 16, height: 16, minWidth: 16, border: `2px solid ${checked ? r.color : T.border}`, borderRadius: 3, background: checked ? r.color : "#FFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                                {checked && <span style={{ color: "#FFF", fontSize: 10 }}>�S</span>}
                              </div>
                              <span style={{ fontSize: 12, color: checked ? T.muted : T.text, textDecoration: checked ? "line-through" : "none", userSelect: "none" }}>{task.task}</span>
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
          {/* Reset button */}
          <div style={{ marginTop: 18, textAlign: "center" }}>
            <Btn variant="ghost" onClick={() => setCheckedTasks({})}>Reset All Checkboxes</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

