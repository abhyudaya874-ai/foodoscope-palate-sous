import type { SseMessage } from "./sseMap";

export type ViewKind =
  | "reasoning" | "text" | "tool" | "plan" | "patch" | "csv" | "test"
  | "probe" | "budget" | "xp" | "confirm" | "checkpoint" | "done" | "error";

export interface ViewItem {
  seq: number;
  kind: ViewKind;
  title: string;
  detail?: string;
  data: Record<string, unknown>;
  badge?: string; // provider/model
  latencyMs?: number;
  tokens?: number;
  ok?: boolean;
}

const MODEL_BADGE: Record<string, string> = {
  "llm.call": "llm",
  "probe.call": "api",
};

export function mapEvent(m: SseMessage): ViewItem | null {
  const d = (m.data ?? {}) as Record<string, unknown>;
  const ev = String(d.event ?? m.type);
  switch (m.type) {
    case "plan":
      return { seq: m.seq, kind: "plan", title: "Plan", data: d };
    case "reasoning.delta":
      return { seq: m.seq, kind: "reasoning", title: "thinking", detail: String(d.text ?? ""), data: d };
    case "text.delta":
      return { seq: m.seq, kind: "text", title: "answer", detail: String(d.text ?? ""), data: d };
    case "tool.start":
      return { seq: m.seq, kind: "tool", title: String(d.tool ?? "tool"), detail: JSON.stringify(d).slice(0, 200), data: d, ok: undefined };
    case "tool.end":
      return {
        seq: m.seq, kind: "tool", title: ev === "llm.call" ? `LLM ${d.role ?? ""}` : ev,
        detail: `${d.provider ?? ""} ${d.model ?? ""}`.trim() || JSON.stringify(d).slice(0, 160),
        data: d, badge: d.provider ? `${d.provider}/${d.model}` : undefined,
        latencyMs: typeof d.latencyMs === "number" ? d.latencyMs : undefined,
        tokens: typeof d.tokensIn === "number" && typeof d.tokensOut === "number" ? Number(d.tokensIn) + Number(d.tokensOut) : undefined,
        ok: true,
      };
    case "file.patch":
      return { seq: m.seq, kind: "patch", title: String(d.path ?? "file"), detail: `+${d.added ?? 0} −${d.removed ?? 0} · ${d.status ?? ""}`, data: d, ok: d.status === "applied" };
    case "csv.upsert":
      return { seq: m.seq, kind: "csv", title: String(d.path ?? "csv"), detail: `+${d.added ?? 0} rows, ${d.updated ?? 0} updated · ${d.rows ?? "?"} rows`, data: d, ok: true };
    case "test.result": {
      const failed = Number(d.failed ?? 0);
      return { seq: m.seq, kind: "test", title: String(d.suite ?? "tests"), detail: `${d.passed ?? 0} passed · ${failed} failed`, data: d, ok: failed === 0 };
    }
    case "probe":
      return { seq: m.seq, kind: "probe", title: String(d.endpoint ?? ""), detail: `${d.status} · ${d.latencyMs}ms${d.replay ? " · replay" : ""}`, data: d, badge: MODEL_BADGE["probe.call"], latencyMs: Number(d.latencyMs) || undefined, ok: Number(d.status) < 400 };
    case "budget":
      return { seq: m.seq, kind: "budget", title: "budget", detail: `${d.kind}: ${d.used}/${d.cap}`, data: d };
    case "xp":
      return { seq: m.seq, kind: "xp", title: `+${d.amount} XP`, detail: String(d.reason ?? ""), data: d };
    case "confirm.request":
      return { seq: m.seq, kind: "confirm", title: "approval needed", detail: String(d.path ?? ""), data: d };
    case "checkpoint":
      return { seq: m.seq, kind: "checkpoint", title: "checkpoint", detail: String(d.id ?? ""), data: d };
    case "checkpoint.restore":
      return { seq: m.seq, kind: "checkpoint", title: "restored", detail: String(d.id ?? ""), data: d };
    case "done":
      return { seq: m.seq, kind: "done", title: "done", detail: JSON.stringify(d).slice(0, 200), data: d };
    case "tool.error":
      return { seq: m.seq, kind: "error", title: "tool error", detail: `${d.kind}: ${String(d.message ?? "").slice(0, 200)}`, data: d, ok: false };
    default:
      return null;
  }
}

export function mapEvents(msgs: SseMessage[]): ViewItem[] {
  return msgs.map(mapEvent).filter((v): v is ViewItem => v !== null);
}
