"use client";
import { useState } from "react";

export function Tool({ title, badge, latencyMs, tokens, detail, ok, children }: {
  title: string; badge?: string; latencyMs?: number; tokens?: number; detail?: string; ok?: boolean; children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const color = ok === undefined ? "text-amber-400" : ok ? "text-emerald-400" : "text-rose-400";
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 text-xs">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-1.5" aria-expanded={open} aria-label={`tool ${title}`}>
        <span className={color}>{ok === undefined ? "…" : ok ? "✓" : "✗"}</span>
        <span className="font-mono text-zinc-200">{title}</span>
        {badge && <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">{badge}</span>}
        <span className="ml-auto text-zinc-500">
          {latencyMs !== undefined && `${latencyMs}ms`}
          {tokens !== undefined && ` · ${tokens} tok`}
          {" "}{open ? "▾" : "▸"}
        </span>
      </button>
      {open && (detail || children) && (
        <div className="border-t border-zinc-800 px-3 py-2 text-zinc-400 font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">{detail}{children}</div>
      )}
    </div>
  );
}

export function Task({ steps }: { steps: { label: string; ok?: boolean }[] }) {
  return (
    <div className="space-y-1 px-1">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className={s.ok === undefined ? "text-amber-400" : s.ok ? "text-emerald-400" : "text-rose-400"}>{s.ok === undefined ? "…" : s.ok ? "✓" : "✗"}</span>
          <span className="text-zinc-300">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Subagent({ name, status, detail }: { name: string; status: "running" | "done" | "failed"; detail?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs">
      <span className={status === "running" ? "animate-pulse text-amber-400" : status === "done" ? "text-emerald-400" : "text-rose-400"}>
        {status === "running" ? "●" : status === "done" ? "✓" : "✗"}
      </span>
      <span className="font-mono text-zinc-300">subagent:{name}</span>
      {detail && <span className="ml-auto text-zinc-500 truncate">{detail}</span>}
    </div>
  );
}
