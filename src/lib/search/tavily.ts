import { z } from "zod";
import { postJson } from "./http";
import { makeEvidence } from "./evidence";
import { type Evidence, type SearchRequest, SearchError } from "./types";

const BASE = "https://api.tavily.com";
const SearchResp = z.object({
  results: z.array(
    z.object({
      title: z.string().optional(),
      url: z.string(),
      content: z.string().optional(),
      score: z.number().optional(),
      published_date: z.string().optional(),
    }),
  ),
});
const ExtractResp = z.object({
  results: z.array(z.object({ url: z.string(), raw_content: z.string().optional() })),
});

const timeRange = (days?: number) => (days === undefined ? undefined : days <= 1 ? "day" : days <= 7 ? "week" : days <= 31 ? "month" : "year");

export async function tavilySearch(req: SearchRequest, key: string, now: string): Promise<Evidence[]> {
  const raw = await postJson<unknown>(`${BASE}/search`, { Authorization: `Bearer ${key}` }, {
    query: req.query,
    search_depth: req.intent === "verify" ? "advanced" : "basic",
    topic: req.intent === "current" ? "news" : "general",
    max_results: Math.min(req.maxResults ?? 5, 10),
    time_range: timeRange(req.recencyDays),
    include_domains: req.domains?.length ? req.domains : undefined,
    include_answer: false,
  });
  const parsed = SearchResp.safeParse(raw);
  if (!parsed.success) throw new SearchError("tavily response shape changed", "contract");
  return parsed.data.results.map((r) =>
    makeEvidence({ provider: "tavily", url: r.url, title: r.title, snippet: r.content, publishedAt: r.published_date, score: r.score, now }),
  );
}

export async function tavilyExtract(urls: string[], key: string, now: string): Promise<Evidence[]> {
  const raw = await postJson<unknown>(`${BASE}/extract`, { Authorization: `Bearer ${key}` }, { urls: urls.slice(0, 5) });
  const parsed = ExtractResp.safeParse(raw);
  if (!parsed.success) throw new SearchError("tavily extract shape changed", "contract");
  return parsed.data.results.map((r) => makeEvidence({ provider: "tavily", url: r.url, snippet: r.raw_content, now }));
}
