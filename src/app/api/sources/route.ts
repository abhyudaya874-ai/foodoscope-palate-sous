// GET /api/sources — real evidence rows for the Sources popover: search-cache (Tavily/Exa),
// rivals.csv / claims.csv / ui_facts.csv (browser + search rows). No secrets; links are real.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

interface Row {
  n: number; title: string; url: string; detail?: string;
  provider: string; confidence?: string; evidence_id?: string; kind: string;
}

function parseCsv(p: string): string[][] {
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => l.split(","));
}

export async function GET() {
  const rows: Row[] = [];
  // 1) search-cache: every cached Tavily/Exa response, real urls + snippets
  const dir = path.join(process.cwd(), "fixtures", "search-cache");
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      try {
        const j = JSON.parse(readFileSync(path.join(dir, f), "utf8")) as {
          evidence?: { id: string; url: string; title: string; snippet: string; provider: string; publishedAt?: string }[];
        };
        for (const e of j.evidence ?? []) {
          rows.push({
            n: 0, title: e.title.slice(0, 120), url: e.url,
            detail: e.snippet.slice(0, 140), provider: e.provider,
            evidence_id: e.id, kind: "web-search",
          });
        }
      } catch { /* skip malformed cache file */ }
    }
  }
  // 2) claims.csv — deck claims with verdicts
  const claims = parseCsv(path.join(process.cwd(), "workspace", "data", "claims.csv"));
  const [ch, ...cbody] = claims;
  for (const r of cbody) {
    const get = (k: string) => (ch && ch.includes(k) ? r[ch.indexOf(k)] ?? "" : "");
    if (get("source_url") && get("source_url") !== "NA")
      rows.push({ n: 0, title: get("claim").slice(0, 120), url: get("source_url"), detail: `verdict: ${get("verdict")} · agreement: ${get("agreement")}`, provider: "verify", confidence: get("confidence"), evidence_id: get("evidence_id"), kind: "claim-check" });
  }
  // 3) ui_facts.csv — browser-extracted page facts
  const facts = parseCsv(path.join(process.cwd(), "workspace", "data", "ui_facts.csv"));
  const [fh, ...fbody] = facts;
  for (const r of fbody) {
    const get = (k: string) => (fh && fh.includes(k) ? r[fh.indexOf(k)] ?? "" : "");
    if (get("source_url"))
      rows.push({ n: 0, title: get("fact"), url: get("source_url"), detail: get("value").slice(0, 140), provider: "browser", confidence: "L", kind: "browser-fact" });
  }
  // dedupe by url, number them
  const seen = new Set<string>();
  const out = rows.filter((r) => r.url && !seen.has(r.url) && seen.add(r.url)).map((r, i) => ({ ...r, n: i + 1 }));
  return Response.json({ rows: out, asOf: new Date().toISOString() });
}
