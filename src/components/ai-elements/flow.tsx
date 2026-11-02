"use client";

export interface PlanStep { id: string; label: string; status: "pending" | "running" | "done" | "failed" }

export function Plan({ steps }: { steps: PlanStep[] }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2 space-y-1">
      <div className="px-1 pb-1 text-[10px] uppercase tracking-wider text-zinc-500">Plan</div>
      {steps.map((s) => (
        <div key={s.id} className="flex items-center gap-2 text-xs">
          <span className={s.status === "done" ? "text-emerald-400" : s.status === "running" ? "animate-pulse text-amber-400" : s.status === "failed" ? "text-rose-400" : "text-zinc-600"}>
            {s.status === "done" ? "✓" : s.status === "running" ? "●" : s.status === "failed" ? "✗" : "○"}
          </span>
          <span className={s.status === "pending" ? "text-zinc-500" : "text-zinc-200"}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Queue({ left, doneCount }: { left: number; doneCount: number }) {
  const total = left + doneCount;
  return (
    <div className="text-[10px] text-zinc-500 flex items-center gap-2">
      <span>queue</span>
      <div className="h-1 flex-1 rounded bg-zinc-800 overflow-hidden">
        <div className="h-full bg-emerald-600 transition-all" style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} />
      </div>
      <span>{doneCount}/{total}</span>
    </div>
  );
}

export function Confirmation({ path, onApprove, onDeny, state }: { path: string; state?: "pending" | "approved" | "denied"; onApprove?: () => void; onDeny?: () => void }) {
  return (
    <div className="rounded-md border border-amber-800/60 bg-amber-950/30 p-3 text-xs">
      <div className="text-amber-300">Sponsor-facing write needs approval</div>
      <div className="mt-1 font-mono text-zinc-400 truncate">{path}</div>
      {state === "pending" || !state ? (
        <div className="mt-2 flex gap-2">
          <button onClick={onApprove} className="rounded bg-emerald-700 px-2.5 py-1 text-white" aria-label="approve write">Approve</button>
          <button onClick={onDeny} className="rounded border border-zinc-700 px-2.5 py-1 text-zinc-300" aria-label="deny write">Deny</button>
        </div>
      ) : (
        <div className={`mt-2 ${state === "approved" ? "text-emerald-400" : "text-rose-400"}`}>{state}</div>
      )}
    </div>
  );
}

export function Checkpoint({ id, onRestore }: { id: string; onRestore?: () => void }) {
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <span className="font-mono">⧉ {id}</span>
      {onRestore && <button onClick={onRestore} className="underline" aria-label={`restore checkpoint ${id}`}>Restore</button>}
    </div>
  );
}
