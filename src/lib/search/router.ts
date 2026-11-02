import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exaSearch, exaSimilar } from "./exa";
import { hostOf } from "./evidence";
import { tavilyExtract, tavilySearch } from "./tavily";
import { type Emit, type Evidence, type Provider, type SearchIntent, type SearchRequest, type SearchResponse, SearchError } from "./types";

/** THE design decision of this module: intent -> ordered providers. Edit here only. */
export const POLICY: Record<SearchIntent, Provider[]> = {
  current: ["tavily", "exa"], // news/status/pricing "as of now"
  discover: ["exa", "tavily"], // semantic "find things like..."
  verify: ["tavily", "exa"], // run BOTH, merge, report agreement
  paper: ["exa"],
  company: ["exa"],
  similar: ["exa"],
  extract: ["tavily"],
};

export interface SearchDeps {
  keys: { tavily?: string; exa?: string };
  mode: "live" | "replay";
  cacheDir: string; // e.g. fixtures/search-cache
  maxCalls: number; // from BUDGET.json -> maxSearchCalls
  emit: Emit;
  now?: () => Date;
}

const cacheKey = (r: SearchRequest) => createHash("sha1").update(JSON.stringify(r)).digest("hex").slice(0, 16);

async function callProvider(p: Provider, r: SearchRequest, keys: SearchDeps["keys"], now: string): Promise<Evidence[]> {
  const key = keys[p];
  if (!key) throw new SearchError(`no ${p} key`, "auth");
  if (r.intent === "extract") return tavilyExtract(r.urls ?? [], key, now);
  if (r.intent === "similar") return exaSimilar(r.urls?.[0] ?? "", r.maxResults ?? 5, key, now);
  return p === "tavily" ? tavilySearch(r, key, now) : exaSearch(r, key, now);
}

function dedupe(items: Evidence[]): Evidence[] {
  const seen = new Map<string, Evidence>();
  for (const e of items) if (!seen.has(e.id)) seen.set(e.id, e);
  return [...seen.values()];
}

export function createSearch(deps: SearchDeps) {
  let calls = 0;
  const nowIso = () => (deps.now ? deps.now() : new Date()).toISOString();

  return async function search(req: SearchRequest): Promise<SearchResponse> {
    const t0 = Date.now();
    const file = join(deps.cacheDir, `${cacheKey(req)}.json`);

    try {
      const hit = JSON.parse(await readFile(file, "utf8")) as SearchResponse;
      deps.emit("search.call", { intent: req.intent, query: req.query, cached: true, results: hit.evidence.length });
      return { ...hit, cached: true, calls: 0, latencyMs: Date.now() - t0 };
    } catch {
      /* cache miss */
    }
    if (deps.mode === "replay") throw new SearchError(`replay cache miss for "${req.query}"`, "contract");

    const order = POLICY[req.intent].filter((p) => deps.keys[p]);
    if (order.length === 0) throw new SearchError("no provider key available for this intent", "auth");

    const spend = (n: number) => {
      if (calls + n > deps.maxCalls) throw new SearchError("search budget exhausted", "budget");
      calls += n;
    };

    let evidence: Evidence[] = [];
    const used: Provider[] = [];
    let agreement: number | undefined;
    let made = 0;

    if (req.intent === "verify" && order.length > 1) {
      spend(order.length);
      made = order.length;
      const settled = await Promise.allSettled(order.map((p) => callProvider(p, req, deps.keys, nowIso())));
      const byHost: Set<string>[] = [];
      settled.forEach((s, i) => {
        if (s.status === "fulfilled") {
          used.push(order[i]);
          evidence.push(...s.value);
          byHost.push(new Set(s.value.map((e) => hostOf(e.url))));
        }
      });
      if (used.length === 0) throw new SearchError("all providers failed", "transient");
      agreement = byHost.length === 2 ? [...byHost[0]].filter((h) => byHost[1].has(h)).length : undefined;
    } else {
      let lastErr: unknown;
      for (const p of order) {
        spend(1);
        made += 1;
        try {
          evidence = await callProvider(p, req, deps.keys, nowIso());
          used.push(p);
          break;
        } catch (e) {
          lastErr = e;
          if (e instanceof SearchError && e.kind === "budget") throw e; // never fall through on budget
        }
      }
      if (used.length === 0) throw lastErr instanceof Error ? lastErr : new SearchError("search failed", "transient");
    }

    evidence = dedupe(evidence).slice(0, Math.min(req.maxResults ?? 5, 10) * (used.length || 1));
    for (const e of evidence) {
      if (e.flags?.includes("possible_injection")) {
        deps.emit("bug.detected", { kind: "injection", source: e.url, provider: e.provider });
      }
    }
    const res: SearchResponse = { evidence, providersUsed: used, cached: false, calls: made, latencyMs: Date.now() - t0, agreement };
    await mkdir(deps.cacheDir, { recursive: true });
    await writeFile(file, JSON.stringify(res, null, 2));
    deps.emit("search.call", { intent: req.intent, query: req.query, cached: false, providers: used, results: evidence.length, calls: made, latencyMs: res.latencyMs });
    return res;
  };
}
