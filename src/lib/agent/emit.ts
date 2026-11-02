// Adapts the contract modules' loose Emit(type, payload) to our typed EventBus + SSE channel.
import type { EventBus } from "../events/log";
import type { PushChannel } from "../workspace/store";
import type { Emit } from "../search/types";

export function makeEmit(bus: EventBus, chan: PushChannel, opts: { replay: boolean; kind?: string }): Emit {
  return (type, payload) => {
    switch (type) {
      case "run.start":
        bus.emit("run.start", "system", { goal: String(payload.goal ?? ""), replay: opts.replay });
        chan.push("plan", { source: "deterministic", steps: [{ id: opts.kind ?? "task", kind: "probe" }] });
        break;
      case "run.end":
        bus.emit("run.end", "system", {
          summary: `${opts.kind ?? "task"} ${String(payload.status ?? "done")}`,
          done: [`steps:${payload.steps ?? "?"}`], remaining: [],
        });
        chan.push("done", { status: payload.status });
        break;
      case "browser.step": {
        const p = payload as { step: number; url: string; action: string; ok?: boolean; blocked?: boolean; thought?: string };
        bus.emit("browser.step", "system", p);
        if (p.thought) chan.push("reasoning.delta", { text: p.thought });
        chan.push("tool.end", { event: "browser.step", action: p.action, url: p.url, ok: p.ok, blocked: p.blocked, provider: "browser" });
        break;
      }
      case "search.call": {
        const p = payload as { intent: string; query: string; cached?: boolean; providers?: string[]; results?: number; calls?: number; latencyMs?: number };
        bus.emit("search.call", "system", p);
        chan.push("tool.end", { event: "search.call", intent: p.intent, query: p.query, provider: (p.providers ?? []).join("+") || "cache", cached: p.cached, latencyMs: p.latencyMs, results: p.results });
        break;
      }
      case "bug.detected":
        bus.emit("bug.detected", "system", {
          hypothesis: "INJ", title: `instruction-like text flagged at ${String(payload.source ?? "unknown")}`,
          kind: String(payload.kind ?? "injection"), reproPath: String(payload.source ?? ""), status: "CONFIRMED",
        });
        break;
      default:
        break;
    }
  };
}
