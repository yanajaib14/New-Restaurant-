import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (isRegistering) {
      const { error } = await register(email, password, name || "User");
      if (error) setErrorMsg(error);
    } else {
      const { error } = await login(email, password);
      if (error) setErrorMsg(error);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #F9F8F6 0%, #E1D9D1 100%)", padding: 20 }}>
      <div style={{ background: "#FFF", padding: "3rem", borderRadius: 24, boxShadow: "0 32px 64px rgba(0,0,0,0.1)", width: "100%", maxWidth: 440, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-thai-display)", fontSize: 36, lineHeight: 1.32, fontWeight: 700, color: "#1A1A1A", marginBottom: 10, paddingTop: 10, overflow: "visible" }}>ไกลกังวล</div>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 40 }}>{isRegistering ? "Create your account" : "Sign in to access the launch dashboard"}</p>
        
        {errorMsg && (
          <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
          {isRegistering && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#444" }}>Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #CCC", fontFamily: "inherit", fontSize: 16 }} 
              />
            </div>
          )}
          
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#444" }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #CCC", fontFamily: "inherit", fontSize: 16 }} 
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#444" }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #CCC", fontFamily: "inherit", fontSize: 16 }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: 10, padding: "12px", borderRadius: 12, border: "none", background: "#1A1A1A", color: "#FFF", 
              fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Please wait..." : (isRegistering ? "Register" : "Sign In")}
          </button>
        </form>

        <div style={{ marginTop: 24 }}>
          <button 
            type="button" 
            onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(""); }} 
            style={{ background: "none", border: "none", color: "#666", fontSize: 14, cursor: "pointer", textDecoration: "underline" }}
          >
            {isRegistering ? "Already have an account? Sign in" : "Need an account? Register"}
          </button>
        </div>

        <div style={{ marginTop: 40, borderTop: "1px solid #EEE", paddingTop: 24 }}>
          <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: "#999", letterSpacing: 1.2 }}>PROTOTYPE V1.3.0</span>
        </div>
      </div>
    </div>
  );
};

