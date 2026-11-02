import { z } from "zod";

export const actorSchema = z.union([
  z.object({ provider: z.string(), model: z.string() }),
  z.literal("system"),
]);
export type Actor = z.infer<typeof actorSchema>;

const base = {
  id: z.string(),
  ts: z.string(),
  runId: z.string(),
  actor: actorSchema,
  evidence: z.string().optional(),
};

export const eventSchemas = {
  "run.start": z.object({ ...base, type: z.literal("run.start"), payload: z.object({ goal: z.string(), replay: z.boolean() }) }),
  "run.end": z.object({ ...base, type: z.literal("run.end"), payload: z.object({ summary: z.string(), done: z.array(z.string()), remaining: z.array(z.string()) }) }),
  "budget.update": z.object({ ...base, type: z.literal("budget.update"), payload: z.object({ kind: z.enum(["api", "llm", "tool", "wallet"]), used: z.number(), cap: z.number() }) }),
  "llm.call": z.object({ ...base, type: z.literal("llm.call"), payload: z.object({ role: z.string(), provider: z.string(), model: z.string(), tokensIn: z.number(), tokensOut: z.number(), latencyMs: z.number(), cache: z.boolean(), fallback: z.boolean().optional(), promptHash: z.string().optional() }) }),
  "probe.call": z.object({ ...base, type: z.literal("probe.call"), payload: z.object({ endpoint: z.string(), method: z.string(), status: z.number(), latencyMs: z.number(), fixture: z.string().optional(), replay: z.boolean(), tokensSpent: z.number() }) }),
  "bug.detected": z.object({ ...base, type: z.literal("bug.detected"), payload: z.object({ hypothesis: z.string(), title: z.string(), kind: z.string().optional(), reproPath: z.string(), status: z.enum(["CONFIRMED", "NOT_REPRODUCED", "INCONCLUSIVE"]) }) }),
  "patch.proposed": z.object({ ...base, type: z.literal("patch.proposed"), payload: z.object({ path: z.string(), diffStats: z.object({ added: z.number(), removed: z.number() }), needsConfirmation: z.boolean() }) }),
  "patch.applied": z.object({ ...base, type: z.literal("patch.applied"), payload: z.object({ path: z.string(), approved: z.boolean(), tokenDeltaVsBaseline: z.number().optional() }) }),
  "test.run": z.object({ ...base, type: z.literal("test.run"), payload: z.object({ suite: z.string(), passed: z.number(), failed: z.number(), phase: z.enum(["before", "after", "standalone"]) }) }),
  "fix.verified": z.object({ ...base, type: z.literal("fix.verified"), payload: z.object({ bugId: z.string(), testPath: z.string(), failedBefore: z.boolean(), passesAfter: z.boolean() }) }),
  "report.drafted": z.object({ ...base, type: z.literal("report.drafted"), payload: z.object({ path: z.string(), bugId: z.string().optional(), approved: z.boolean() }) }),
  "xp.awarded": z.object({ ...base, type: z.literal("xp.awarded"), payload: z.object({ amount: z.number(), reason: z.string(), rankUp: z.boolean().optional() }) }),
  "search.call": z.object({ ...base, type: z.literal("search.call"), payload: z.object({ intent: z.string(), query: z.string(), cached: z.boolean().optional(), providers: z.array(z.string()).optional(), results: z.number().optional(), calls: z.number().optional(), latencyMs: z.number().optional() }) }),
  "browser.step": z.object({ ...base, type: z.literal("browser.step"), payload: z.object({ step: z.number(), url: z.string(), action: z.string(), ok: z.boolean().optional(), blocked: z.boolean().optional(), thought: z.string().optional() }) }),
} as const;

export const eventSchema = z.discriminatedUnion("type", [
  eventSchemas["run.start"], eventSchemas["run.end"], eventSchemas["budget.update"],
  eventSchemas["llm.call"], eventSchemas["probe.call"], eventSchemas["bug.detected"],
  eventSchemas["patch.proposed"], eventSchemas["patch.applied"], eventSchemas["test.run"],
  eventSchemas["fix.verified"], eventSchemas["report.drafted"], eventSchemas["xp.awarded"],
  eventSchemas["search.call"], eventSchemas["browser.step"],
]);
export type EventType = keyof typeof eventSchemas;
export type AppEvent = z.infer<typeof eventSchema>;
export type PayloadOf<T extends EventType> = z.infer<(typeof eventSchemas)[T]>["payload"];
