"use client";
// Official patterns: Prompt Input + Model Selector + Suggestion + Context
// (https://ui.shadcn.com/docs/ai-elements/base/prompt-input.md, model-selector.md, suggestion.md, context.md)
import * as React from "react";
import { ArrowUpIcon, PaperclipIcon, SquareIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

export function PromptInput({
  value, onChange, onSend, onStop, running, disabled, placeholder = "Give Sous a goal…",
}: {
  value: string; onChange: (v: string) => void; onSend: () => void; onStop?: () => void;
  running?: boolean; disabled?: boolean; placeholder?: string;
}) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!running && !disabled) onSend(); }}
      className="rounded-lg border border-line-1 bg-bg-1 p-2 transition-colors focus-within:border-line-2"
    >
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (!running && !disabled) onSend(); } }}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        aria-label="goal for Sous"
        className="max-h-40 min-h-9 w-full resize-none border-0 bg-transparent px-2 py-1.5 text-[13px] text-text-1 placeholder:text-text-3 focus-visible:ring-0"
      />
      <div className="flex items-center gap-2 px-1 pt-1">
        <button type="button" aria-label="attach file" disabled className="grid size-7 place-items-center rounded-md text-text-3 hover:bg-bg-2 hover:text-text-2 disabled:opacity-40">
          <PaperclipIcon className="size-3.5" />
        </button>
        <span className="text-[11px] text-text-3">
          <Kbd className="border-line-1 bg-bg-2 text-text-3">⌘</Kbd> <Kbd className="border-line-1 bg-bg-2 text-text-3">⏎</Kbd> send
        </span>
        <div className="ml-auto">
          {running ? (
            <button type="button" onClick={onStop} aria-label="stop run" className="grid size-7 place-items-center rounded-md bg-danger-dim text-danger hover:brightness-110">
              <SquareIcon className="size-3.5" />
            </button>
          ) : (
            <button type="submit" disabled={disabled || !value.trim()} aria-label="send goal"
              className="grid size-7 place-items-center rounded-md bg-accent text-bg-0 hover:brightness-110 disabled:opacity-30">
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
      className="rounded-md border border-line-1 bg-bg-1 px-2.5 py-1.5 text-[12px] text-text-2 transition-colors hover:border-accent hover:text-text-1">
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
