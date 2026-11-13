import React, { useState, useMemo } from 'react';
import { T, InventoryItem, Vendor, InventoryCategory, InventoryDepartment, ProcurementStatus, INV_CATEGORIES, DEPARTMENTS } from '../types';
import { SectionHeader, Btn, Pill, inpStyle } from './UI';
import { PenLine, Trash2, Eye } from 'lucide-react';
import { exportToCSV } from '../lib/exportUtils';

export function MasterInventory({ items, vendors, onEdit, onDelete, onAdd, onView }: { 
  items: InventoryItem[], 
  vendors: Vendor[], 
  onEdit: (i: InventoryItem) => void, 
  onDelete: (id: number) => void,
  onAdd: () => void,
  onView: (i: InventoryItem) => void
}) {
  const isMobile = window.innerWidth < 1024;
  const [catFilter, setCatFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const categories = INV_CATEGORIES;
  const departments = DEPARTMENTS;

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCat = catFilter === "All" || item.category === catFilter;
      const matchDept = deptFilter === "All" || item.department === deptFilter;
      const query = search.trim().toLowerCase();
      const matchSearch = !query || [item.name, item.category, item.department, item.unit, getVendorName(item.vendorId)].some(value => String(value || "").toLowerCase().includes(query));
      return matchCat && matchDept && matchSearch;
    });
  }, [items, catFilter, deptFilter, search, vendors]);

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
            <Btn onClick={handleExport} variant="outline" small>Export CSV</Btn>
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

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <input aria-label="Search inventory" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items, vendors, or units" style={{ ...inpStyle, flex: "1 1 220px" }} />
        <select aria-label="Filter by category" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...inpStyle, flex: "0 1 190px" }}>
          <option value="All">All categories</option>{categories.map(category => <option key={category}>{category}</option>)}
        </select>
        <select aria-label="Filter by department" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ ...inpStyle, flex: "0 1 170px" }}>
          <option value="All">All departments</option>{departments.map(department => <option key={department}>{department}</option>)}
        </select>
      </div>
      <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 850, borderCollapse: "collapse", textAlign: "left" }}>
          <thead><tr style={{ background: T.bg }}>{["ITEM", "CATEGORY", "DEPARTMENT", "STATUS", "VENDOR", "STOCK / PAR", "COST", "ACTIONS"].map(label => <th key={label} style={{ padding: "11px 14px", borderBottom: `1px solid ${T.border}`, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: T.subtle, letterSpacing: .8 }}>{label}</th>)}</tr></thead>
          <tbody>{filteredItems.map(item => {
            const colors = statusColors[item.procurementStatus] || statusColors["Not Ordered"];
            return <tr key={item.id} style={{ borderBottom: `1px solid ${T.border}` }}>
              <td style={{ padding: "12px 14px" }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.name}</div><div style={{ fontSize: 11, color: T.muted }}>{item.unit} · Par {item.parLevel}</div></td>
              <td style={{ padding: "12px 14px", fontSize: 12 }}>{item.category}</td><td style={{ padding: "12px 14px", fontSize: 12 }}>{item.department}</td>
              <td style={{ padding: "12px 14px" }}><Pill label={item.procurementStatus} color={colors.text} bg={colors.bg} border={colors.border} /></td>
              <td style={{ padding: "12px 14px", fontSize: 12 }}>{getVendorName(item.vendorId)}</td>
              <td style={{ padding: "12px 14px", fontSize: 12, color: item.currentStock <= item.parLevel ? T.red : T.text }}>{item.currentStock} / {item.parLevel}</td>
              <td style={{ padding: "12px 14px", fontSize: 12 }}>${(Number(item.price) || 0).toLocaleString()}</td>
              <td style={{ padding: "12px 14px" }}><div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => onView(item)} aria-label={`View ${item.name}`} title="View" style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: 5, background: "white", cursor: "pointer", color: T.muted }}><Eye size={14} /></button>
                <button onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} title="Edit" style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: 5, background: "white", cursor: "pointer", color: T.muted }}><PenLine size={14} /></button>
                <button onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`} title="Delete" style={{ border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: 5, background: "white", cursor: "pointer", color: T.red }}><Trash2 size={14} /></button>
              </div></td>
            </tr>;
          })}{filteredItems.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: T.muted }}>No inventory items match these filters.</td></tr>}</tbody>
        </table>
      </div>
    </div>
  );
}
