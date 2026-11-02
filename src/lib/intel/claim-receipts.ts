// ClaimReceipts — re-checks claims that will appear in the deck, via the `verify` intent (both providers).
// Shape copied from reference/src/lib/search/rival-watch.ts (evidence-first: a row exists only with backing evidence).
import type { SearchRequest, SearchResponse } from "../search/types";

type Search = (r: SearchRequest) => Promise<SearchResponse>;
type CsvUpsert = (path: string, rows: Array<Record<string, string>>) => Promise<void>;

export interface ClaimRow {
  claim: string;
  verdict: "supported" | "contradicted" | "NA";
  ids: string;
  agreement: string;
  confidence: "H" | "M" | "L";
  source_url: string;
  evidence_id: string;
}

/** A claim is `supported` only when ≥1 host agrees across BOTH providers; no evidence => NA, never inferred. */
export async function claimReceipts(claims: string[], search: Search, csv: CsvUpsert): Promise<ClaimRow[]> {
  const rows: ClaimRow[] = [];
  for (const claim of claims) {
    const res = await search({ intent: "verify", query: claim, maxResults: 4 });
    const both = res.agreement !== undefined && res.agreement > 0;
    const ev = res.evidence[0];
    rows.push({
      claim: claim.slice(0, 160),
      verdict: res.evidence.length === 0 ? "NA" : both ? "supported" : "NA",
      ids: res.evidence.map((e) => e.id).join(" "),
      agreement: res.agreement === undefined ? "NA" : String(res.agreement),
      confidence: both ? "M" : "L",
      source_url: ev?.url ?? "NA",
      evidence_id: ev?.id ?? "NA",
    });
  }
  await csv("workspace/data/claims.csv", rows.map((r) => ({ ...r })));
  return rows;
}
