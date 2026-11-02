"use client";
// Official patterns: Prompt Input + Model Selector + Suggestion + Context
// (https://ui.shadcn.com/docs/ai-elements/base/prompt-input.md, model-selector.md, suggestion.md, context.md)
import * as React from "react";
import { ArrowUpIcon, PlusIcon, SquareIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ComposerMode { id: string; label: string; icon: React.ReactNode }

export function PromptInput({
  value, onChange, onSend, onStop, running, disabled, placeholder = "Give Sous a goal…", modes, mode, onMode, modelLabel, big,
}: {
  value: string; onChange: (v: string) => void; onSend: () => void; onStop?: () => void;
  running?: boolean; disabled?: boolean; placeholder?: string;
  modes?: ComposerMode[]; mode?: string; onMode?: (id: string) => void; modelLabel?: string; big?: boolean;
}) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!running && !disabled) onSend(); }}
      className={cn("rounded-2xl border border-line-1 bg-bg-1 px-3 pb-2.5 pt-3 transition-[border-color,box-shadow] duration-200 focus-within:border-line-2 focus-within:shadow-[0_0_0_4px_var(--accent-dim)]", big && "px-4 pt-4")}
    >
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!running && !disabled) onSend(); } }}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        aria-label="goal for Sous"
        className={cn("max-h-40 w-full resize-none border-0 bg-transparent px-1 py-1 text-text-1 placeholder:text-text-3 focus-visible:ring-0", big ? "min-h-12 text-[16px]" : "min-h-9 text-[14px]")}
      />
      <div className="flex items-center gap-2 pt-1.5">
        <button type="button" aria-label="attach file" disabled className="grid size-8 place-items-center rounded-full text-text-3 hover:bg-bg-2 hover:text-text-2 disabled:opacity-40">
          <PlusIcon className="size-4" />
        </button>
        {modes && (
          <div role="radiogroup" aria-label="mode" className="flex rounded-full bg-bg-0 p-0.5 text-[12px]">
            {modes.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => onMode?.(m.id)}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors duration-200", mode === m.id ? "bg-bg-2 text-text-1" : "text-text-3 hover:text-text-2")}>
                {m.icon}{m.label}
              </button>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {modelLabel && <span className="hidden text-[12px] text-text-3 sm:inline">{modelLabel}</span>}
          {running ? (
            <button type="button" onClick={onStop} aria-label="stop run" className="grid size-8 place-items-center rounded-full bg-danger-dim text-danger transition-transform hover:scale-105">
              <SquareIcon className="size-3.5" />
            </button>
          ) : (
            <button type="submit" disabled={disabled || !value.trim()} aria-label="send goal"
              className="grid size-8 place-items-center rounded-full bg-text-1 text-bg-0 transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:bg-bg-2 disabled:text-text-3">
              <ArrowUpIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export function Suggestion({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="rounded-full border border-line-1 px-3.5 py-1.5 text-[13px] text-text-2 transition-all duration-200 hover:-translate-y-px hover:border-accent/60 hover:bg-bg-1 hover:text-text-1">
      {children}
    </button>
  );
}

/** Context: tool-budget meter with label + tooltip text. */
export function Context({ used, cap, label = "tool calls" }: { used: number; cap: number; label?: string }) {
  const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  return (
    <span title={`${label}: ${used} of ${cap} used`} className="flex items-center gap-1.5 text-[11px] text-text-2">
      <span className="text-text-3">{label}</span>
      <span className="tnum text-text-1">{used}/{cap}</span>
      <span className="h-1 w-14 overflow-hidden rounded-full bg-bg-2" role="progressbar" aria-valuenow={used} aria-valuemax={cap} aria-label={label}>
        <span className={cn("block h-full rounded-full", pct > 80 ? "bg-danger" : pct > 50 ? "bg-warn" : "bg-accent")} style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}
