import React, { useState, useMemo } from 'react';
import { T, MENU_SECTIONS, MenuItem, Ingredient } from '../types';
import { Modal, Field, inpStyle, selStyle, Btn } from './UI';

export function MenuModal({ item, onSave, onClose }: { item: MenuItem | null, onSave: (form: any) => void, onClose: () => void }) {
  const isMobile = window.innerWidth < 1024;
  const blank = { name: "", section: "Small Plates", desc: "", price: "", foodCost: 30, hero: false, notes: "", imageUrl: "", ingredients: [], costPerBottle: "", sellPriceBottle: "", sellPriceGlass: "" };
  const [form, setForm] = useState<any>(item ? { ...item } : blank);
  const [newIng, setNewIng] = useState({ name: "", quantity: "", unit: "oz", cost: "" });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        set("imageUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const totalIngCost = useMemo(() => {
    return (form.ingredients || []).reduce((sum: number, ing: Ingredient) => sum + (Number(ing.cost) || 0), 0);
  }, [form.ingredients]);

  const calculatedFoodCostPct = useMemo(() => {
    if (!form.price || form.price <= 0) return 0;
    return Math.round((totalIngCost / form.price) * 100);
  }, [totalIngCost, form.price]);

  const calculatedWineCostPct = useMemo(() => {
    if (!form.sellPriceBottle || form.sellPriceBottle <= 0) return 0;
    return Math.round((Number(form.costPerBottle) / Number(form.sellPriceBottle)) * 100);
  }, [form.costPerBottle, form.sellPriceBottle]);

  const addIng = () => {
    if (!newIng.name || !newIng.cost) return;
    const ing: Ingredient = {
      id: Date.now(),
      name: newIng.name,
      quantity: Number(newIng.quantity) || 0,
      unit: newIng.unit,
      cost: Number(newIng.cost) || 0
    };
    set("ingredients", [...(form.ingredients || []), ing]);
    setNewIng({ name: "", quantity: "", unit: "oz", cost: "" });
  };

  const removeIng = (id: number) => {
    set("ingredients", form.ingredients.filter((i: Ingredient) => i.id !== id));
  };

  return (
    <Modal title={item ? "Edit Menu Item" : "New Menu Item"} onClose={onClose} width={540}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 16 }}>
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ width: 100, height: 100, borderRadius: 12, background: T.bg, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, cursor: "pointer", position: "relative" }}
        >
          {form.imageUrl ? <img src={form.imageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 13, fontWeight: 700 }}>IMG</span>}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.4)", color: "#FFF", fontSize: 9, textAlign: "center", padding: "4px 0", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>UPLOAD</div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          style={{ display: "none" }} 
        />
        <div style={{ flex: 1 }}>
          <Field label="ITEM NAME"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Truffle Flatbread" style={inpStyle} /></Field>
          <Field label="IMAGE URL (OR UPLOAD LEFT)"><input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} placeholder="https://..." style={inpStyle} /></Field>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        <Field label="SECTION"><select value={form.section} onChange={e => set("section", e.target.value)} style={selStyle}>{MENU_SECTIONS.map(s => <option key={s}>{s}</option>)}</select></Field>
        {form.section === "Wine" ? (
          <Field label="SELL PRICE (BOTTLE) ($)"><input type="number" value={form.sellPriceBottle} onChange={e => set("sellPriceBottle", e.target.value)} placeholder="0" style={inpStyle} /></Field>
        ) : (
          <Field label="PRICE ($)"><input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0" style={inpStyle} /></Field>
        )}
      </div>

      {form.section === "Wine" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <Field label="OUR COST (BOTTLE) ($)"><input type="number" value={form.costPerBottle} onChange={e => set("costPerBottle", e.target.value)} placeholder="0" style={inpStyle} /></Field>
          <Field label="SELL PRICE (GLASS/OZ) ($)"><input type="number" value={form.sellPriceGlass} onChange={e => set("sellPriceGlass", e.target.value)} placeholder="0" style={inpStyle} /></Field>
        </div>
      )}

      <div style={{ background: T.bg, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: T.muted, letterSpacing: 1.2, fontWeight: 600 }}>
            {form.section === "Wine" ? "WINE COST ANALYSIS" : "INGREDIENTS & COSTS"}
          </label>
          <div style={{ fontSize: 12, fontWeight: 600, color: (form.section === "Wine" ? calculatedWineCostPct : calculatedFoodCostPct) > 35 ? T.red : T.green }}>
            {form.section === "Wine" ? (
              `Wine Cost: ${calculatedWineCostPct}%`
            ) : (
              `Total Cost: $${totalIngCost.toFixed(2)} (${calculatedFoodCostPct}%)`
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {(form.ingredients || []).map((ing: Ingredient) => (
            <div key={ing.id} style={{ display: "grid", gridTemplateColumns: "1fr 60px 50px 70px 30px", gap: 8, alignItems: "center", background: "#FFF", padding: "6px 10px", borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{ing.name}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{ing.quantity}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{ing.unit}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>${ing.cost.toFixed(2)}</div>
              <button onClick={() => removeIng(ing.id)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 16 }}>x</button>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 60px 60px 70px 40px", gap: 8 }}>
          <input value={newIng.name} onChange={e => setNewIng({ ...newIng, name: e.target.value })} placeholder="Ingredient" style={{ ...inpStyle, fontSize: 12, padding: "6px 10px" }} />
          <input type="number" value={newIng.quantity} onChange={e => setNewIng({ ...newIng, quantity: e.target.value })} placeholder="Qty" style={{ ...inpStyle, fontSize: 12, padding: "6px 10px" }} />
          <input value={newIng.unit} onChange={e => setNewIng({ ...newIng, unit: e.target.value })} placeholder="Unit" style={{ ...inpStyle, fontSize: 12, padding: "6px 10px" }} />
          <input type="number" value={newIng.cost} onChange={e => setNewIng({ ...newIng, cost: e.target.value })} placeholder="$ Cost" style={{ ...inpStyle, fontSize: 12, padding: "6px 10px" }} />
          <Btn onClick={addIng} variant="outline" small style={{ height: 32, gridColumn: isMobile ? "1 / -1" : undefined }}>+ Add</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        <Field label="DESCRIPTION"><input value={form.desc} onChange={e => set("desc", e.target.value)} placeholder="Short description⬦" style={inpStyle} /></Field>
        <Field label="HERO ITEM"><label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", paddingTop: 8 }}><input type="checkbox" checked={form.hero} onChange={e => set("hero", e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: T.gold }} /><span style={{ fontSize: 13, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", color: T.text, fontWeight: 600 }}>Mark as hero item ⭐</span></label></Field>
      </div>
      <Field label="INTERNAL NOTES"><input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Internal notes⬦" style={inpStyle} /></Field>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 20 }}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <Btn onClick={() => { 
          if (form.name.trim()) {
            const finalCost = form.section === "Wine" ? calculatedWineCostPct : calculatedFoodCostPct;
            onSave({ ...form, foodCost: finalCost }); 
          }
        }} variant="primary">{item ? "Save Changes" : "Add Item"}</Btn>
      </div>
    </Modal>
  );
}

export function MenuDetailModal({ item, onClose, onEdit }: { item: MenuItem, onClose: () => void, onEdit: () => void }) {
  const isMobile = window.innerWidth < 1024;
  const totalIngCost = (item.ingredients || []).reduce((sum: number, ing: any) => sum + (Number(ing.cost) || 0), 0);
  const isWine = item.section === "Wine";

  return (
    <Modal title="" onClose={onClose} width={isMobile ? undefined : 700}>
      {/* Header: image + core info */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20, flexDirection: isMobile ? "column" : "row" }}>
        <div style={{ width: isMobile ? "100%" : 160, height: isMobile ? 180 : 160, borderRadius: 12, background: "#F5F5F5", border: "1px solid #E5E7EB", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 40 }}>🍽️</span>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: T.muted, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 8px" }}>{item.section}</span>
            {item.hero && <span style={{ fontSize: 10, background: T.goldLight, border: `1px solid ${T.goldBorder}`, borderRadius: 4, padding: "2px 8px", color: T.gold, fontWeight: 700 }}>⭐ Hero Item</span>}
          </div>
          <h2 style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text, margin: "0 0 8px" }}>{item.name}</h2>
          {item.desc && <p style={{ fontSize: 13, color: T.muted, margin: "0 0 14px", lineHeight: 1.7 }}>{item.desc}</p>}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {isWine ? (
              <>
                <div>
                  <div style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: T.muted, letterSpacing: .8 }}>BOTTLE PRICE</div>
                  <div style={{ fontSize: 22, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: T.green }}>${item.sellPriceBottle || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: T.muted, letterSpacing: .8 }}>GLASS PRICE</div>
                  <div style={{ fontSize: 22, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: T.green }}>${item.sellPriceGlass || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: T.muted, letterSpacing: .8 }}>COST / BOTTLE</div>
                  <div style={{ fontSize: 22, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: T.text }}>${item.costPerBottle || 0}</div>
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: T.muted, letterSpacing: .8 }}>SELL PRICE</div>
                <div style={{ fontSize: 26, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: T.green }}>${item.price}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: T.muted, letterSpacing: .8 }}>FOOD COST %</div>
              <div style={{ fontSize: 26, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: item.foodCost > 30 ? T.red : T.green }}>{item.foodCost}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      {!isWine && (item.ingredients || []).length > 0 && (
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: T.muted, letterSpacing: .8, fontWeight: 600 }}>INGREDIENTS</div>
            <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: T.text, fontWeight: 600 }}>Total Cost: ${totalIngCost.toFixed(2)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(item.ingredients || []).map((ing: any) => (
              <div key={ing.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 70px", gap: 8, alignItems: "center", background: "#FFF", padding: "7px 12px", borderRadius: 7, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{ing.name}</span>
                <span style={{ fontSize: 11, color: T.muted, textAlign: "right" }}>{ing.quantity} {ing.unit}</span>
                <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: T.text, textAlign: "right" }}>${Number(ing.cost).toFixed(2)}</span>
                <div />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div style={{ background: T.goldLight, border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: T.gold, letterSpacing: .8, marginBottom: 4, fontWeight: 700 }}>INTERNAL NOTES</div>
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{item.notes}</div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
        <Btn onClick={onClose} variant="ghost">Close</Btn>
        <Btn onClick={onEdit} variant="primary">✏️ Edit Item</Btn>
      </div>
    </Modal>
  );
}
