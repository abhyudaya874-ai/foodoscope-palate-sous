"use client";

function rows(text: string): string[][] {
  return text.split("\n").filter((l) => l.trim() !== "").map((l) => l.split(","));
}

export function CsvPane({ path, before, after }: { path: string; before: string; after: string }) {
  const b = rows(before);
  const a = rows(after);
  const beforeSet = new Set(b.map((r) => r.join(",")));
  return (
    <div className="text-xs font-mono border border-zinc-800 rounded">
      <div className="flex gap-3 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900">
        <span className="text-zinc-300 truncate">{path}</span>
        <span className="text-zinc-500">rows: {b.length} → {a.length}</span>
      </div>
      <div className="overflow-auto max-h-80">
        <table className="w-full">
          <tbody>
            {a.map((r, i) => {
              const isNew = !beforeSet.has(r.join(","));
              return (
                <tr key={i} className={isNew ? "bg-emerald-950/40 transition-colors duration-1000" : ""}>
                  {r.map((c, j) => <td key={j} className={`px-2 py-0.5 border-b border-zinc-900 ${isNew ? "text-emerald-300" : "text-zinc-400"}`}>{c}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
