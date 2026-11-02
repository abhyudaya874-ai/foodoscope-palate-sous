// CONTRACT FILE. Copy verbatim. Do not rename or reshape. Change only via an ADR in DECISIONS.md.
export type Provider = "tavily" | "exa";
export type SearchIntent = "current" | "discover" | "verify" | "paper" | "company" | "similar" | "extract";

export interface Evidence {
  id: string; // sha1(url).slice(0,10) - the ONLY id a model may cite, e.g. [a1b2c3d4e5]
  url: string;
  title: string;
  snippet: string; // provider highlights/content, truncated, UNTRUSTED
  provider: Provider;
  publishedAt?: string;
  score?: number;
  retrievedAt: string; // ISO
  flags?: string[]; // e.g. ["possible_injection"]
}

export interface SearchRequest {
  intent: SearchIntent;
  query: string; // for "similar" and "extract" put the seed URL(s) in `urls`
  maxResults?: number; // default 5, hard cap 10
  domains?: string[];
  recencyDays?: number;
  urls?: string[];
}

export interface SearchResponse {
  evidence: Evidence[];
  providersUsed: Provider[];
  cached: boolean;
  calls: number; // live provider calls made for this request (0 when cached)
  latencyMs: number;
  agreement?: number; // verify only: count of hostnames returned by BOTH providers
}

export type ErrorKind = "transient" | "auth" | "contract" | "budget";
export class SearchError extends Error {
  constructor(message: string, public kind: ErrorKind, public status?: number) {
    super(message);
    this.name = "SearchError";
  }
}

export type Emit = (type: string, payload: Record<string, unknown>) => void;
