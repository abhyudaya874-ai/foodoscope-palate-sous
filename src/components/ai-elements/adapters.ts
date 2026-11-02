// Thin adapter: existing event stream (ViewItem[]) → AI Element props. No agent-loop changes.
import type { ViewItem } from "@/lib/ui/eventToView";
import type { PlanStep } from "@/components/ai-elements/plan";
import type { TestRow } from "@/components/ai-elements/tool";
import type { SourceRow } from "@/components/ai-elements/sources";

const STEP_LABEL: Record<string, string> = {
  probe: "Probing the API",
  detect: "Checking the contract",
  fix: "Writing the fix",
  verify: "Running the tests",
  ship: "Drafting the report",
  report: "Writing it up",
};

/** Plain-language label for tool/probe rows (presentation only). */
export function prettyTitle(t: string): string {
  const map: [RegExp, string][] = [
    [/^test\.run/i, "Ran the contract tests"],
    [/^report\.drafted/i, "Drafted the bug report"],
    [/^bug\.detected/i, "Confirmed a contract bug"],
    [/^fix\.verified/i, "Verified the fix (red → green)"],
    [/^llm\.call/i, "LLM call"],
    [/^search\.call/i, "Web search"],
    [/^browser\.step/i, "Browser step"],
    [/workspace\/data\/crosswalk\.csv/i, "Updated crosswalk.csv"],
    [/workspace\/reports\/bug-/i, "Wrote the bug report"],
    [/workspace\/bugs\//i, "Logged the repro"],
    [/workspace\/tests\//i, "Generated contract test"],
    [/workspace\/shim\//i, "Wrote the client shim"],
    [/^probe /i, "probe"],
  ];
  for (const [re, label] of map) if (re.test(t)) return typeof label === "function" ? t : label;
  return t;
}

export function planStepsFrom(items: ViewItem[]): PlanStep[] {
  const plan = items.find((i) => i.kind === "plan" && Array.isArray((i.data as { steps?: unknown[] }).steps));
  const raw = ((plan?.data.steps as { id?: string; kind?: string; endpoint?: string }[] | undefined) ?? []);
  const steps: PlanStep[] = raw.map((s) => ({
    id: String(s.id ?? s.kind ?? "step"),
    label: s.endpoint ? `probe ${s.endpoint}` : STEP_LABEL[String(s.kind)] ?? String(s.kind ?? "step"),
    status: "pending",
  }));
  // live status: each completed tool/test marks the matching step done (replay = deterministic order)
  const doneKinds = new Set(items.filter((i) => ["tool", "probe", "test", "patch", "csv"].includes(i.kind)).map((i) => i.title.split(" ")[0]));
  let cursor = 0;
  for (const i of items) {
    if (i.kind === "tool" && i.ok === false && steps[cursor]) { steps[cursor].status = "failed"; cursor++; continue; }
    if (["tool", "probe", "test", "patch", "csv"].includes(i.kind) && steps[cursor]) { steps[cursor].status = "done"; cursor++; }
  }
  if (doneKinds.size === 0 && steps.length) steps.forEach((s) => (s.status = "pending"));
  const running = items.some((i) => i.kind === "tool" && i.ok === undefined);
  if (running && steps[cursor]) steps[cursor].status = "running";
  else if (!running && steps.length && steps.every((s) => s.status === "pending") && items.length > 0) steps[0].status = "done";
  return steps;
}

export function sourcesFrom(items: ViewItem[]): SourceRow[] {
  return items.filter((i) => i.kind === "probe").map((p, idx) => ({
    n: idx + 1,
    title: p.title.replace(/^probe /, ""),
    detail: String((p.data as { fixture?: string }).fixture ?? p.detail ?? ""),
    confidence: p.ok === false ? "L" : "M",
    url: String((p.data as { fixture?: string }).fixture ?? ""),
  }));
}

export function stepsDuration(items: ViewItem[]): number {
  const t = items.filter((i) => i.latencyMs !== undefined).reduce((a, i) => a + (i.latencyMs ?? 0), 0);
  return t;
}

export function testRowsFrom(items: ViewItem[]): TestRow[] {
  return items.filter((i) => i.kind === "test").map((i) => ({
    name: i.title, status: i.ok ? ("pass" as const) : ("fail" as const), detail: i.detail,
  }));
}

export function terminalLinesFrom(items: ViewItem[]): string[] {
  return items.filter((i) => i.kind === "probe").map((p) => {
    const d = p.data as { status?: number; replay?: boolean };
    return `GET ${p.title.replace(/^probe /, "")} → ${d.status ?? "?"}${d.replay ? " (replayed)" : ""}`;
  });
}

export function lastProvider(items: ViewItem[]): { provider?: string; model?: string; latencyMs?: number } {
  const llm = [...items].reverse().find((i) => i.badge?.includes("/"));
  if (!llm?.badge) return {};
  const [provider, model] = llm.badge.split("/");
  return { provider, model, latencyMs: llm.latencyMs };
}
