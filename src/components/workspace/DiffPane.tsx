"use client";
import { diffLines } from "diff";

export function DiffView({ path, before, after, status }: { path: string; before: string; after: string; status?: string }) {
  const parts = diffLines(before, after);
  let added = 0, removed = 0;
  for (const p of parts) {
    if (p.added) added += p.count ?? 0;
    if (p.removed) removed += p.count ?? 0;
  }
  return (
    <div className="text-xs font-mono border border-zinc-800 rounded">
      <div className="flex gap-3 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900">
        <span className="text-zinc-300 truncate">{path}</span>
        <span className="text-emerald-400">+{added}</span>
        <span className="text-rose-400">−{removed}</span>
        {status && <span className="ml-auto text-zinc-500">{status}</span>}
      </div>
      <pre className="overflow-auto max-h-80 p-2 leading-5">
        {parts.map((p, i) => (
          <span key={i} className={p.added ? "block bg-emerald-950/60 text-emerald-300" : p.removed ? "block bg-rose-950/60 text-rose-300 line-through" : "text-zinc-500"}>
            {p.value.split("\n").filter((l) => l !== "").map((l, j) => (
              <span key={j} className="block">{p.added ? "+ " : p.removed ? "- " : "  "}{l}</span>
            ))}
          </span>
        ))}
      </pre>
    </div>
  );
}

export function DiffPane({ patches }: { patches: { path: string; before: string; after: string; status?: string }[] }) {
  const latest = new Map<string, (typeof patches)[number]>();
  for (const p of patches) latest.set(p.path, p);
  return (
    <div className="space-y-3 p-2">
      {latest.size === 0 && <div className="text-zinc-500 text-sm p-3">no patches yet</div>}
      {[...latest.values()].map((p) => <DiffView key={p.path + p.status} {...p} />)}
    </div>
  );
}
