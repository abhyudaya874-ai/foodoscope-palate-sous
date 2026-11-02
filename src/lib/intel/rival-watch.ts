// EXEMPLAR: how to build an intel module ON TOP of the router. Copy this shape for DocsDrift, AliasEvidence, ClaimReceipts.
import type { Evidence, SearchRequest, SearchResponse } from "../search/types";

type Search = (r: SearchRequest) => Promise<SearchResponse>;
type CsvUpsert = (path: string, rows: Array<Record<string, string>>) => Promise<void>; // workspace tool from 50-live-workspace.md

export interface RivalRow {
  entity: string;
  claim: string;
  source_url: string;
  as_of: string;
  provider: string;
  confidence: "H" | "M" | "L";
  evidence_id: string;
}

/** Evidence-first: a row exists ONLY if a search result backs it. No model-written facts. */
export async function rivalWatch(entity: string, seedUrl: string | undefined, search: Search, csv: CsvUpsert): Promise<RivalRow[]> {
  const found: Evidence[] = [];
  const status = await search({ intent: "current", query: `${entity} still operating pricing API`, recencyDays: 365, maxResults: 4 });
  found.push(...status.evidence);
  if (seedUrl) {
    const similar = await search({ intent: "similar", query: seedUrl, urls: [seedUrl], maxResults: 4 });
    found.push(...similar.evidence);
  }
  const rows: RivalRow[] = found.slice(0, 8).map((e) => ({
    entity,
    claim: e.snippet.slice(0, 160),
    source_url: e.url,
    as_of: e.publishedAt ?? e.retrievedAt.slice(0, 10),
    provider: e.provider,
    // confidence is mechanical: two providers agree => M, else L. "H" is reserved for a human check.
    confidence: status.agreement && status.agreement > 0 ? "M" : "L",
    evidence_id: e.id,
  }));
  await csv("workspace/data/rivals.csv", rows.map((r) => ({ ...r })));
  return rows;
}
