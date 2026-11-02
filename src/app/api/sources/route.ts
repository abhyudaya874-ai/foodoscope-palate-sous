// GET /api/sources — real evidence rows cited in workspace/data CSVs (rivals, claims, ui_facts).
// Every row: real url + evidence_id + provider. No stale cache sweep, no secrets.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

interface Row { n: number; title: string; url: string; detail?: string; provider: string; confidence?: string; evidence_id?: string; kind: string }

/** RFC-4180-ish CSV parse: quoted fields may contain commas and newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); field = ""; if (row.some((c) => c.trim())) rows.push(row); row = []; }
    else if (ch !== "\r") field += ch;
  }
  if (field || row.length) { row.push(field); if (row.some((c) => c.trim())) rows.push(row); }
  return rows;
}

function csvRows(p: string): { head: string[]; body: string[][] } {
  if (!existsSync(p)) return { head: [], body: [] };
  const [head = [], ...body] = parseCsv(readFileSync(p, "utf8"));
  return { head, body };
}

export async function GET() {
  const rows: Row[] = [];
  const base = path.join(process.cwd(), "workspace", "data");
  const push = (file: string, kind: string, provider: string, titleKey: string, detailFn: (g: (k: string) => string) => string) => {
    const { head, body } = csvRows(path.join(base, file));
    for (const r of body) {
      const g = (k: string) => (head.includes(k) ? r[head.indexOf(k)] ?? "" : "");
      const url = g("source_url");
      if (!url || url === "NA" || !url.startsWith("http")) continue;
      rows.push({ n: 0, title: g(titleKey).slice(0, 120) || url, url, detail: detailFn(g).slice(0, 140), provider: g("provider") || provider, confidence: g("confidence"), evidence_id: g("evidence_id"), kind });
    }
  };
  push("claims.csv", "claim-check", "verify", "claim", (g) => `verdict: ${g("verdict")} · agreement: ${g("agreement")}`);
  push("ui_facts.csv", "browser-fact", "browser", "fact", (g) => g("value"));
  push("rivals.csv", "rival-watch", "tavily", "claim", (g) => g("claim"));
  const seen = new Set<string>();
  const out = rows.filter((r) => !seen.has(r.url) && seen.add(r.url)).map((r, i) => ({ ...r, n: i + 1 }));
  return Response.json({ rows: out, asOf: new Date().toISOString() });
}
