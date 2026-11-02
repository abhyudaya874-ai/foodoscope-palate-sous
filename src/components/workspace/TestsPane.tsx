"use client";

export interface TestResult {
  name: string;
  status: "pass" | "fail" | "running" | "skip";
  detail?: string;
}

export function TestsPane({ results }: { results: TestResult[] }) {
  return (
    <div className="text-xs font-mono border border-zinc-800 rounded divide-y divide-zinc-900">
      {results.length === 0 && <div className="text-zinc-500 p-3">no test results yet</div>}
      {results.map((t, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-1.5">
          <span className={t.status === "pass" ? "text-emerald-400" : t.status === "fail" ? "text-rose-400" : t.status === "running" ? "text-amber-400" : "text-zinc-500"}>
            {t.status === "pass" ? "✓" : t.status === "fail" ? "✗" : t.status === "running" ? "…" : "–"}
          </span>
          <span className="text-zinc-300 truncate">{t.name}</span>
          {t.detail && <span className="ml-auto text-zinc-500 truncate">{t.detail}</span>}
        </div>
      ))}
    </div>
  );
}
