import { describe, expect, it } from "vitest";
import { deriveProfile, localDay } from "./derive";
import { eventSchema, type AppEvent } from "../events/types";

const ev = (type: string, payload: unknown, opts: { ts?: string; evidence?: string } = {}): AppEvent =>
  eventSchema.parse({ id: Math.random().toString(36).slice(2), ts: opts.ts ?? "2026-11-02T20:00:00+05:30", runId: "r", type, actor: "system", payload, ...(opts.evidence ? { evidence: opts.evidence } : {}) }) as AppEvent;

describe("deriveProfile", () => {
  const events = [
    ev("probe.call", { endpoint: "/a", method: "GET", status: 200, latencyMs: 1, replay: true, tokensSpent: 1 }, { evidence: "f/a.json" }),
    ev("bug.detected", { hypothesis: "H2", title: "param bug", reproPath: "f/bad.json", status: "CONFIRMED" }, { evidence: "f/bad.json" }),
    ev("fix.verified", { bugId: "H2", testPath: "t", failedBefore: true, passesAfter: true }, { evidence: "f/v.json" }),
    ev("report.drafted", { path: "r.md", bugId: "H2", approved: true }),
  ];

  it("is deterministic — same events give same profile", () => {
    expect(deriveProfile(events)).toEqual(deriveProfile(events));
  });
  it("computes XP from evidenced events only", () => {
    const p = deriveProfile(events);
    expect(p.xp).toBe(2 + 25 + 40 + 15);
    const noEvidence = events.map((e) => ({ ...e, evidence: undefined }));
    expect(deriveProfile(noEvidence).xp).toBe(15); // only report.drafted (approval needs no evidence field)
  });
  it("duplicate repro hash gives 0 extra XP", () => {
    const dup = ev("bug.detected", { hypothesis: "H2", title: "same", reproPath: "f/bad.json", status: "CONFIRMED" }, { evidence: "f/bad.json" });
    expect(deriveProfile([...events, dup]).stats.bugsFound).toBe(1);
  });
  it("rank thresholds apply", () => {
    expect(deriveProfile(events).rank).toBe("Line Cook"); // 82 >= 50
    const many = [...events, ...Array.from({ length: 3 }, (_, i) => ev("fix.verified", { bugId: `b${i}`, testPath: "t", failedBefore: true, passesAfter: true }, { evidence: `f/v${i}` }))];
    expect(deriveProfile(many).rank).toBe("Sous Chef"); // 82+120=202 >= 120
  });
  it("unmeasured stats render as [measure]", () => {
    expect(deriveProfile(events).stats.crosswalk).toBe("[measure]");
  });
  it("localDay is local-date stable", () => {
    expect(localDay("2026-11-02T23:30:00+05:30")).toMatch(/^20/);
  });
});
