import React, { useState } from 'react';
import { T, MenuItem, CAT_COLORS } from '../types';
import { SectionHeader, Btn, Pill } from './UI';

export function CostCalculator({ menuItems }: { menuItems: MenuItem[] }) {
  const [selected, setSelected] = useState<MenuItem | null>(null);

  const calculateTotalCost = (item: MenuItem) => {
    return item.ingredients.reduce((sum, ing) => sum + (ing.cost * ing.quantity), 0);
  };

  return (
    <div className="fu">
      <SectionHeader 
        title="Menu Cost Calculator" 
        subtitle="Analyze recipe costs and optimize your food cost percentage"
      />

      <div style={{ display: "flex", gap: 32 }}>
        {/* Item List */}
        <div style={{ width: 350, flexShrink: 0 }}>
          <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: 1.2, fontWeight: 600 }}>MENU SELECTIONS</span>
            </div>
            <div style={{ maxHeight: 640, overflowY: "auto" }}>
              {menuItems.map(item => {
                const totalCost = calculateTotalCost(item);
                const actualFoodCost = Math.round((totalCost / item.price) * 100);
                const isWarning = actualFoodCost > (item.foodCost || 30);

                return (
                  <button 
                    key={item.id}
                    onClick={() => setSelected(item)}
                    style={{ 
                      width: "100%", textAlign: "left", padding: "16px 24px", border: "none", 
                      borderBottom: `1px solid ${T.border}`, background: selected?.id === item.id ? T.goldLight : "#FFF",
                      cursor: "pointer", transition: "all .2s ease", display: "flex", alignItems: "center", gap: 14
                    }}
                    onMouseEnter={e => { if (selected?.id !== item.id) e.currentTarget.style.background = T.bg; }}
                    onMouseLeave={e => { if (selected?.id !== item.id) e.currentTarget.style.background = "#FFF"; }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: T.muted, fontFamily: "'Inter', sans-serif" }}>{item.section}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isWarning ? T.red : T.green }}>{actualFoodCost}%</div>
                      <div style={{ fontSize: 9, color: T.subtle, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>ACTUAL</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recipe Analysis */}
        <div style={{ flex: 1 }}>
          {selected ? (
            <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, padding: 40, boxShadow: "0 8px 32px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>{selected.section.toUpperCase()}</div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, margin: 0, color: T.text, letterSpacing: -1 }}>{selected.name}</h2>
                  <p style={{ fontSize: 15, color: T.muted, marginTop: 12, maxWidth: 500, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>{selected.desc}</p>
                </div>
                <div style={{ display: "flex", gap: 24 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>${selected.price}</div>
                    <div style={{ fontSize: 10, color: T.muted, fontFamily: "'DM Mono', monospace", fontWeight: 700, letterSpacing: 1 }}>RETAIL PRICE</div>
                  </div>
                  <div style={{ height: 50, width: 1, background: T.border, marginTop: 8 }} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>${calculateTotalCost(selected).toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: T.muted, fontFamily: "'DM Mono', monospace", fontWeight: 700, letterSpacing: 1 }}>PLATE COST</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 40 }}>
                <div style={{ background: T.bg, padding: 24, borderRadius: 16 }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>ACTUAL FOOD COST</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>{Math.round((calculateTotalCost(selected) / selected.price) * 100)}%</div>
                </div>
                <div style={{ background: T.bg, padding: 24, borderRadius: 16 }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>TARGET COST %</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>{selected.foodCost}%</div>
                </div>
                <div style={{ background: T.bg, padding: 24, borderRadius: 16 }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>GROSS MARGIN</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.green, fontFamily: "'Playfair Display', serif" }}>${(selected.price - calculateTotalCost(selected)).toFixed(2)}</div>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted, letterSpacing: 1.5, marginBottom: 24, fontWeight: 700 }}>RECIPE ARCHITECTURE</div>
                <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr", gap: 16, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
                  {["COMPONENTS", "MEASURE", "UNIT COST", "SUBTOTAL"].map(h => (
                    <div key={h} style={{ fontSize: 10, color: T.subtle, fontWeight: 700, letterSpacing: 1 }}>{h}</div>
                  ))}
                </div>
                {selected.ingredients.map(ing => (
                  <div key={ing.id} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr", gap: 16, padding: "16px 0", borderBottom: `1px solid ${T.bg}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{ing.name}</div>
                    <div style={{ fontSize: 13, color: T.muted }}>{ing.quantity} {ing.unit}</div>
                    <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Mono', monospace" }}>${ing.cost.toFixed(2)} / {ing.unit}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>${(ing.cost * ing.quantity).toFixed(2)}</div>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr", gap: 16, padding: "24px 0", marginTop: 8 }}>
                  <div />
                  <div />
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: 1 }}>TOTAL</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.gold, fontFamily: "'Playfair Display', serif" }}>${calculateTotalCost(selected).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: "100%", minHeight: 400, border: `2px dashed ${T.border}`, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: T.subtle, background: "#FFF" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚖️</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>Select a menu item to analyze</div>
              <div style={{ fontSize: 14, marginTop: 8, fontFamily: "'Inter', sans-serif" }}>Plate costs are calculated based on your recipe data</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
