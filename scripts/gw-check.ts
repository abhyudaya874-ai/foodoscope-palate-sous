// One-shot live gateway check for a role (default planner).
import { readFileSync } from "node:fs";
import { complete } from "../src/lib/llm/gateway";
import { MemoryEventBus } from "../src/lib/events/log";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const bus = new MemoryEventBus();
const role = (process.argv[2] ?? "planner") as "planner";
const out = await complete(
  { role, messages: [{ role: "user", content: 'Reply with JSON {"ok":true}' }], maxTokens: 32 },
  { bus },
);
console.log("provider=%s model=%s latency=%dms fallback=%s text=%s", out.provider, out.model, out.latencyMs, out.fallback, out.text.slice(0, 60));
console.log("events:", bus.events.map((e) => `${e.type}`).join(","));
