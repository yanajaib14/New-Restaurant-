import React from 'react';
import { T } from '../types';
import { Lock } from 'lucide-react';

export const Pill = ({ label, color, bg, border, size = 10 }: { label: string, color: string, bg: string, border: string, size?: number }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: bg, border: `1px solid ${border}`, color, borderRadius: 24, padding: "4px 12px", fontSize: size, fontFamily: "'Inter',sans-serif", fontWeight: 600, whiteSpace: "nowrap", letterSpacing: 0.3 }}>
    <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
    {label}
  </span>
);

export const Btn = ({ children, onClick, variant = "ghost", small = false, style = {}, active = false }: { children: React.ReactNode, onClick?: () => void, variant?: "primary" | "danger" | "ghost" | "outline", small?: boolean, style?: React.CSSProperties, active?: boolean }) => {
  const base: React.CSSProperties = { cursor: "pointer", borderRadius: 16, fontSize: small ? 11 : 12, fontFamily: "'Inter', sans-serif", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)", ...style };
  const variants = {
    primary: { background: active ? T.stone : T.gold, border: `1px solid ${T.gold}`, color: active ? T.text : "#FFF", padding: small ? "8px 18px" : "12px 24px", boxShadow: active ? "none" : "0 8px 16px rgba(182, 137, 72, 0.15)" },
    danger: { background: T.redLight, border: `1px solid ${T.redBorder}`, color: T.red, padding: small ? "8px 18px" : "12px 24px" },
    ghost: { background: active ? T.champagne : "transparent", border: `1px solid ${T.border}`, color: T.muted, padding: small ? "8px 18px" : "12px 24px" },
    outline: { background: active ? T.champagne : "#FFF", border: `1px solid ${T.borderStrong}`, color: T.text, padding: small ? "8px 18px" : "12px 24px" },
  };
  return <button 
    onClick={onClick} 
    style={{ ...base, ...variants[variant] }}
    onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; }}
  >{children}</button>;
};

export function Modal({ title, onClose, children, width = 520 }: { title: string, onClose: () => void, children: React.ReactNode, width?: number }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44, 54, 57, 0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div style={{ background: "#FFF", borderRadius: 24, padding: "2.5rem", width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,.12)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: -0.4 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 24, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 11, fontFamily: "'DM Mono', monospace", color: T.muted, letterSpacing: 1.2, marginBottom: 8, fontWeight: 700 }}>{label}</label>
    {children}
  </div>
);

export const inpStyle: React.CSSProperties = { width: "100%", background: "#FDFDFD", border: `1px solid ${T.border}`, borderRadius: 16, padding: "12px 16px", color: T.text, fontSize: 14, fontFamily: "'Inter', sans-serif" };
export const selStyle: React.CSSProperties = { ...inpStyle, cursor: "pointer" };

export function SectionHeader({ title, subtitle, action }: { title: string, subtitle?: string, action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
      <div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, margin: "0 0 8px", fontWeight: 700, color: T.text, letterSpacing: -0.8 }}>{title}</h2>
        {subtitle && <p style={{ fontFamily: "'Inter', sans-serif", color: T.muted, fontSize: 14, margin: 0, fontWeight: 400, opacity: 0.8 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ProgressRing({ progress, size = 120, stroke = 8, color = T.gold }: { progress: number, size?: number, stroke?: number, color?: string }) {
  const radius = (size / 2) - (stroke * 2);
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle stroke={T.bg} strokeWidth={stroke} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle 
          stroke={color} 
          strokeWidth={stroke} 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          fill="transparent" 
          r={radius} 
          cx={size / 2} 
          cy={size / 2} 
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div style={{ position: "absolute", textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: T.text }}>{Math.round(progress)}%</div>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: T.muted, fontWeight: 600 }}>Complete</div>
      </div>
    </div>
  );
}

export function PinGate({ onUnlock, correctPin }: { onUnlock: () => void, correctPin: string }) {
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState(false);

  const handleCheck = () => {
    if (pin === correctPin) {
      onUnlock();
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div style={{ padding: 40, textAlign: "center", background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, maxWidth: 400, margin: "40px auto" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <Lock size={40} color={T.gold} />
      </div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", marginBottom: 8, fontSize: 18 }}>Secure Section</h3>
      <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Enter 4-digit PIN to view sensitive data</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
        <input 
          type="password" 
          maxLength={4} 
          value={pin} 
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCheck()}
          style={{ width: 140, textAlign: "center", fontSize: 24, letterSpacing: 8, padding: 10, border: `2px solid ${error ? T.red : T.border}`, borderRadius: 8, outline: "none", background: T.bg }}
          placeholder="••••"
          autoFocus
        />
      </div>
      <Btn onClick={handleCheck} variant="primary" style={{ width: "100%", justifyContent: "center" }}>Unlock Access</Btn>
      {error && <p style={{ color: T.red, fontSize: 12, marginTop: 12, fontWeight: 500 }}>Incorrect PIN. Try again.</p>}
    </div>
  );
}

export function ChangePinModal({ currentPin, onSave, onClose, userRole, userEmail }: { currentPin: string, onSave: (newPin: string) => void, onClose: () => void, userRole?: string, userEmail?: string }) {
  const [oldPin, setOldPin] = React.useState("");
  const [newPin, setNewPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [error, setError] = React.useState("");

  // Check if user has permission to change PIN (Owner or Partner only)
  const canChangePIN = userRole === "Owner" || String(userEmail || "").toLowerCase() === "yanajaib@gmail.com";

  if (!canChangePIN) {
    return (
      <Modal title="Change Security PIN" onClose={onClose} width={400}>
        <div style={{ padding: 20, textAlign: "center", background: T.redLight, borderRadius: 8, marginBottom: 16 }}>
          <p style={{ color: T.red, fontSize: 13, margin: 0, fontWeight: 500 }}>
            Only Owner and Partner accounts can change the PIN.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={onClose} variant="ghost" style={{ flex: 1, justifyContent: "center" }}>Close</Btn>
        </div>
      </Modal>
    );
  }

  const handleSave = () => {
    if (oldPin !== currentPin) {
      setError("Current PIN is incorrect");
      return;
    }
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setError("New PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setError("New PINs do not match");
      return;
    }
    onSave(newPin);
    onClose();
  };

  return (
    <Modal title="Change Security PIN" onClose={onClose} width={400}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="CURRENT PIN">
          <input type="password" maxLength={4} value={oldPin} onChange={e => setOldPin(e.target.value)} style={inpStyle} placeholder="••••" />
        </Field>
        <Field label="NEW 4-DIGIT PIN">
          <input type="password" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value)} style={inpStyle} placeholder="••••" />
        </Field>
        <Field label="CONFIRM NEW PIN">
          <input type="password" maxLength={4} value={confirmPin} onChange={e => setConfirmPin(e.target.value)} style={inpStyle} placeholder="••••" />
        </Field>
        {error && <p style={{ color: T.red, fontSize: 12, margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <Btn onClick={onClose} variant="ghost" style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
          <Btn onClick={handleSave} variant="primary" style={{ flex: 1, justifyContent: "center" }}>Save New PIN</Btn>
        </div>
      </div>
    </Modal>
  );
}
