"use client";
import { useEffect, useRef, useState } from "react";

export function MessageScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight }); });
  return <div ref={ref} className="flex-1 overflow-y-auto scroll-fade p-4 space-y-3">{children}</div>;
}

export function Message({ from, children }: { from: "user" | "assistant" | "system"; children: React.ReactNode }) {
  return (
    <div className={`flex ${from === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${from === "user" ? "bg-emerald-700/30 text-emerald-100" : from === "assistant" ? "bg-zinc-800 text-zinc-200" : "bg-transparent text-zinc-500 text-xs"}`}>
        {children}
      </div>
    </div>
  );
}

export function Reasoning({ text, streaming }: { text: string; streaming?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/60">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-400" aria-expanded={open} aria-label="toggle reasoning">
        <span className={streaming ? "animate-pulse text-violet-400" : "text-zinc-500"}>{streaming ? "●" : "✓"}</span>
        {streaming ? "Sous is thinking…" : "thought process"}
        <span className="ml-auto">{open ? "▾" : "▸"}</span>
      </button>
      {open && <pre className="whitespace-pre-wrap px-3 pb-2 text-xs text-zinc-500 max-h-48 overflow-y-auto">{text}</pre>}
    </div>
  );
}

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <pre className="rounded-md border border-zinc-800 bg-black p-3 text-xs font-mono overflow-x-auto text-zinc-300">
      {lang && <span className="block text-[10px] text-zinc-600 mb-1">{lang}</span>}
      {code}
    </pre>
  );
}

export function StackTrace({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="rounded-md border border-rose-900/60 bg-rose-950/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-rose-400">Error</span>
        {onRetry && <button onClick={onRetry} className="text-xs text-zinc-300 underline" aria-label="retry">retry</button>}
      </div>
      <pre className="mt-1 whitespace-pre-wrap text-xs font-mono text-rose-300/80 max-h-40 overflow-y-auto">{error}</pre>
    </div>
  );
}

export function Shimmer({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 rounded bg-zinc-800 animate-pulse" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
}
