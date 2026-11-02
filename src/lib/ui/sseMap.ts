import type { AppEvent } from "../events/types";

export type SseType =
  | "plan" | "reasoning.delta" | "text.delta" | "tool.start" | "tool.end" | "tool.error"
  | "file.patch" | "csv.upsert" | "test.result" | "budget" | "xp"
  | "confirm.request" | "checkpoint" | "checkpoint.restore" | "probe" | "done";

export interface SseMessage {
  seq: number;
  ts: string;
  type: SseType;
  data: unknown;
}

const EVENT_TO_SSE: Record<string, SseType | null> = {
  "run.start": "plan",
  "run.end": "done",
  "budget.update": "budget",
  "llm.call": "tool.end",
  "probe.call": "probe",
  "bug.detected": "tool.end",
  "patch.proposed": "file.patch",
  "patch.applied": null, // store pushes its own richer file.patch
  "test.run": "test.result",
  "fix.verified": "test.result",
  "report.drafted": "tool.end",
  "xp.awarded": "xp",
  "search.call": "tool.end",
  "browser.step": "tool.end",
};

export function eventToSseType(type: string): SseType | null {
  return EVENT_TO_SSE[type] ?? null;
}

export function eventToSse(e: AppEvent): { type: SseType; data: unknown } | null {
  const t = eventToSseType(e.type);
  if (!t) return null;
  return { type: t, data: { event: e.type, ...e.payload, evidence: e.evidence } };
}
