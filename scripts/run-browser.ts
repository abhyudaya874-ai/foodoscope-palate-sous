// run-browser — Comet-style read-only tasks. --replay reads fixtures/browser/<task>.jsonl (zero browser, zero network).
import "../src/lib/config";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { runBrowserTask, type AgentDeps, type DecideCtx } from "../src/lib/browser/agent";
import { createPlaywrightDriver } from "../src/lib/browser/pw-driver";
import { makeDecide } from "../src/lib/browser/decide";
import type { Action, Driver, Observation } from "../src/lib/browser/types";
import { makeEmit } from "../src/lib/agent/emit";
import { JsonlEventBus } from "../src/lib/events/log";
import { WorkspaceStore } from "../src/lib/workspace/store";
import { registry } from "../src/lib/workspace/runs";
import { loadBudget } from "../src/lib/llm/budget";
import { eventToSse } from "../src/lib/ui/sseMap";
import { complete } from "../src/lib/llm/gateway";

const args = process.argv.slice(2);
const replay = args.includes("--replay");
const headed = args.includes("--headed");
const taskArg = args.find((a) => a.startsWith("--task="))?.split("=")[1] ?? "docs";

interface Recorded { obs: Observation; raw: unknown }

const TASKS: Record<string, { goal: string; startUrl: string; allowDomains: string[]; csv: string }> = {
  docs: {
    goal: "Extract the page text once (no ref needed; it contains both FlavorDB and RecipeDB counts), then immediately done citing that key. Do not extract twice",
    startUrl: "https://www.foodoscope.com/",
    allowDomains: ["foodoscope.com"],
    csv: "workspace/data/ui_facts.csv",
  },
  rival: {
    goal: "Find the pricing or free-tier text for Spoonacular's food API",
    startUrl: "https://spoonacular.com/food-api",
    allowDomains: ["spoonacular.com"],
    csv: "workspace/data/rivals.csv",
  },
};
const task = TASKS[taskArg];
if (!task) throw new Error(`unknown task ${taskArg}`);

const bus = new JsonlEventBus();
const chan = registry.create(`browser-${bus.runId}`);
const store = new WorkspaceStore(process.cwd(), bus, chan);
const emit = makeEmit(bus, chan, { replay, kind: "browser" });
const origEmit = bus.emit.bind(bus);
(bus as { emit: typeof origEmit }).emit = (t, a, p, e) => {
  const ev = origEmit(t, a, p, e);
  const sse = eventToSse(ev);
  if (sse) chan.push(sse.type, sse.data);
  return ev;
};

const fixture = `fixtures/browser/${taskArg}.jsonl`;
mkdirSync("fixtures/browser", { recursive: true });
if (!replay) writeFileSync(fixture, "");

const ACTION_PRIM: Record<string, string> = { goto: "url", click: "ref", type: "ref", select: "ref", scroll: "dir", extract: "key", fail: "reason" };
// Models often emit {"action":{"goto":"url"}} or {"action":{"click":{"ref":"e1"}}}; coerce to the Decision schema.
function coerceDecision(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const d = raw as Record<string, unknown>;
  const a = d.action;
  if (typeof a !== "object" || a === null) return raw;
  const rec = a as Record<string, unknown>;
  if (typeof rec.type === "string") return raw;
  // {"action":{"action":"goto","url":...}} or {"action":{"name":"goto","url":...}}
  const alias = rec.action ?? rec.name;
  if (typeof alias === "string" && ACTION_PRIM[alias]) {
    const { action: _a, name: _n, ...fields } = rec;
    return { ...d, action: { type: alias, ...fields } };
  }
  const keys = Object.keys(rec);
  // {"done":true,"result":r,"evidenceKeys":[...]} -> {"type":"done","result":r,"evidenceKeys":[...]}
  const boolKey = keys.find((k) => rec[k] === true && ACTION_PRIM[k] !== undefined || k === "done" || k === "back");
  if (boolKey) {
    const { [boolKey]: _b, ...fields } = rec;
    return { ...d, action: { type: boolKey, ...fields } };
  }
  if (keys.length !== 1 || !ACTION_PRIM[keys[0]]) return raw;
  const [k] = keys;
  const v = rec[k];
  const action = typeof v === "object" && v !== null ? { type: k, ...v } : { type: k, [ACTION_PRIM[k]]: v };
  if (action.type === "done" && !Array.isArray((action as Record<string, unknown>).evidenceKeys))
    (action as Record<string, unknown>).evidenceKeys = Object.keys(rec.evidenceKeys ?? {});
  return { ...d, action };
}

const inner = makeDecide(async (messages) => {
  const r = await complete({ role: "browser", messages, temperature: 0, maxTokens: 1500 });
  return r.text;
});
const liveDecide = async (ctx: DecideCtx): Promise<unknown> => coerceDecision(await inner(ctx));

function replayDriver(lines: Recorded[]): Driver {
  let i = 0;
  return {
    observe: async () => lines[Math.min(i, lines.length - 1)].obs,
    act: async (a: Action) => {
      const rec = lines[Math.min(i + 1, lines.length - 1)];
      i += 1;
      return a.type === "extract" ? { ok: true, extracted: rec.obs.text.slice(0, 800) } : { ok: true };
    },
    close: async () => {},
  };
}

function replayDecide(lines: Recorded[]) {
  let i = 0;
  return async () => lines[Math.min(i++, lines.length - 1)].raw;
}

function liveDriver(page: import("../src/lib/browser/pw-driver").PageLike, close: () => Promise<void>, obsLog: Observation[]): Driver {
  const d = createPlaywrightDriver(page, close);
  return {
    observe: async () => { const o = await d.observe(); obsLog.push(o); return o; },
    act: d.act,
    close: d.close,
  };
}

async function main() {
  const maxSteps = Number(loadBudget().maxBrowserSteps ?? 15);
  const obsLog: Observation[] = [];
  let driver: Driver;
  let decide: AgentDeps["decide"];
  let page: import("../src/lib/browser/pw-driver").PageLike | undefined;

  if (replay) {
    const lines = readFileSync(fixture, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Recorded);
    driver = replayDriver(lines);
    decide = replayDecide(lines);
  } else {
    const { chromium } = await import("playwright");
    const b = await chromium.launch({ headless: !headed });
    page = (await b.newPage()) as unknown as import("../src/lib/browser/pw-driver").PageLike;
    driver = liveDriver(page, () => b.close(), obsLog);
    decide = async (ctx) => {
      const raw = await liveDecide(ctx);
      if (process.env.DEBUG) console.error("decide raw:", JSON.stringify(raw).slice(0, 300));
      appendFileSync(fixture, JSON.stringify({ obs: obsLog[obsLog.length - 1], raw }) + "\n");
      return raw;
    };
    await page.goto(task.startUrl, { timeout: 20_000, waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined); // let the SPA hydrate before first observe
  }

  const result = await runBrowserTask(task.goal, {
    driver, decide,
    allowDomains: task.allowDomains,
    maxSteps,
    emit,
    confirm: async () => false, // scripts auto-deny; the UI wires the Confirmation element
  });
  await driver.close();

  const today = new Date().toISOString().slice(0, 10);
  const eid = (u: string) => createHash("sha1").update(u).digest("hex").slice(0, 10);
  const rows: Record<string, string>[] = taskArg === "rival"
    ? Object.values(result.extracted).map((v) => ({
        entity: "Spoonacular", claim: v.text.slice(0, 800).replaceAll(",", " "),
        source_url: v.url, as_of: today, provider: "browser", confidence: "L", evidence_id: eid(v.url),
      }))
    : Object.entries(result.extracted).map(([k, v]) => ({
        fact: k, value: v.text.slice(0, 800).replaceAll(",", " "),
        source_url: v.url, source: "browser", flagged: String(v.flagged),
      }));
  if (rows.length) {
    const header = Object.keys(rows[0]);
    await store.csvUpsert(task.csv, [header, ...rows.map((r) => header.map((h) => r[h] ?? ""))], 0, { needsConfirmation: true, approved: true });
  }
  console.log(`${taskArg}: ${result.status} steps=${result.steps}${result.reason ? " reason=" + result.reason : ""} extracted=${Object.keys(result.extracted).join(",") || "none"}`);
  chan.close();
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
