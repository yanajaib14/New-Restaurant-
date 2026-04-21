import React, { useMemo, useState } from 'react';
import { T, MenuItem } from '../types';
import { SectionHeader } from './UI';

type ManualIngredient = {
  quantity: number;
  cost: number;
};

type ManualItemState = {
  price: number;
  targetFoodCost: number;
  ingredients: Record<number, ManualIngredient>;
};

export function CostCalculator({ menuItems }: { menuItems: MenuItem[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [manualByItem, setManualByItem] = useState<Record<number, ManualItemState>>({});

  const selected = useMemo(
    () => menuItems.find((item) => item.id === selectedId) || null,
    [menuItems, selectedId]
  );

  const ensureManualItem = (item: MenuItem): ManualItemState => {
    const existing = manualByItem[item.id];
    if (existing) return existing;

    const ingredients: Record<number, ManualIngredient> = {};
    item.ingredients.forEach((ing) => {
      ingredients[ing.id] = { quantity: ing.quantity, cost: ing.cost };
    });

    return {
      price: item.price,
      targetFoodCost: item.foodCost,
      ingredients,
    };
  };

  const updateManualItem = (item: MenuItem, updater: (prev: ManualItemState) => ManualItemState) => {
    setManualByItem((prev) => {
      const current = prev[item.id] || ensureManualItem(item);
      return { ...prev, [item.id]: updater(current) };
    });
  };

  const getManualPrice = (item: MenuItem) => {
    return manualByItem[item.id]?.price ?? item.price;
  };

  const getManualTargetCost = (item: MenuItem) => {
    return manualByItem[item.id]?.targetFoodCost ?? item.foodCost;
  };

  const getManualIngredient = (item: MenuItem, ingId: number) => {
    return manualByItem[item.id]?.ingredients?.[ingId] || null;
  };

  const calculateTotalCost = (item: MenuItem) => {
    return item.ingredients.reduce((sum, ing) => {
      const manualIng = getManualIngredient(item, ing.id);
      const qty = manualIng?.quantity ?? ing.quantity;
      const cost = manualIng?.cost ?? ing.cost;
      return sum + qty * cost;
    }, 0);
  };

  const calculateFoodCostPct = (item: MenuItem) => {
    const price = getManualPrice(item);
    if (price <= 0) return 0;
    return Math.round((calculateTotalCost(item) / price) * 100);
  };

  return (
    <div className="fu">
      <SectionHeader
        title="Menu Cost Calculator"
        subtitle="Manually plug in numbers to test pricing and food-cost scenarios"
      />

      <div style={{ display: 'flex', gap: 32, flexDirection: 'row' }}>
        <div style={{ width: 350, flexShrink: 0 }}>
          <div style={{ background: '#FFF', border: `1px solid ${T.border}`, borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, background: T.bg }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: 1.2, fontWeight: 600 }}>MENU SELECTIONS</span>
            </div>
            <div style={{ maxHeight: 640, overflowY: 'auto' }}>
              {menuItems.map((item) => {
                const actualFoodCost = calculateFoodCostPct(item);
                const targetFoodCost = getManualTargetCost(item);
                const isWarning = actualFoodCost > (targetFoodCost || 30);

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '16px 24px',
                      border: 'none',
                      borderBottom: `1px solid ${T.border}`,
                      background: selected?.id === item.id ? T.goldLight : '#FFF',
                      cursor: 'pointer',
                      transition: 'all .2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: T.muted, fontFamily: "'Inter', sans-serif" }}>{item.section}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isWarning ? T.red : T.green }}>{actualFoodCost}%</div>
                      <div style={{ fontSize: 9, color: T.subtle, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>ACTUAL</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {selected ? (
            <div style={{ background: '#FFF', border: `1px solid ${T.border}`, borderRadius: 24, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>{selected.section.toUpperCase()}</div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, margin: 0, color: T.text, letterSpacing: -1 }}>{selected.name}</h2>
                  <p style={{ fontSize: 14, color: T.muted, marginTop: 10, maxWidth: 520, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>{selected.desc}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>RETAIL PRICE</div>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={getManualPrice(selected)}
                    onChange={(e) => updateManualItem(selected, (prev) => ({ ...prev, price: Number(e.target.value) }))}
                    style={{ width: '100%', height: 42, border: `1px solid ${T.border}`, borderRadius: 10, padding: '0 12px', fontSize: 14 }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>TARGET COST %</div>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={getManualTargetCost(selected)}
                    onChange={(e) => updateManualItem(selected, (prev) => ({ ...prev, targetFoodCost: Number(e.target.value) }))}
                    style={{ width: '100%', height: 42, border: `1px solid ${T.border}`, borderRadius: 10, padding: '0 12px', fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 30 }}>
                <div style={{ background: T.bg, padding: 18, borderRadius: 14 }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>ACTUAL FOOD COST</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>{calculateFoodCostPct(selected)}%</div>
                </div>
                <div style={{ background: T.bg, padding: 18, borderRadius: 14 }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>PLATE COST</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>${calculateTotalCost(selected).toFixed(2)}</div>
                </div>
                <div style={{ background: T.bg, padding: 18, borderRadius: 14 }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>GROSS MARGIN</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.green, fontFamily: "'Playfair Display', serif" }}>${(getManualPrice(selected) - calculateTotalCost(selected)).toFixed(2)}</div>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted, letterSpacing: 1.5, marginBottom: 16, fontWeight: 700 }}>RECIPE INPUTS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr', gap: 12, paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
                  {['COMPONENT', 'QTY', 'UNIT COST', 'SUBTOTAL'].map((h) => (
                    <div key={h} style={{ fontSize: 10, color: T.subtle, fontWeight: 700, letterSpacing: 1 }}>{h}</div>
                  ))}
                </div>
                {selected.ingredients.map((ing) => {
                  const manualIng = getManualIngredient(selected, ing.id);
                  const qty = manualIng?.quantity ?? ing.quantity;
                  const cost = manualIng?.cost ?? ing.cost;
                  return (
                    <div key={ing.id} style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr', gap: 12, padding: '14px 0', borderBottom: `1px solid ${T.bg}`, alignItems: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{ing.name}</div>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={qty}
                        onChange={(e) => updateManualItem(selected, (prev) => ({
                          ...prev,
                          ingredients: {
                            ...prev.ingredients,
                            [ing.id]: { quantity: Number(e.target.value), cost: prev.ingredients[ing.id]?.cost ?? ing.cost },
                          },
                        }))}
                        style={{ width: '100%', height: 36, border: `1px solid ${T.border}`, borderRadius: 8, padding: '0 10px', fontSize: 13 }}
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={cost}
                        onChange={(e) => updateManualItem(selected, (prev) => ({
                          ...prev,
                          ingredients: {
                            ...prev.ingredients,
                            [ing.id]: { quantity: prev.ingredients[ing.id]?.quantity ?? ing.quantity, cost: Number(e.target.value) },
                          },
                        }))}
                        style={{ width: '100%', height: 36, border: `1px solid ${T.border}`, borderRadius: 8, padding: '0 10px', fontSize: 13 }}
                      />
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>${(qty * cost).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', minHeight: 400, border: `2px dashed ${T.border}`, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: T.subtle, background: '#FFF' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>Scale</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', serif" }}>Select a menu item to analyze</div>
              <div style={{ fontSize: 14, marginTop: 8, fontFamily: "'Inter', sans-serif" }}>You can manually edit costs, quantities, and targets.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
