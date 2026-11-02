"use client";
// Official patterns: Tool, Terminal, Test Results, Stack Trace, Confirmation, Checkpoint, Subagent
// (https://ui.shadcn.com/docs/ai-elements/base/{tool,terminal,test-results,stack-trace,confirmation,checkpoint,subagent}.md)
import * as React from "react";
import { CheckIcon, ChevronRightIcon, TerminalIcon, XIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/** Tool: one endpoint/API/LLM call with input → output detail. */
export function Tool({
  title, badge, latencyMs, tokens, ok, children, defaultOpen,
}: {
  title: string; badge?: string; latencyMs?: number; tokens?: number; ok?: boolean; children?: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen ?? false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border border-line-1 bg-bg-1">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] text-text-1 hover:bg-bg-2">
        <ChevronRightIcon className={cn("size-3 text-text-3 transition-transform", open && "rotate-90")} />
        <span className={cn("size-1.5 rounded-full", ok === false ? "bg-danger" : "bg-accent")} aria-hidden />
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {badge && <span className="font-mono text-[10px] text-text-3">{badge}</span>}
        {latencyMs !== undefined && <span className="tnum text-[10px] text-text-3">{latencyMs}ms</span>}
        {tokens !== undefined && tokens > 0 && <span className="tnum text-[10px] text-text-3">{tokens} tok</span>}
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-line-1 px-2.5 py-2 text-[11px] text-text-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** Terminal: probe/shell lines, ANSI stripped. */
export function Terminal({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <div role="log" aria-label="terminal output" className={cn("overflow-x-auto rounded-md border border-line-1 bg-bg-0 p-2 font-mono text-[11px] leading-5", className)}>
      {lines.length === 0 ? <span className="text-text-3">$ probe commands appear here during a run</span> :
        lines.map((l, i) => <div key={i} className="whitespace-pre text-text-2"><span className="text-accent">$</span> {l}</div>)}
    </div>
  );
}

export type TestStatus = "pass" | "fail";
export interface TestRow { name: string; status: TestStatus; detail?: string }

/** Test Results: red→green rows. */
export function TestResults({ rows }: { rows: TestRow[] }) {
  if (rows.length === 0) return <EmptyHint text="Contract tests appear here — they fail before the shim, pass after." example="workspace/tests/contract.test.ts" />;
  return (
    <ul className="flex flex-col gap-1">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center gap-2 rounded-md border border-line-1 bg-bg-1 px-2 py-1.5 text-[12px]">
          {r.status === "pass" ? <CheckIcon className="size-3.5 text-accent" /> : <XIcon className="size-3.5 text-danger" />}
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-text-1">{r.name}</span>
          {r.detail && <span className="tnum text-[10px] text-text-3">{r.detail}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Stack Trace: agent failures with what happened + what to do. */
export function StackTrace({ error, hint }: { error: string; hint?: string }) {
  return (
    <div role="alert" className="rounded-md border border-danger/40 bg-danger-dim p-2.5 text-[12px]">
      <div className="font-mono text-[11px] text-danger">{error}</div>
      {hint && <div className="pt-1 text-text-2">{hint}</div>}
    </div>
  );
}

/** Confirmation: human approve/deny gate for sponsor-facing writes. */
export function Confirmation({ summary, state, onApprove, onDeny }: {
  summary: string; state: "pending" | "approved" | "denied"; onApprove?: () => void; onDeny?: () => void;
}) {
  return (
    <div className="rounded-md border border-warn/40 bg-warn-dim p-2.5 text-[12px]">
      <div className="text-text-1">{summary}</div>
      {state === "pending" ? (
        <div className="flex gap-2 pt-2">
          <button onClick={onApprove} className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-bg-0 hover:brightness-110">Approve</button>
          <button onClick={onDeny} className="rounded-md border border-line-1 px-2.5 py-1 text-[11px] text-text-2 hover:text-text-1">Deny</button>
        </div>
      ) : (
        <div className="pt-1 text-[11px] text-text-3">{state === "approved" ? "Auto-approved in replay — applied with receipt." : "Denied — nothing was written."}</div>
      )}
    </div>
  );
}

/** Checkpoint: restore point row. */
export function Checkpoint({ label, onRestore }: { label: string; onRestore?: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-line-1 bg-bg-1 px-2 py-1.5 text-[11px] text-text-2">
      <TerminalIcon className="size-3 text-text-3" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {onRestore && <button onClick={onRestore} className="rounded border border-line-1 px-1.5 py-0.5 text-[10px] hover:text-text-1">Restore</button>}
    </div>
  );
}

/** Subagent: delegated/parallel sub-run card. */
export function Subagent({ title, status, detail }: { title: string; status: "running" | "done" | "failed"; detail?: string }) {
  return (
    <div className="rounded-md border border-line-1 bg-bg-1 px-2.5 py-1.5 text-[12px]">
      <div className="flex items-center gap-2">
        <span className={cn("size-1.5 rounded-full", status === "running" ? "live-pulse bg-accent" : status === "failed" ? "bg-danger" : "bg-accent")} aria-hidden />
        <span className="text-text-1">{title}</span>
        <span className="ml-auto font-mono text-[10px] text-text-3">{status}</span>
      </div>
      {detail && <div className="truncate pt-0.5 font-mono text-[10px] text-text-3">{detail}</div>}
    </div>
  );
}

/** Shared honest empty state for right-pane tabs. */
export function EmptyHint({ text, example }: { text: string; example?: string }) {
  return (
    <div className="rounded-md border border-dashed border-line-1 p-4 text-center">
      <p className="text-[12px] text-text-2">{text}</p>
      {example && <p className="pt-1 font-mono text-[10px] text-text-3">e.g. {example}</p>}
    </div>
  );
}

function TestBar({ label, c }: { label: string; c: { passed: number; failed: number } }) {
  const total = Math.max(1, c.passed + c.failed);
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="w-20 text-text-3">{label}</span>
      <span className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-bg-2" aria-hidden>
        <span className="bg-accent" style={{ width: `${(c.passed / total) * 100}%` }} />
        <span className="bg-danger" style={{ width: `${(c.failed / total) * 100}%` }} />
      </span>
      <span className="tnum w-28 text-right"><span className="text-accent">{c.passed} passed</span> · <span className={c.failed ? "text-danger" : "text-text-3"}>{c.failed} failed</span></span>
    </div>
  );
}

/** Test Results card: before → after red→green with counts and a bar. */
export function TestRunCard({ suite, before, after, standalone }: {
  suite: string; before?: { passed: number; failed: number }; after?: { passed: number; failed: number }; standalone?: { passed: number; failed: number };
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line-1 bg-bg-1 p-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-text-1">{suite}</span>
        {before && after && before.failed > 0 && after.failed === 0 && <span className="rounded border border-accent/40 bg-accent-dim px-1.5 text-[10px] text-accent">red → green</span>}
      </div>
      {before && <TestBar label="before shim" c={before} />}
      {after && <TestBar label="after shim" c={after} />}
      {standalone && <TestBar label="run" c={standalone} />}
    </div>
  );
}
