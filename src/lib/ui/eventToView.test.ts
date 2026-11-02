import { describe, expect, it } from "vitest";
import { mapEvent, mapEvents } from "./eventToView";
import type { SseMessage } from "./sseMap";

const msg = (type: string, data: unknown, seq = 1): SseMessage => ({ seq, ts: "2026-11-02T00:00:00Z", type: type as SseMessage["type"], data });

describe("eventToView", () => {
  it("maps reasoning.delta to reasoning", () => {
    expect(mapEvent(msg("reasoning.delta", { text: "probing x" }))?.kind).toBe("reasoning");
  });
  it("maps llm.call to tool card with model badge + tokens", () => {
    const v = mapEvent(msg("tool.end", { event: "llm.call", role: "planner", provider: "groq", model: "m1", tokensIn: 10, tokensOut: 5, latencyMs: 42 }));
    expect(v?.badge).toBe("groq/m1");
    expect(v?.tokens).toBe(15);
    expect(v?.latencyMs).toBe(42);
  });
  it("maps file.patch with diff stats", () => {
    const v = mapEvent(msg("file.patch", { path: "workspace/data/x.csv", added: 4, removed: 0, status: "applied" }));
    expect(v?.kind).toBe("patch");
    expect(v?.detail).toContain("+4");
  });
  it("maps test.result to test", () => {
    expect(mapEvent(msg("test.result", { suite: "contract", passed: 5, failed: 0 }))?.ok).toBe(true);
    expect(mapEvent(msg("test.result", { suite: "contract", passed: 3, failed: 2 }))?.ok).toBe(false);
  });
  it("maps probe to probe with status", () => {
    const v = mapEvent(msg("probe", { endpoint: "/flavordb/x", status: 200, latencyMs: 900, replay: true }));
    expect(v?.kind).toBe("probe");
    expect(v?.ok).toBe(true);
    expect(v?.detail).toContain("replay");
  });
  it("maps confirm.request, budget, xp, done", () => {
    expect(mapEvent(msg("confirm.request", { path: "workspace/reports/b.md" }))?.kind).toBe("confirm");
    expect(mapEvent(msg("budget", { kind: "api", used: 3, cap: 30 }))?.kind).toBe("budget");
    expect(mapEvent(msg("xp", { amount: 40, reason: "fix" }))?.title).toBe("+40 XP");
    expect(mapEvent(msg("done", {}))?.kind).toBe("done");
  });
  it("filters unknown message types", () => {
    expect(mapEvents([msg("nope", {}), msg("xp", { amount: 1 })])).toHaveLength(1);
  });
});
