/** RFC 4180-style CSV reader: quoted commas, doubled quotes, CRLF and multiline cells. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false, closed = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closed = true; }
      } else field += ch;
    } else if (ch === '"') {
      if (field || closed) throw new Error('Unexpected quote in CSV.');
      quoted = true;
    } else if (ch === ',') { row.push(field); field = ''; closed = false; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i+1] === '\n') i++;
      row.push(field); if (row.some(value => value.trim())) rows.push(row);
      row = []; field = ''; closed = false;
    } else {
      if (closed && ch.trim()) throw new Error('Unexpected text after quoted CSV field.');
      if (!closed) field += ch;
    }
  }
  if (quoted) throw new Error('CSV has an unclosed quoted field.');
  row.push(field); if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

export function csvRecords(text: string): Record<string, string>[] {
  const [rawHeaders, ...rows] = parseCSV(text);
  if (!rawHeaders) throw new Error('CSV is empty.');
  const headers = rawHeaders.map(value => value.trim());
  if (new Set(headers).size !== headers.length || headers.some(h => !h)) throw new Error('CSV headers must be unique and nonempty.');
  return rows.map((row, i) => {
    if (row.length !== headers.length) throw new Error(`CSV row ${i + 2} has the wrong number of columns.`);
    return Object.fromEntries(headers.map((key, j) => [key, row[j]]));
  });
}
