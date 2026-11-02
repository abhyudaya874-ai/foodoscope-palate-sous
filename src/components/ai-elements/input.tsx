"use client";
import { useState } from "react";

export function PromptInput({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [v, setV] = useState("");
  const send = () => { if (v.trim()) { onSend(v.trim()); setV(""); } };
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
        placeholder="ask Sous…  (⌘⏎ send)"
        aria-label="prompt input"
        className="flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
      />
      <button onClick={send} disabled={disabled || !v.trim()} className="rounded bg-emerald-700 px-2.5 py-1 text-xs text-white disabled:opacity-40" aria-label="send prompt">Send</button>
    </div>
  );
}

export function ModelSelector({ provider, model, effort }: { provider?: string; model?: string; effort?: string }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-zinc-300">{provider ?? "no-provider"}</span>
      <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-zinc-300">{model ?? "—"}</span>
      {effort && <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-500">{effort}</span>}
    </div>
  );
}

export function ContextBar({ used, cap, label }: { used: number; cap: number; label: string }) {
  const pct = Math.min(100, cap ? (used / cap) * 100 : 0);
  return (
    <div className="flex items-center gap-2 text-[10px] text-zinc-500 min-w-32">
      <span className="whitespace-nowrap">{label}</span>
      <div className="h-1 w-16 rounded bg-zinc-800 overflow-hidden">
        <div className={`h-full ${pct > 85 ? "bg-rose-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-600"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono">{used}/{cap}</span>
    </div>
  );
}
