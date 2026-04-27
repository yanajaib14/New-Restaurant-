import React, { useState } from 'react';
import { T, Position, Candidate } from '../types';
import { Modal, Field, inpStyle, selStyle, Btn, SectionHeader, Pill } from './UI';
import { Users, FileText, MessageSquare, Plus, Trash2, Edit2, Upload } from 'lucide-react';

export function PositionModal({ position, onSave, onClose, userRole }: { position: Position | null, onSave: (form: Position) => void, onClose: () => void, userRole?: string }) {
  const blank: Position = { id: Date.now(), role: "", openings: 1, hired: 0, status: "Urgent", salary: "", compPlan: "", offerLetterUrl: "" };
  const [form, setForm] = useState<Position>(position ? { ...position } : blank);
  const [isUploading, setIsUploading] = useState(false);
  const isManager = userRole === "Manager";

  const set = (k: keyof Position, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => {
      set("offerLetterUrl", URL.createObjectURL(file));
      setIsUploading(false);
    }, 1000);
  };

  return (
    <Modal title={position ? "Edit Position" : "Add New Position"} onClose={onClose} width={460}>
      <Field label="ROLE NAME">
        <input value={form.role} onChange={e => set("role", e.target.value)} style={inpStyle} placeholder="e.g. Executive Chef" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="OPENINGS">
          <input type="number" value={form.openings} onChange={e => set("openings", parseInt(e.target.value))} style={inpStyle} />
        </Field>
        <Field label="CURRENTLY HIRED">
          <input type="number" value={form.hired} onChange={e => set("hired", parseInt(e.target.value))} style={inpStyle} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {!isManager && (
          <Field label="SALARY / HOURLY RATE">
            <input value={form.salary} onChange={e => set("salary", e.target.value)} style={inpStyle} placeholder="e.g. $25/hr or $75K/yr" />
          </Field>
        )}
        <Field label="STATUS">
          <select value={form.status} onChange={e => set("status", e.target.value as any)} style={selStyle}>
            <option value="Urgent">Urgent</option>
            <option value="Filled">Filled</option>
            <option value="Future">Future</option>
          </select>
        </Field>
      </div>
      <Field label="COMPENSATION PLAN & BENEFITS">
        <textarea 
          value={form.compPlan} 
          onChange={e => set("compPlan", e.target.value)} 
          style={{ ...inpStyle, height: 80, resize: "none", padding: "10px" }} 
          placeholder="e.g. Health insurance, 2 weeks PTO, performance bonus..."
        />
      </Field>
      <Field label="OFFER LETTER TEMPLATE / FILE">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="file" id="offer-up" style={{ display: "none" }} onChange={handleFileUpload} />
          <Btn onClick={() => document.getElementById('offer-up')?.click()} variant="outline" small>
            <Upload size={14} style={{ marginRight: 6 }} />
            {isUploading ? "Uploading..." : form.offerLetterUrl ? "Change Offer Letter" : "Upload Offer Letter"}
          </Btn>
          {form.offerLetterUrl && <span style={{ fontSize: 11, color: T.green }}>Attached</span>}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => onSave(form)} variant="primary">Save Position</Btn>
      </div>
    </Modal>
  );
}

export function CandidateModal({ candidate, initialDate, positions, onSave, onClose, userRole }: { candidate: Candidate | null, initialDate?: string, positions: Position[], onSave: (form: Candidate) => void, onClose: () => void, userRole?: string }) {
  const blank: Candidate = { 
    id: Date.now(), 
    name: "", 
    position: "", 
    stage: "Applied", 
    feedback: "", 
    date: initialDate || "",
    trialScores: { technique: 0, speed: 0, vibe: 0 },
    partnerNotes: ""
  };
  const [form, setForm] = useState<Candidate>(candidate ? { 
    ...candidate, 
    trialScores: candidate.trialScores || { technique: 0, speed: 0, vibe: 0 } 
  } : blank);
  const [isUploading, setIsUploading] = useState(false);
  const isManager = userRole === "Manager";

  const set = (k: keyof Candidate, v: any) => setForm(f => ({ ...f, [k]: v }));
  
  const StarRating = ({ label, value, field }: { label: string, value: number, field: keyof NonNullable<Candidate['trialScores']> }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: T.muted }}>{label}</span>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <button 
            key={s} 
            onClick={() => set("trialScores", { ...form.trialScores, [field]: s })}
            style={{ 
              background: "none", border: "none", color: s <= value ? T.gold : T.border, 
              cursor: "pointer", fontSize: 18, padding: 0, transition: "color .1s" 
            }}
          >
            *
          </button>
        ))}
      </div>
    </div>
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    // Simulate upload
    setTimeout(() => {
      set("resumeUrl", URL.createObjectURL(file));
      setIsUploading(false);
    }, 1000);
  };

  return (
    <Modal title={candidate ? "Edit Candidate" : "New Applicant"} onClose={onClose} width={500}>
      <Field label="CANDIDATE NAME">
        <input value={form.name} onChange={e => set("name", e.target.value)} style={inpStyle} placeholder="Full Name" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="POSITION">
          <select value={form.position} onChange={e => set("position", e.target.value)} style={selStyle}>
            <option value="">Select Position...</option>
            {positions.map(p => <option key={p.id} value={p.role}>{p.role}</option>)}
          </select>
        </Field>
        <Field label="TRIAL / INTERVIEW DATE">
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inpStyle} />
        </Field>
      </div>
      <Field label="RESUME / ATTACHMENT">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="file" id="resume-up" style={{ display: "none" }} onChange={handleFileUpload} />
          <Btn onClick={() => document.getElementById('resume-up')?.click()} variant="outline" small>
            <Upload size={14} style={{ marginRight: 6 }} />
            {isUploading ? "Uploading..." : form.resumeUrl ? "Change Resume" : "Upload Resume"}
          </Btn>
          {form.resumeUrl && <span style={{ fontSize: 11, color: T.green }}>Attached</span>}
        </div>
      </Field>
      <Field label="HIRING STAGE">
        <select value={form.stage} onChange={e => set("stage", e.target.value as any)} style={selStyle}>
          {["Applied", "Interviewed", "Trial Shift", "Hired", "Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      {form.stage === "Trial Shift" && (
        <div style={{ background: T.goldLight, border: `1px solid ${T.goldBorder}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: T.gold, letterSpacing: .8, marginBottom: 12 }}>TRIAL SHIFT SCORECARD</div>
          <StarRating label="TECHNIQUE" value={form.trialScores?.technique || 0} field="technique" />
          <StarRating label="SPEED" value={form.trialScores?.speed || 0} field="speed" />
          <StarRating label="VIBE" value={form.trialScores?.vibe || 0} field="vibe" />
        </div>
      )}

      <Field label="SHARED FEEDBACK (PUBLIC TO PARTNERS)">
        <textarea 
          value={form.feedback} 
          onChange={e => set("feedback", e.target.value)} 
          style={{ ...inpStyle, height: 60, resize: "none", padding: "10px" }} 
          placeholder="General candidate feedback..."
        />
      </Field>

      {!isManager && (
        <Field label="PARTNER NOTES (PRIVATE OWNER DISCUSSION)">
          <textarea 
            value={form.partnerNotes} 
            onChange={e => set("partnerNotes", e.target.value)} 
            style={{ ...inpStyle, height: 60, resize: "none", padding: "10px", background: "#FFFBEB" }} 
            placeholder="Sensitive notes etc..."
          />
        </Field>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        {candidate && (
          <div style={{ marginRight: "auto" }}>
            <Btn onClick={() => onSave({ ...form, _delete: true } as any)} variant="outline" style={{ color: T.red, borderColor: T.redBorder }}>Remove Candidate</Btn>
          </div>
        )}
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => onSave(form)} variant="primary">Save Candidate</Btn>
      </div>
    </Modal>
  );
}

export function TalentHiring({ positions, candidates, onAddPos, onEditPos, onDeletePos, onAddCan, onEditCan, onDeleteCan, userRole }: any) {
  const stages = ["Applied", "Interviewed", "Trial Shift", "Hired", "Rejected"];
  const isManager = userRole === "Manager";

  const totOpenings = positions.reduce((s: number, p: any) => s + p.openings, 0);
  const totHired = positions.reduce((s: number, p: any) => s + p.hired, 0);
  const staffingProg = totOpenings > 0 ? Math.round((totHired / totOpenings) * 100) : 0;

  const hiredCandidates = candidates.filter((c: Candidate) => c.stage === "Hired");
  const filledTeam = hiredCandidates.map((c: Candidate) => {
    const matchedPosition = positions.find((p: Position) => p.role === c.position);
    return {
      id: c.id,
      name: c.name,
      role: c.position,
      responsibilities: matchedPosition?.compPlan || c.feedback || "Add responsibilities in position compensation plan or candidate feedback.",
    };
  });

  return (
    <div className="fu">
      <SectionHeader 
        title="Talent & Hiring" 
        subtitle="Manage your team growth and candidate pipeline"
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={onAddPos} variant="outline">+ New Position</Btn>
            <Btn onClick={onAddCan} variant="primary">+ New Applicant</Btn>
          </div>
        }
      />

      {/* Staffing Completion Card */}
      <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 24px rgba(0,0,0,0.02)" }}>
        <div>
          <div style={{ fontSize: 11, color: T.muted, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6, letterSpacing: 1.2, fontWeight: 600 }}>STAFFING ARCHITECTURE</div>
          <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 36, fontWeight: 700, color: T.purple, letterSpacing: -1 }}>{staffingProg}%</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 6, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>{totHired} of {totOpenings} strategic roles filled</div>
        </div>
        <div style={{ width: 240, height: 10, background: T.bg, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
          <div style={{ height: "100%", width: `${staffingProg}%`, background: T.purple, borderRadius: 12, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </div>
      </div>

      {/* Positions Tracker */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Users size={18} color={T.gold} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: T.muted, letterSpacing: 1 }}>POSITIONS TRACKER</span>
        </div>
        <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: isManager ? "2fr 1fr 1fr 1fr 100px" : "2fr 1fr 1fr 1.5fr 1fr 100px", padding: "14px 24px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
            {isManager 
              ? ["ROLE", "OPENINGS", "HIRED", "STATUS", ""].map((h, i) => (
                <div key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.subtle, letterSpacing: 1.2, fontWeight: 700 }}>{h}</div>
              ))
              : ["ROLE", "OPENINGS", "HIRED", "SALARY", "STATUS", ""].map((h, i) => (
                <div key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.subtle, letterSpacing: 1.2, fontWeight: 700 }}>{h}</div>
              ))
            }
          </div>
          {positions.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: T.muted, fontSize: 13 }}>No positions defined yet.</div>
          ) : (
            positions.map((p: Position) => (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: isManager ? "2fr 1fr 1fr 1fr 100px" : "2fr 1fr 1fr 1.5fr 1fr 100px", padding: "14px 18px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.role}</div>
                  {p.offerLetterUrl && <div style={{ fontSize: 9, color: T.green, marginTop: 2 }}>Offer letter attached</div>}
                </div>
                <div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono',monospace" }}>{p.openings}</div>
                <div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono',monospace" }}>{p.hired}</div>
                {!isManager && <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{p.salary || "-"}</div>}
                <div>
                  <Pill 
                    label={p.status} 
                    color={p.status === "Urgent" ? T.red : p.status === "Filled" ? T.green : T.muted} 
                    bg={p.status === "Urgent" ? T.redLight : p.status === "Filled" ? T.greenLight : T.bg} 
                    border={p.status === "Urgent" ? T.redBorder : p.status === "Filled" ? T.greenBorder : T.border} 
                  />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => onEditPos(p)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Edit2 size={14} /></button>
                  <button onClick={() => onDeletePos(p.id)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer" }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Filled Team Overview */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Users size={18} color={T.green} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: T.muted, letterSpacing: 1 }}>FILLED TEAM OVERVIEW</span>
        </div>

        {filledTeam.length === 0 ? (
          <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, color: T.muted, fontSize: 13 }}>
            No hired team members yet. Move candidates to "Hired" to build your final team map.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            {filledTeam.map((m: any) => (
              <div key={m.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: T.blue, background: T.blueLight, border: `1px solid ${T.blueBorder}`, display: "inline-block", padding: "3px 8px", borderRadius: 999, marginBottom: 10 }}>
                  {m.role || "Unassigned Role"}
                </div>
                <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: .8, color: T.subtle, marginBottom: 6 }}>
                  RESPONSIBILITIES
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: T.muted }}>{m.responsibilities}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Pipeline */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <FileText size={18} color={T.blue} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: T.muted, letterSpacing: 1 }}>CANDIDATE PIPELINE</span>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, alignItems: "start" }}>
          {stages.map(stage => (
            <div key={stage} style={{ background: T.bg, borderRadius: 24, padding: 16, minHeight: 440, border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 8px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1.2, fontFamily: "'IBM Plex Mono', monospace" }}>{stage.toUpperCase()}</span>
                <span style={{ fontSize: 11, background: "#FFF", padding: "2px 8px", borderRadius: 12, border: `1px solid ${T.border}`, color: T.muted, fontWeight: 600 }}>
                  {candidates.filter((c: Candidate) => c.stage === stage).length}
                </span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {candidates.filter((c: Candidate) => c.stage === stage).map((can: Candidate) => (
                  <div key={can.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{can.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{can.position}</div>
                    
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      {can.resumeUrl && (
                        <div title="Resume Attached" style={{ color: T.green }}><FileText size={14} /></div>
                      )}
                      {(can.feedback || can.partnerNotes) && (
                        <div title="Has Feedback/Notes" style={{ color: T.blue }}><MessageSquare size={14} /></div>
                      )}
                      {can.trialScores && (can.trialScores.technique > 0 || can.trialScores.speed > 0 || can.trialScores.vibe > 0) && (
                        <div title="Trial Scorecard Complete" style={{ color: T.gold }}><Users size={14} /></div>
                      )}
                    </div>

                    {can.trialScores && (can.trialScores.technique > 0) && (
                      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                        {[...Array(3)].map((_, i) => {
                          const avg = ((can.trialScores?.technique || 0) + (can.trialScores?.speed || 0) + (can.trialScores?.vibe || 0)) / 3;
                          return <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < Math.floor(avg) ? T.gold : T.border }} />;
                        })}
                      </div>
                    )}

                    {can.feedback && (
                      <div style={{ fontSize: 10, color: T.muted, background: T.bg, padding: 6, borderRadius: 6, fontStyle: "italic", marginBottom: 6 }}>
                        "{can.feedback.length > 40 ? can.feedback.substring(0, 40) + "..." : can.feedback}"
                      </div>
                    )}

                    {can.partnerNotes && !isManager && (
                      <div style={{ fontSize: 10, color: T.text, background: T.goldLight, padding: 6, borderRadius: 6, marginBottom: 10, border: `1px solid ${T.goldBorder}` }}>
                        <span style={{ fontWeight: 700, fontSize: 8 }}>PARTNER:</span> {can.partnerNotes.length > 40 ? can.partnerNotes.substring(0, 40) + "..." : can.partnerNotes}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                      <button onClick={() => onEditCan(can)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 11 }}>Edit</button>
                      <button onClick={() => onDeleteCan(can.id)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 11 }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TeamMap({ positions, candidates, onAddMember, onEditMember, onDeleteMember }: { positions: Position[], candidates: Candidate[], onAddMember: () => void, onEditMember: (member: Candidate) => void, onDeleteMember: (member: Candidate) => void }) {
  const hiredCandidates = candidates.filter((c: Candidate) => c.stage === "Hired");
  const filledTeam = hiredCandidates.map((c: Candidate) => {
    const matchedPosition = positions.find((p: Position) => p.role === c.position);
    return {
      id: c.id,
      name: c.name,
      role: c.position,
      responsibilities: c.feedback || matchedPosition?.compPlan || "Key team member",
      raw: c,
    };
  });

  const totOpenings = positions.reduce((s: number, p: any) => s + p.openings, 0);
  const totHired = positions.reduce((s: number, p: any) => s + p.hired, 0);
  const staffingProg = totOpenings > 0 ? Math.round((totHired / totOpenings) * 100) : 0;

  return (
    <div className="fu">
      <SectionHeader 
        title="Team Map" 
        subtitle="Manage hired and transferred team members"
        action={<Btn onClick={onAddMember} variant="primary">+ Add Team Member</Btn>}
      />

      {/* Staffing Progress */}
      <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, padding: 28, marginBottom: 32, boxShadow: "0 8px 24px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div>
            <div style={{ fontSize: 11, color: T.muted, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 12, letterSpacing: 1.2, fontWeight: 600 }}>TEAM STAFFING</div>
            <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 48, fontWeight: 700, color: T.green, letterSpacing: -2 }}>{totHired}</div>
            <div style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>of {totOpenings} positions filled</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 12 }}>{staffingProg}% Complete</div>
            <div style={{ width: "100%", height: 12, background: T.bg, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
              <div style={{ height: "100%", width: `${staffingProg}%`, background: T.green, borderRadius: 12, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Team Cards */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <Users size={20} color={T.green} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: T.muted, letterSpacing: 1.2, fontWeight: 700 }}>HIRED TEAM MEMBERS</span>
        </div>
        
        {filledTeam.length === 0 ? (
          <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 20, padding: 32, textAlign: "center", color: T.muted, fontSize: 14 }}>
            <div style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>TEAM</div>
            <div>No hired team members yet. Add transferred staff or move candidates to Hired.</div>
            <div style={{ marginTop: 14 }}>
              <Btn onClick={onAddMember} variant="outline">+ Add Transferred Team Member</Btn>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
            {filledTeam.map((member: any) => (
              <div key={member.id} style={{ 
                background: "#FFF", 
                border: `2px solid ${T.greenBorder}`, 
                borderRadius: 16, 
                padding: 24,
                transition: "all .2s",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column"
              }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                
                {/* Header with avatar */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16, flex: 1 }}>
                  <div style={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: 12, 
                    background: T.greenLight, 
                    border: `2px solid ${T.greenBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    flexShrink: 0
                  }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                      {member.name}
                    </div>
                    <Pill 
                      label={member.role || "Team Member"} 
                      color={T.green} 
                      bg={T.greenLight} 
                      border={T.greenBorder}
                    />
                  </div>
                </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => onEditMember(member.raw)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: T.muted, fontSize: 11 }}>Edit</button>
                    <button onClick={() => onDeleteMember(member.raw)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: T.red, fontSize: 11 }}>Delete</button>
                  </div>
                </div>
                
                {/* Divider */}
                <div style={{ height: "1px", background: T.border, margin: "4px 0 16px" }} />
                
                {/* Responsibilities */}
                <div>
                  <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 1, color: T.subtle, marginBottom: 8, fontWeight: 700 }}>
                    SHORT JOB DESCRIPTION
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: T.text, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {member.responsibilities}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TeamMapMemberModal({ member, positions, onSave, onClose }: { member: Candidate | null, positions: Position[], onSave: (form: Candidate) => void, onClose: () => void }) {
  const blank: Candidate = {
    id: Date.now(),
    name: "",
    position: "",
    stage: "Hired",
    feedback: "",
    date: "",
    partnerNotes: ""
  };
  const [form, setForm] = useState<Candidate>(member ? { ...member } : blank);
  const set = (k: keyof Candidate, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal title={member ? "Edit Team Member" : "Add Team Member"} onClose={onClose} width={460}>
      <Field label="NAME">
        <input value={form.name} onChange={e => set("name", e.target.value)} style={inpStyle} placeholder="e.g. Maria Santos" />
      </Field>
      <Field label="TITLE / ROLE">
        <input value={form.position} onChange={e => set("position", e.target.value)} list="team-role-options" style={inpStyle} placeholder="e.g. Sous Chef" />
        <datalist id="team-role-options">
          {positions.map(p => <option key={p.id} value={p.role} />)}
        </datalist>
      </Field>
      <Field label="SHORT JOB DESCRIPTION">
        <textarea
          value={form.feedback}
          onChange={e => set("feedback", e.target.value)}
          style={{ ...inpStyle, height: 90, resize: "none", padding: "10px" }}
          placeholder="Short summary of responsibilities..."
        />
      </Field>
      <Field label="TRANSFER NOTE (OPTIONAL)">
        <input value={form.partnerNotes || ""} onChange={e => set("partnerNotes", e.target.value)} style={inpStyle} placeholder="e.g. Transferred from Downtown location" />
      </Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => onSave({ ...form, stage: "Hired" })} variant="primary">{member ? "Save Changes" : "Add Team Member"}</Btn>
      </div>
    </Modal>
  );
}


