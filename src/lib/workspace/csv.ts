export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { cur.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      cur.push(field); field = "";
      if (cur.length > 1 || cur[0] !== "") rows.push(cur);
      cur = [];
    } else field += c;
  }
  if (field !== "" || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

export function serializeCsv(rows: string[][]): string {
  return rows.map((r) => r.map((f) => (/[",\n]/.test(f) ? `"${f.replace(/"/g, '""')}"` : f)).join(",")).join("\n") + "\n";
}

export function upsertCsv(text: string, newRows: string[][], keyCol = 0): { text: string; added: number; updated: number; rows: number } {
  const rows = parseCsv(text);
  if (rows.length === 0) return { text: serializeCsv(newRows), added: newRows.length, updated: 0, rows: newRows.length };
  const header = rows[0];
  const body = rows.slice(1);
  const idx = new Map(body.map((r, i) => [r[keyCol], i]));
  let added = 0, updated = 0;
  for (const nr of newRows) {
    const at = idx.get(nr[keyCol]);
    if (at === undefined) { body.push(nr); idx.set(nr[keyCol], body.length - 1); added++; }
    else { body[at] = nr; updated++; }
  }
  return { text: serializeCsv([header, ...body]), added, updated, rows: body.length };
}
