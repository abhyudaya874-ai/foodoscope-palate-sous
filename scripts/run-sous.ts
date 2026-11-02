// Sous runner: --replay (fixtures only, zero network) or --live (record fixtures).
// Also: --fixture <file> saves the SSE stream for the demo replay.
import { readFileSync, mkdirSync } from "node:fs";
import { JsonlEventBus } from "../src/lib/events/log";
import { WorkspaceStore } from "../src/lib/workspace/store";
import { FoodoscopeClient } from "../src/lib/foodoscope/client";
import { Budget, loadBudget } from "../src/lib/llm/budget";
import { RunChannel, saveReplay, registry } from "../src/lib/workspace/runs";
import { runSous } from "../src/lib/agent/loop";
import { eventToSse } from "../src/lib/ui/sseMap";

try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* no env file */ }

const args = process.argv.slice(2);
const live = args.includes("--live");
const fixtureOut = args.includes("--fixture") ? args[args.indexOf("--fixture") + 1] : undefined;
const autoApprove = args.includes("--yes") || !live; // replay/non-live auto-approves (logged)

const bus = new JsonlEventBus();
const chan = registry.create(`sous-${bus.runId}`);
const store = new WorkspaceStore(process.cwd(), bus, chan);
const client = new FoodoscopeClient(live ? "record" : "replay", undefined, { minIntervalMs: live ? 2500 : 0 });
const budget = new Budget(loadBudget(), bus);

// bridge: bus events -> SSE messages on the channel
const origEmit = bus.emit.bind(bus);
(bus as { emit: typeof origEmit }).emit = (type, actor, payload, evidence) => {
  const e = origEmit(type, actor, payload, evidence);
  const sse = eventToSse(e);
  if (sse) chan.push(sse.type, sse.data);
  return e;
};

mkdirSync("workspace/reports", { recursive: true });
console.log(`sous ${live ? "LIVE" : "REPLAY"} run ${bus.runId}`);
try {
  const res = await runSous({ ctx: { bus, chan, store, client, budget, autoApprove }, goal: "probe foodoscope api, detect contract issues, ship verified fixes", llm: live ? "live" : "off" });
  console.log("findings:", res.findings.map((f) => `${f.id}:${f.status}`).join(" "));
  console.log("crosswalk:", JSON.stringify(res.crosswalk));
  console.log("verified:", res.verified.join(",") || "none");
  if (res.stoppedEarly) console.log("stopped early:", res.stoppedEarly);
} finally {
  chan.push("done", { runId: bus.runId });
  chan.close();
  if (fixtureOut) {
    saveReplay(chan, fixtureOut);
    console.log("fixture saved:", fixtureOut);
  }
  console.log("events:", `events/${bus.runId}.jsonl`);
}
