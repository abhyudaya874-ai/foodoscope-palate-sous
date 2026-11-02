// PROOF.md + proof.json + proof.slides.json — computed from events/*.jsonl, never hand-written.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readEvents, EVENTS_DIR } from "../src/lib/events/log";
import { parseCsv } from "../src/lib/workspace/csv";
import { runCrosswalk, loadSampleCsv, DEFAULT_XWALK_CFG } from "../src/lib/agent/crosswalk";

const M = (v: number | string | undefined) => (v === undefined ? "[measure]" : String(v));
const src = (s: string) => `(source: ${s})`;

const events = readEvents();
const probes = events.filter((e) => e.type === "probe.call");
const llm = events.filter((e) => e.type === "llm.call");
const bugs = new Map<string, { status: string; title: string; evidence?: string }>();
for (const e of events) {
  if (e.type === "bug.detected") {
    const k = e.payload.reproPath || e.payload.title;
    if (!bugs.has(k) || e.payload.status === "CONFIRMED")
      bugs.set(k, { status: e.payload.status, title: e.payload.title, evidence: e.evidence });
  }
}
const verified = events.filter((e) => e.type === "fix.verified" && e.payload.failedBefore && e.payload.passesAfter);
const reports = events.filter((e) => e.type === "report.drafted");
const tests = events.filter((e) => e.type === "test.run");

const llmByProvider = new Map<string, { in: number; out: number; calls: number }>();
let cacheHits = 0, cacheSaved = 0;
for (const e of llm) {
  const p = e.payload.provider;
  const cur = llmByProvider.get(p) ?? { in: 0, out: 0, calls: 0 };
  cur.in += e.payload.tokensIn; cur.out += e.payload.tokensOut; cur.calls++;
  llmByProvider.set(p, cur);
  if (e.payload.cache) {
    cacheHits++;
    const cf = path.join("fixtures", "llm-cache", `${e.payload.promptHash}.json`);
    if (existsSync(cf)) {
      const u = (JSON.parse(readFileSync(cf, "utf8")) as { usage?: { tokensIn?: number; tokensOut?: number } }).usage;
      cacheSaved += (u?.tokensIn ?? 0) + (u?.tokensOut ?? 0);
    }
  }
}
const llmTotal = [...llmByProvider.values()].reduce((a, c) => a + c.in + c.out, 0);
const cacheRate = llm.length ? ((cacheHits / llm.length) * 100).toFixed(1) + "%" : "[measure]";

// crosswalk: recompute before/after from committed inputs (deterministic)
let xw = { before: undefined as number | undefined, after: undefined as number | undefined, n: undefined as number | undefined };
if (existsSync("workspace/data/crosswalk.csv") && existsSync("workspace/data/sample.ingredients.csv")) {
  const sample = loadSampleCsv(readFileSync("workspace/data/sample.ingredients.csv", "utf8"));
  const entFx = readdirSync("fixtures/api").find((f) => f.includes("natural.source.69") || f.includes("natural-source"));
  const ent = entFx ? (JSON.parse(readFileSync(`fixtures/api/${entFx}`, "utf8")) as { body?: { content?: Record<string, string>[] } }).body?.content ?? [] : [];
  const candidates = [...new Set([...ent.flatMap((e) => [e.entity_alias, e.entity_alias_readable, e.entity_alias_synonyms, e.natural_source_name].filter(Boolean) as string[]), ...Object.values(DEFAULT_XWALK_CFG.aliasTable)])];
  const res = runCrosswalk(sample, candidates);
  const csvRows = parseCsv(readFileSync("workspace/data/crosswalk.csv", "utf8")).slice(1);
  const afterFromCsv = csvRows.filter((r) => r[2] && r[2] !== "NA").length;
  xw = { before: res.matchedBefore, after: afterFromCsv || res.matchedAfter, n: res.n };
}

const rateLimits = existsSync("workspace/reports/limits.json") ? JSON.parse(readFileSync("workspace/reports/limits.json", "utf8")) as Record<string, unknown> : undefined;

const lines: string[] = [];
lines.push("# PROOF — Palate + Sous");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()} from ${events.length} events in events/*.jsonl`);
lines.push("");
lines.push("## Probe coverage");
lines.push(`- endpoints probed: ${probes.length} ${src("probe.call events")}`);
lines.push(`- API calls spent: ${probes.filter((e) => !e.payload.replay).length} live / ${probes.filter((e) => e.payload.replay).length} replayed ${src("probe.call.replay")}`);
lines.push(`- measured rate limit: ${rateLimits ? `${rateLimits["x-ratelimit-limit"]} req/window` : "[measure]"} ${src("workspace/reports/limits.json")}`);
lines.push("");
lines.push("## LLM usage");
if (llm.length === 0) lines.push(`- llm calls: 0 (replay run used deterministic plan) ${src("events")}`);
for (const [p, v] of llmByProvider) lines.push(`- ${p}: ${v.calls} calls, ${v.in} in / ${v.out} out tokens ${src("llm.call events")}`);
lines.push(`- llm tokens total: ${llmTotal || "[measure]"} ${src("llm.call")}`);
lines.push(`- cache hits: ${cacheHits} (rate ${cacheRate}); tokens saved vs uncached baseline: ${cacheSaved} ${src("fixtures/llm-cache + llm.call.cache")}`);
lines.push("");
lines.push("## Bugs by status");
for (const [k, b] of bugs) lines.push(`- ${b.status}: ${b.title} ${src(b.evidence ?? k)}`);
lines.push("");
lines.push("## Verified fixes (failing before -> passing after)");
for (const e of verified) lines.push(`- ${(e.payload as { bugId?: string }).bugId}: ${e.evidence} ${src(e.evidence ?? "")}`);
if (!verified.length) lines.push("- none verified [measure]");
lines.push("");
lines.push("## Test phases");
for (const e of tests) lines.push(`- ${e.payload.suite} [${e.payload.phase}]: ${e.payload.passed} pass / ${e.payload.failed} fail ${src("test.run events")}`);
lines.push("");
lines.push("## Crosswalk");
lines.push(`- matched: ${M(xw.before)} -> ${M(xw.after)} on N=${M(xw.n)} sample rows ${src("workspace/data/crosswalk.csv recomputed")}`);
lines.push(`- hand-checked precision on 20 rows: [measure] (checked column empty)`);
lines.push("");
lines.push("## Reports");
for (const e of reports) lines.push(`- ${e.payload.path} approved=${e.payload.approved} ${src("report.drafted")}`);
lines.push("");
lines.push("## Honesty box");
lines.push("- Sous cannot patch the sponsor's server. It proposes mergeable patches + a client shim; applying data/report outputs asks a human (Confirmation gate; replay auto-approves and says so).");
lines.push("- Numbers not measured render as [measure], never estimates.");
lines.push(`- CocktailDB: disabled unless COCKTAILDB_ENABLED=true ${src(".env.example + 40-foodoscope-api.md")}`);

writeFileSync("PROOF.md", lines.join("\n") + "\n");

const proof = {
  generatedAt: new Date().toISOString(),
  eventCount: events.length,
  endpointsProbed: probes.length,
  liveCalls: probes.filter((e) => !e.payload.replay).length,
  llm: { total: llmTotal, byProvider: Object.fromEntries(llmByProvider), cacheHits, cacheRate, cacheSaved },
  bugs: [...bugs.values()].map((b) => b.status),
  verifiedFixes: verified.map((e) => (e.payload as { bugId?: string }).bugId),
  crosswalk: xw,
};
writeFileSync("proof.json", JSON.stringify(proof, null, 2));

const slides = [
  { headline: `Crosswalk matched ${M(xw.before)} -> ${M(xw.after)} of ${M(xw.n)}`, chart: "bar", data: [{ label: "before", v: xw.before }, { label: "after", v: xw.after }], source: "workspace/data/crosswalk.csv", as_of: proof.generatedAt },
  { headline: "Probe -> confirm -> fix -> verify funnel", chart: "funnel", data: [{ label: "probed", v: probes.length }, { label: "confirmed", v: [...bugs.values()].filter((b) => b.status === "CONFIRMED").length }, { label: "fixed", v: verified.length }, { label: "verified", v: verified.length }], source: "events/*.jsonl", as_of: proof.generatedAt },
  { headline: `LLM cache hit rate ${cacheRate}`, chart: "stat", data: [{ label: "hits", v: cacheHits }, { label: "saved tokens", v: cacheSaved }], source: "llm.call.cache", as_of: proof.generatedAt },
];
writeFileSync("proof.slides.json", JSON.stringify(slides, null, 2));
console.log(`PROOF.md + proof.json + proof.slides.json written from ${events.length} events`);
