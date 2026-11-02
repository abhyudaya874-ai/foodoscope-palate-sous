"use client";
// Official pattern: Model Selector (https://ui.shadcn.com/docs/ai-elements/base/model-selector.md)
// Renders ONLY what the gateway reports; when nothing is configured it shows a guided state.
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type Health = "ok" | "degraded" | "none";
const DOT: Record<Health, string> = { ok: "bg-accent", degraded: "bg-warn", none: "bg-text-3" };

export function ModelSelector({
  provider, model, health, latencyMs, onOpenChange,
}: {
  provider?: string; model?: string; health: Health; latencyMs?: number; onOpenChange?: () => void;
}) {
  const label = provider && model ? `${provider} · ${model.split("/").pop()}` : provider ? `Provider · ${provider}` : "Provider · not connected";
  if (health === "none") {
    // guided state: labelled pill + how-to-fix hint (no interactive Select with no options)
    return (
      <span title="Add provider keys to ~/.config/palate-sous.env or .env.local to enable live LLM calls"
        className="inline-flex h-7 items-center gap-2 rounded-md border border-line-1 bg-bg-1 px-2 text-[11px] text-text-2">
        <span aria-hidden className="size-1.5 rounded-full bg-text-3" />
        Provider · not connected
        <span className="text-text-3">add keys to enable</span>
      </span>
    );
  }
  return (
    <Select onOpenChange={onOpenChange}>
      <SelectTrigger
        aria-label="model provider"
        className="h-7 w-auto gap-2 border-line-1 bg-bg-1 px-2 text-[11px] text-text-2 data-[placeholder]:text-text-2"
      >
        <span aria-hidden className={cn("size-1.5 rounded-full", DOT[health])} />
        <SelectValue placeholder={label}>{label}</SelectValue>
        {latencyMs !== undefined && <span className="tnum text-text-3">{latencyMs}ms</span>}
      </SelectTrigger>
      <SelectContent className="border-line-1 bg-bg-1 text-[12px] text-text-2">
        <SelectItem value={model ?? provider ?? "none"} className="text-text-1">
          {provider && model ? `${provider} / ${model}` : provider ? `${provider} · free tier` : "No provider key configured"}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

/** Reasoning-effort segmented control (labelled, tooltip via title). */
export function ReasoningLevel({ value, onChange }: { value: "low" | "medium" | "high"; onChange?: (v: "low" | "medium" | "high") => void }) {
  return (
    <div role="radiogroup" aria-label="reasoning effort" title="Reasoning effort" className="flex overflow-hidden rounded-md border border-line-1 bg-bg-1 text-[11px]">
      {(["low", "medium", "high"] as const).map((v) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange?.(v)}
          className={cn("px-2 py-1 capitalize text-text-3 hover:text-text-2", value === v && "bg-accent-dim text-accent")}>
          {v}
        </button>
      ))}
    </div>
  );
}

/** Live | Replay mode switch — unmistakable, labelled. */
export function ModeSwitch({ mode, onChange }: { mode: "live" | "replay"; onChange?: (m: "live" | "replay") => void }) {
  return (
    <div role="radiogroup" aria-label="run mode" className="flex overflow-hidden rounded-md border border-line-1 text-[11px]">
      {(["live", "replay"] as const).map((m) => (
        <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => onChange?.(m)}
          className={cn("px-2.5 py-1 capitalize",
            mode === m
              ? m === "replay" ? "bg-warn-dim text-warn" : "bg-accent-dim text-accent"
              : "bg-bg-1 text-text-3 hover:text-text-2")}>
          {m}
        </button>
      ))}
    </div>
  );
}
