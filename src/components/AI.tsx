import React, { useRef, useEffect } from 'react';
import { T } from '../types';
import { SectionHeader, Btn, inpStyle } from './UI';

export function AIAssistant({ messages, onSend, loading, onSaveToNotes }: { messages: any[], onSend: (msg: string) => void, loading: boolean, onSaveToNotes: () => void }) {
  const [input, setInput] = React.useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="fu">
      <SectionHeader 
        title="AI Assistant" 
        subtitle="Ask anything about your launch: tasks, budget, menu, or what needs attention now" 
        action={messages.length > 0 && <Btn onClick={onSaveToNotes} variant="outline" small>Save to Notes</Btn>}
      />
      <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", height: 520 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "76%", padding: "12px 16px", borderRadius: 10, background: msg.role === "user" ? T.goldLight : "#F7F7F7", border: `1px solid ${msg.role === "user" ? T.goldBorder : T.border}`, fontSize: 14, lineHeight: 1.72, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", color: T.text, whiteSpace: "pre-wrap" }}>
                {msg.role === "assistant" && <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.gold, marginBottom: 6, letterSpacing: 1 }}>AI ASSISTANT</div>}
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 5 }}>
              {[0, .2, .4].map((d, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.gold, animation: "pulse 1.2s infinite", animationDelay: `${d}s` }} />)}
            </div>
          )}
          <div ref={endRef} />
        </div>
        
        {/* Dynamic Suggestions (Last Assistant Message Only) */}
        {!loading && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.suggestions?.length > 0 && (
          <div style={{ padding: "0 16px 12px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {messages[messages.length - 1].suggestions.map((q: string) => (
              <button key={q} onClick={() => onSend(q)}
                style={{ background: T.goldLight, border: `1px solid ${T.goldBorder}`, borderRadius: 16, padding: "6px 12px", color: T.gold, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", transition: "all .15s" }}>
                {q}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, display: "flex", gap: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about tasks, budget, menu, timeline..."
            style={{ ...inpStyle, flex: 1, background: "#FAFAFA" }} />
          <Btn onClick={handleSend} variant="primary" style={{ opacity: loading ? .6 : 1 }}>Send</Btn>
        </div>
      </div>
    </div>
  );
}


