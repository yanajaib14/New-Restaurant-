import React from 'react';
import { T } from '../types';
import { Lock } from 'lucide-react';

export const Pill = ({ label, color, bg, border, size = 10 }: { label: string, color: string, bg: string, border: string, size?: number }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: bg, border: `1px solid ${border}`, color, borderRadius: 24, padding: "5px 12px", fontSize: size, fontFamily: "'Inter',sans-serif", fontWeight: 600, whiteSpace: "nowrap", letterSpacing: 0.3 }}>
    <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
    {label}
  </span>
);

export const Btn = ({ children, onClick, variant = "ghost", small = false, style = {}, active = false, disabled = false }: { children: React.ReactNode, onClick?: () => void, variant?: "primary" | "danger" | "ghost" | "outline", small?: boolean, style?: React.CSSProperties, active?: boolean, disabled?: boolean }) => {
  const isMobile = window.innerWidth < 1024;
  const base: React.CSSProperties = { cursor: disabled ? "not-allowed" : "pointer", borderRadius: 16, fontSize: small ? (isMobile ? 12 : 11) : 12, fontFamily: "'Inter', sans-serif", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: small ? (isMobile ? 38 : 34) : (isMobile ? 44 : 40), gap: 8, transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)", opacity: disabled ? 0.6 : 1, ...style };
  const variants = {
    primary: { background: active ? T.stone : T.gold, border: `1px solid ${T.gold}`, color: active ? T.text : "#FFF", padding: small ? (isMobile ? "8px 14px" : "8px 18px") : "12px 24px", boxShadow: active ? "none" : "0 8px 16px rgba(182, 137, 72, 0.15)" },
    danger: { background: T.redLight, border: `1px solid ${T.redBorder}`, color: T.red, padding: small ? (isMobile ? "8px 14px" : "8px 18px") : "12px 24px" },
    ghost: { background: active ? T.champagne : "transparent", border: `1px solid ${T.border}`, color: T.muted, padding: small ? (isMobile ? "8px 14px" : "8px 18px") : "12px 24px" },
    outline: { background: active ? T.champagne : "#FFF", border: `1px solid ${T.borderStrong}`, color: T.text, padding: small ? (isMobile ? "8px 14px" : "8px 18px") : "12px 24px" },
  };
  return <button 
    onClick={onClick}
    disabled={disabled}
    style={{ ...base, ...variants[variant] }}
    onMouseOver={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
    onMouseOut={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
  >{children}</button>;
};

export function Modal({ title, onClose, children, width = 520 }: { title: string, onClose: () => void, children: React.ReactNode, width?: number }) {
  const isMobile = window.innerWidth < 1024;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44, 54, 57, 0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div style={{ background: "#FFF", borderRadius: isMobile ? 16 : 24, padding: isMobile ? "1rem" : "2.5rem", width: isMobile ? "calc(100vw - 20px)" : width, maxWidth: isMobile ? "calc(100vw - 20px)" : width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,.12)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 14 : 24 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 18 : 20, fontWeight: 700, color: T.text, letterSpacing: -0.4 }}>{title}</span>
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
  const isMobile = window.innerWidth < 1024;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-end", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0, marginBottom: isMobile ? 20 : 40 }}>
      <div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 24 : 32, margin: "0 0 8px", fontWeight: 700, color: T.text, letterSpacing: -0.8 }}>{title}</h2>
        {subtitle && <p style={{ fontFamily: "'Inter', sans-serif", color: T.muted, fontSize: isMobile ? 13 : 14, margin: 0, fontWeight: 400, opacity: 0.8 }}>{subtitle}</p>}
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
  const [digits, setDigits] = React.useState(["", "", "", ""]);
  const [error, setError] = React.useState(false);
  const inputRefs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
  ];

  const handleDigit = (idx: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = digits.map((v, i) => i === idx ? d : v);
    setDigits(next);
    setError(false);
    if (d && idx < 3) {
      inputRefs[idx + 1].current?.focus();
    }
    if (next.every(v => v !== "")) {
      const entered = next.join("");
      if (entered === correctPin) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setDigits(["", "", "", ""]);
          setError(false);
          inputRefs[0].current?.focus();
        }, 600);
      }
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus();
    }
  };

  return (
    <div style={{ padding: 40, textAlign: "center", background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 16, maxWidth: 380, margin: "40px auto" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <Lock size={40} color={error ? T.red : T.gold} />
      </div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", marginBottom: 8, fontSize: 20, margin: "0 0 8px" }}>Secure Section</h3>
      <p style={{ fontSize: 13, color: T.muted, marginBottom: 28 }}>Enter your 4-digit PIN</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 8 }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={inputRefs[i]}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={d}
            autoFocus={i === 0}
            autoComplete="off"
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            style={{
              width: 56, height: 64, textAlign: "center", fontSize: 28, fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
              border: `2px solid ${error ? T.red : d ? T.gold : T.border}`,
              borderRadius: 12, outline: "none",
              background: d ? T.goldLight : T.bg,
              color: T.text,
              transition: "border-color .15s, background .15s",
              WebkitAppearance: "none",
            }}
          />
        ))}
      </div>
      {error && <p style={{ color: T.red, fontSize: 12, marginTop: 12, fontWeight: 600 }}>Incorrect PIN. Try again.</p>}
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

export function ChangePasswordModal({ userEmail, onSendCode, onConfirm, onClose }: {
  userEmail: string;
  onSendCode: () => Promise<void>;
  onConfirm: (otp: string, newPassword: string) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = React.useState<'send' | 'confirm'>('send');
  const [otp, setOtp] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [codeSent, setCodeSent] = React.useState(false);

  const handleSendCode = async () => {
    setError("");
    setLoading(true);
    try {
      await onSendCode();
      setCodeSent(true);
      setStep('confirm');
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setError("");
    if (!otp.trim()) { setError("Enter the code from your email"); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await onConfirm(otp.trim(), newPassword);
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Change Sign-In Password" onClose={onClose} width={420}>
      {step === 'send' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: T.bg, borderRadius: 10, padding: "14px 16px", fontSize: 13, color: T.text, lineHeight: 1.5 }}>
            A one-time reset code will be sent to:<br />
            <strong style={{ color: T.gold }}>{userEmail}</strong>
          </div>
          <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>
            Check your inbox (and spam folder) for the code, then enter it on the next screen along with your new password.
          </p>
          {error && <p style={{ color: T.red, fontSize: 12, margin: 0, fontWeight: 500 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn onClick={onClose} variant="ghost" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>Cancel</Btn>
            <Btn onClick={handleSendCode} variant="primary" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Code"}
            </Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: T.goldLight, border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: T.text }}>
            ✉️ Code sent to <strong>{userEmail}</strong>. Check your inbox.
          </div>
          <Field label="6-DIGIT CODE FROM EMAIL">
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              style={{ ...inpStyle, letterSpacing: 6, fontSize: 22, textAlign: "center", fontFamily: "'DM Mono',monospace" }}
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
          </Field>
          <Field label="NEW PASSWORD (MIN 8 CHARACTERS)">
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ ...inpStyle, fontSize: 16 }} placeholder="••••••••" disabled={loading} />
          </Field>
          <Field label="CONFIRM NEW PASSWORD">
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ ...inpStyle, fontSize: 16 }} placeholder="••••••••" disabled={loading} onKeyDown={e => e.key === 'Enter' && handleConfirm()} />
          </Field>
          {error && <p style={{ color: T.red, fontSize: 12, margin: 0, fontWeight: 500 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn onClick={() => { setStep('send'); setError(''); }} variant="ghost" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>Back</Btn>
            <Btn onClick={handleConfirm} variant="primary" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>
              {loading ? "Updating..." : "Set New Password"}
            </Btn>
          </div>
          <button onClick={handleSendCode} disabled={loading} style={{ background: "none", border: "none", color: T.muted, fontSize: 12, cursor: "pointer", textDecoration: "underline", textAlign: "center" }}>Resend code</button>
        </div>
      )}
    </Modal>
  );
}
