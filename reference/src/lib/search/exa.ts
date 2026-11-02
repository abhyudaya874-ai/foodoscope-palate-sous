import { z } from "zod";
import { postJson } from "./http";
import { makeEvidence } from "./evidence";
import { type Evidence, type SearchIntent, type SearchRequest, SearchError } from "./types";

const BASE = "https://api.exa.ai";
const Resp = z.object({
  results: z.array(
    z.object({
      title: z.string().nullish(),
      url: z.string(),
      publishedDate: z.string().nullish(),
      score: z.number().nullish(),
      highlights: z.array(z.string()).nullish(),
      text: z.string().nullish(),
    }),
  ),
});

const CATEGORY: Partial<Record<SearchIntent, string>> = { paper: "research paper", company: "company" };

function toEvidence(raw: unknown, now: string): Evidence[] {
  const parsed = Resp.safeParse(raw);
  if (!parsed.success) throw new SearchError("exa response shape changed", "contract");
  return parsed.data.results.map((r) =>
    makeEvidence({
      provider: "exa",
      url: r.url,
      title: r.title ?? undefined,
      snippet: (r.highlights ?? []).join(" ") || r.text || "",
      publishedAt: r.publishedDate ?? undefined,
      score: r.score ?? undefined,
      now,
    }),
  );
}

export async function exaSearch(req: SearchRequest, key: string, now: string): Promise<Evidence[]> {
  const start = req.recencyDays ? new Date(Date.parse(now) - req.recencyDays * 86_400_000).toISOString() : undefined;
  const raw = await postJson<unknown>(`${BASE}/search`, { "x-api-key": key }, {
    query: req.query,
    type: "auto",
    numResults: Math.min(req.maxResults ?? 5, 10),
    category: CATEGORY[req.intent],
    includeDomains: req.domains?.length ? req.domains : undefined,
    startPublishedDate: start,
    contents: { highlights: { maxCharacters: 1200 } },
  });
  return toEvidence(raw, now);
}

export async function exaSimilar(url: string, maxResults: number, key: string, now: string): Promise<Evidence[]> {
  const raw = await postJson<unknown>(`${BASE}/findSimilar`, { "x-api-key": key }, {
    url,
    numResults: Math.min(maxResults, 10),
    contents: { highlights: { maxCharacters: 1200 } },
  });
  return toEvidence(raw, now);
}
