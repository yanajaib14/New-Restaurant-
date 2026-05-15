import React, { useState, useMemo } from 'react';
import { T, InventoryItem, Vendor, InventoryCategory, InventoryDepartment, ProcurementStatus, INV_CATEGORIES, DEPARTMENTS } from '../types';
import { SectionHeader, Btn, Pill } from './UI';
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

      {/* Filters and content continues... */}
    </div>
  );
}
