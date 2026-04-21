import React, { useState, useMemo } from 'react';
import { T, InventoryItem, Vendor, InventoryCategory, InventoryDepartment, ProcurementStatus, INV_CATEGORIES, DEPARTMENTS } from '../types';
import { SectionHeader, Btn, Pill } from './UI';
import { exportToCSV } from '../lib/exportUtils';

export function MasterInventory({ items, vendors, onEdit, onDelete, onAdd }: { 
  items: InventoryItem[], 
  vendors: Vendor[], 
  onEdit: (i: InventoryItem) => void, 
  onDelete: (id: number) => void,
  onAdd: () => void
}) {
  const isMobile = window.innerWidth < 1024;
  const [catFilter, setCatFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");

  const categories = INV_CATEGORIES;
  const departments = DEPARTMENTS;

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCat = catFilter === "All" || item.category === catFilter;
      const matchDept = deptFilter === "All" || item.department === deptFilter;
      return matchCat && matchDept;
    });
  }, [items, catFilter, deptFilter]);

  const stats = useMemo(() => {
    const totalStartupSpend = items
      .filter(i => (i.procurementStatus === "Ordered" || i.procurementStatus === "Arrived") && i.category !== "Operating Supplies")
      .reduce((sum, i) => sum + (Number(i.price) || 0), 0);
    
    const pendingDeliveries = items.filter(i => i.procurementStatus === "Ordered").length;
    
    const lowStockAlerts = items.filter(i => i.category === "Operating Supplies" && i.currentStock <= i.parLevel).length;

    return { totalStartupSpend, pendingDeliveries, lowStockAlerts };
  }, [items]);

  const getVendorName = (id?: number) => {
    if (!id) return "No Vendor";
    return vendors.find(v => v.id === id)?.name || "Unknown Vendor";
  };

  const statusColors: Record<ProcurementStatus, any> = {
    "Not Ordered": { text: T.muted, bg: T.bg, border: T.border },
    "Ordered": { text: T.blue, bg: T.blueLight, border: T.blueBorder },
    "Arrived": { text: T.green, bg: T.greenLight, border: T.greenBorder },
  };

  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  const handleExport = () => {
    exportToCSV(filteredItems, 'Restaurant_Inventory', [
      { key: 'name', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'department', label: 'Department' },
      { key: 'procurementStatus', label: 'Status' },
      { key: 'currentStock', label: 'Stock' },
      { key: 'unit', label: 'Unit' },
      { key: 'price', label: 'Cost per Unit' },
      { key: 'parLevel', label: 'Par Level' },
      { key: 'leadTime', label: 'Lead Time' },
    ]);
  };

  return (
    <div className="fu">
      <SectionHeader title="Master Inventory List" subtitle="Consolidated view of all assets and supplies"
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn onClick={handleExport} variant="outline" small>�x� Export CSV</Btn>
            <Btn onClick={onAdd} variant="primary">+ Add Item</Btn>
          </div>
        } 
      />

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
        <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: T.muted, letterSpacing: .8, marginBottom: 8 }}>TOTAL STARTUP SPEND</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.text }}>${stats.totalStartupSpend.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Ordered or Arrived assets</div>
        </div>
        <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: T.muted, letterSpacing: .8, marginBottom: 8 }}>PENDING DELIVERIES</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.blue }}>{stats.pendingDeliveries}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Items marked as 'Ordered'</div>
        </div>
        <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: T.muted, letterSpacing: .8, marginBottom: 8 }}>LOW STOCK ALERTS</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.red }}>{stats.lowStockAlerts}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Operating supplies below par</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? "12px 14px" : "16px 20px", marginBottom: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
            <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: T.muted, width: isMobile ? "auto" : 100 }}>CATEGORY:</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All", ...categories].map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  style={{ cursor: "pointer", borderRadius: 20, padding: "4px 12px", fontSize: 11, border: `1px solid ${catFilter === cat ? T.gold : T.border}`, background: catFilter === cat ? T.goldLight : "#FFF", color: catFilter === cat ? T.gold : T.muted, fontWeight: catFilter === cat ? 600 : 400 }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
            <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: T.muted, width: isMobile ? "auto" : 100 }}>DEPARTMENT:</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All", ...departments].map(dept => (
                <button key={dept} onClick={() => setDeptFilter(dept)}
                  style={{ cursor: "pointer", borderRadius: 20, padding: "4px 12px", fontSize: 11, border: `1px solid ${deptFilter === dept ? T.blue : T.border}`, background: deptFilter === dept ? T.blueLight : "#FFF", color: deptFilter === dept ? T.blue : T.muted, fontWeight: deptFilter === dept ? 600 : 400 }}>
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: T.muted, background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12 }}>No items match the selected filters.</div>
          ) : (
            filteredItems.map(item => {
              const sc = statusColors[item.procurementStatus];
              const isExp = expandedNotes[item.id];
              return (
                <div key={item.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{item.name}</div>
                      <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <span style={{ fontSize: 10, color: T.muted }}>{item.category}</span>
                        <span style={{ fontSize: 10, color: T.muted }}>⬢</span>
                        <span style={{ fontSize: 10, color: T.muted }}>{item.department}</span>
                      </div>
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        <Pill label={item.procurementStatus} color={sc.text} bg={sc.bg} border={sc.border} />
                        <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, color: T.text }}>${(Number(item.price) || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 11, color: T.muted }}>Vendor: {getVendorName(item.vendorId)} ⬢ Lead time: {item.leadTime || "N/A"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => onEdit(item)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>Edit</button>
                      <button onClick={() => onDelete(item.id)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>Delete</button>
                    </div>
                  </div>
                  {item.notes && (
                    <div style={{ marginTop: 8, fontSize: 11, color: T.muted }}>
                      <span style={{ fontWeight: 600 }}>Notes: </span>
                      <span style={{ display: "inline", overflow: "hidden" }}>{isExp ? item.notes : item.notes.slice(0, 90) + (item.notes.length > 90 ? "..." : "")}</span>
                      {item.notes.length > 90 && (
                        <button onClick={() => setExpandedNotes(p => ({ ...p, [item.id]: !p[item.id] }))} style={{ background: "none", border: "none", color: T.blue, cursor: "pointer", fontSize: 10, padding: 0, marginLeft: 6 }}>
                          {isExp ? "Show Less" : "Show More"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 100px 80px", padding: "10px 18px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
            {["ITEM", "CATEGORY", "DEPARTMENT", "VENDOR", "STATUS", "PRICE", ""].map(h => (
              <div key={h} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: T.subtle, letterSpacing: .8 }}>{h}</div>
            ))}
          </div>
          {filteredItems.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: T.muted }}>No items match the selected filters.</div>
          ) : (
            filteredItems.map(item => {
              const sc = statusColors[item.procurementStatus];
              const isExp = expandedNotes[item.id];
              return (
                <div key={item.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 100px 80px", padding: "14px 18px", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>Lead Time: {item.leadTime || "N/A"}</div>
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>{item.category}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{item.department}</div>
                    <div style={{ fontSize: 12, color: T.text }}>{getVendorName(item.vendorId)}</div>
                    <div>
                      <Pill label={item.procurementStatus} color={sc.text} bg={sc.bg} border={sc.border} />
                    </div>
                    <div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, color: T.text }}>${(Number(item.price) || 0).toLocaleString()}</div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => onEdit(item)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>Edit</button>
                      <button onClick={() => onDelete(item.id)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>Delete</button>
                    </div>
                  </div>
                  {item.notes && (
                    <div style={{ padding: "0 18px 14px", marginTop: -6 }}>
                      <div style={{ fontSize: 11, color: T.muted, display: "flex", gap: 4 }}>
                        <span style={{ fontWeight: 600 }}>Notes:</span>
                        <span style={{ 
                          display: "-webkit-box", 
                          WebkitLineClamp: isExp ? "unset" : 1, 
                          WebkitBoxOrient: "vertical", 
                          overflow: "hidden",
                          flex: 1
                        }}>
                          {item.notes}
                        </span>
                        <button onClick={() => setExpandedNotes(p => ({ ...p, [item.id]: !p[item.id] }))} style={{ background: "none", border: "none", color: T.blue, cursor: "pointer", fontSize: 10, padding: 0 }}>
                          {isExp ? "Show Less" : "Show More"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

