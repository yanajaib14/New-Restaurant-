/**
 * Utility to export an array of items to CSV and trigger a download in the browser.
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (!data || !data.length) return;

  const usedColumns = columns || Object.keys(data[0]).map(key => ({ key: key as keyof T, label: key.toString() }));

  const headers = usedColumns.map(col => `"${col.label.replace(/"/g, '""')}"`).join(",");
  
  const rows = data.map(item => {
    return usedColumns.map(col => {
      const rawVal = item[col.key];
      let displayVal: any = rawVal;
      
      // Handle special types
      if (rawVal === null || rawVal === undefined) {
        displayVal = "";
      } else if (typeof rawVal === "object") {
        // If it's an array of objects (like checklists), flatten it slightly or just stringify
        if (Array.isArray(rawVal)) {
          if (rawVal.length > 0 && typeof rawVal[0] === 'object' && 'text' in rawVal[0]) {
            displayVal = rawVal.map((i: any) => `${i.done ? '[x]' : '[ ]'} ${i.text}`).join("; ");
          } else {
            displayVal = JSON.stringify(rawVal);
          }
        } else {
          displayVal = JSON.stringify(rawVal);
        }
      }
      
      const escaped = ("" + displayVal).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(",");
  });

  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
