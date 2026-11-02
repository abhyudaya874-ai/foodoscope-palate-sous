// run-intel — RivalWatch + ClaimReceipts over the search router. --replay = cache only, zero network.
import "../src/lib/config"; // side-effect: loads ~/.config/palate-sous.env + .env.local into process.env
import { readFileSync } from "node:fs";
import { createSearch } from "../src/lib/search/router";
import { rivalWatch } from "../src/lib/intel/rival-watch";
import { claimReceipts } from "../src/lib/intel/claim-receipts";
import { makeEmit } from "../src/lib/agent/emit";
import { JsonlEventBus } from "../src/lib/events/log";
import { WorkspaceStore } from "../src/lib/workspace/store";
import { registry } from "../src/lib/workspace/runs";
import { loadBudget } from "../src/lib/llm/budget";
import { eventToSse } from "../src/lib/ui/sseMap";
import { config } from "../src/lib/config";

const args = process.argv.slice(2);
const replay = args.includes("--replay");
const rivals = readFileSync("docs/rivals.txt", "utf8").split("\n")
  .map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
  .map((l) => { const [entity, seed] = l.split("|").map((s) => s.trim()); return { entity, seed: seed || undefined }; });

const CLAIMS = [
  "Foodoscope FlavorDB lists over 1000 natural ingredients",
  "Spoonacular API has a free tier with daily point limits",
  "Foodpairing offers a commercial food-pairing API",
];

const bus = new JsonlEventBus();
const chan = registry.create(`intel-${bus.runId}`);
const store = new WorkspaceStore(process.cwd(), bus, chan);
const emit = makeEmit(bus, chan, { replay, kind: "intel" });
const origEmit = bus.emit.bind(bus);
(bus as { emit: typeof origEmit }).emit = (t, a, p, e) => {
  const ev = origEmit(t, a, p, e);
  const sse = eventToSse(ev);
  if (sse) chan.push(sse.type, sse.data);
  return ev;
};

const search = createSearch({
  keys: { tavily: config.keys.tavily, exa: config.keys.exa },
  mode: replay ? "replay" : "live",
  cacheDir: "fixtures/search-cache",
  maxCalls: Number(loadBudget().maxSearchCalls ?? 12),
  emit,
});

const csv = async (path: string, rows: Array<Record<string, string>>) => {
  const header = Object.keys(rows[0] ?? { entity: "", claim: "", source_url: "", as_of: "", provider: "", confidence: "", evidence_id: "" });
  const table = [header, ...rows.map((r) => header.map((h) => r[h] ?? ""))];
  await store.csvUpsert(path, table, 0, { needsConfirmation: true, approved: true }); // replay auto-approve, logged
};

console.log(`intel ${replay ? "REPLAY" : "LIVE"} — ${rivals.length} rivals, ${CLAIMS.length} claims`);
for (const r of rivals) {
  try {
    const rows = await rivalWatch(r.entity, undefined, search, csv); // seed urls skipped to stay within 12-call cap
    console.log(`${r.entity}: ${rows.length} rows`);
  } catch (e) {
    console.log(`${r.entity}: ${e instanceof Error ? e.message.slice(0, 90) : e}`);
  }
}
try {
  const claims = await claimReceipts(CLAIMS, search, csv);
  console.log(`claims: ${claims.map((c) => c.verdict).join(",")}`);
} catch (e) {
  console.log(`claims: ${e instanceof Error ? e.message.slice(0, 90) : e}`);
}
console.log("done — rows in workspace/data/{rivals,claims}.csv");
chan.push("done", { runId: bus.runId });
chan.close();
