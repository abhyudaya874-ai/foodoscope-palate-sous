"use client";
// Official patterns: Sources + Inline Citation (https://ui.shadcn.com/docs/ai-elements/base/sources.md)
// Controlled popover: clicking an inline [n] opens it and highlights + scrolls to that row.
import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SourceRow {
  n: number;
  title: string;
  detail?: string;      // endpoint / record id / snippet
  confidence?: "H" | "M" | "L" | string;
  url?: string;
  provider?: string;    // tavily | exa | browser | api | verify
  evidence_id?: string;
  kind?: string;
}

const PROVIDER_TONE: Record<string, string> = {
  tavily: "text-accent border-accent/40 bg-accent-dim",
  exa: "text-warn border-warn/40 bg-warn-dim",
  browser: "text-text-1 border-line-2 bg-bg-2",
  api: "text-text-2 border-line-1 bg-bg-2",
  verify: "text-text-2 border-line-1 bg-bg-2",
};

export function Sources({ rows, className, openSignal }: { rows: SourceRow[]; className?: string; openSignal?: number | null }) {
  const [userOpen, setUserOpen] = React.useState(false);
  const [hl, setHl] = React.useState<number | null>(null);
  const [prevSignal, setPrevSignal] = React.useState<number | null>(null);
  // adjust state during render (React-sanctioned pattern; no setState-in-effect)
  const signal = openSignal ?? null;
  if (signal !== prevSignal) {
    setPrevSignal(signal);
    if (signal !== null) { setHl(signal); setUserOpen(true); }
  }
  React.useEffect(() => {
    if (hl === null) return;
    const t = setTimeout(() => setHl(null), 2400);
    return () => clearTimeout(t);
  }, [hl]);
  const open = userOpen || hl !== null;
  if (rows.length === 0) return <span className="text-[11px] text-text-3">No sources yet — receipts appear with each probe.</span>;
  return (
    <Popover open={open} onOpenChange={setUserOpen}>
      <PopoverTrigger
        className={cn("inline-flex items-center gap-1.5 rounded-md border border-line-1 bg-bg-2 px-2 py-1 text-[11px] text-text-2 hover:text-text-1", className)}
      >
        <span className="flex -space-x-1" aria-hidden>
          {rows.slice(0, 3).map((r) => (
            <span key={r.n} className="grid size-4 place-items-center rounded-full border border-line-1 bg-bg-1 font-mono text-[8px] text-text-2">{r.n}</span>
          ))}
        </span>
        <span className="tnum">{rows.length} sources</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 border-line-1 bg-bg-1 p-2">
        <ul className="flex flex-col gap-1">
          {rows.map((r) => (
            <li
              key={r.n}
              data-source-row={r.n}
              ref={(el) => { if (hl === r.n && el) el.scrollIntoView({ block: "nearest" }); }}
              className={cn("rounded-md px-2 py-1.5 text-[12px] hover:bg-bg-2", hl === r.n && "bg-accent-dim ring-1 ring-accent/50")}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-text-3">[{r.n}]</span>
                {r.provider && (
                  <span className={cn("rounded border px-1 py-px font-mono text-[9px] uppercase", PROVIDER_TONE[r.provider] ?? "text-text-2 border-line-1 bg-bg-2")}>
                    {r.provider}
                  </span>
                )}
                {r.confidence && <Confidence c={r.confidence} />}
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`open ${r.title}`}
                    className="ml-auto grid size-5 place-items-center rounded text-text-3 hover:text-accent">
                    ↗
                  </a>
                )}
              </div>
              {r.url ? (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-text-1 hover:text-accent hover:underline">
                  {r.title}
                </a>
              ) : (
                <span className="text-text-1">{r.title}</span>
              )}
              {r.detail && <div className="truncate text-[10px] text-text-3" title={r.detail}>{r.detail}</div>}
              {r.evidence_id && <div className="font-mono text-[9px] text-text-3">id {r.evidence_id}</div>}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function Confidence({ c }: { c: string }) {
  const tone = c === "H" ? "text-accent" : c === "M" ? "text-warn" : "text-text-3";
  return <span className={cn("ml-1 font-mono text-[10px]", tone)}>{c}</span>;
}

/** Inline citation chip [n]; click opens the Sources popover and highlights row n. */
export function InlineCitation({ n, onOpen }: { n: number; onOpen?: (n: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(n)}
      aria-label={`open source ${n}`}
      className="mx-0.5 inline-grid size-4 place-items-center rounded border border-line-1 bg-bg-2 align-middle font-mono text-[9px] text-text-2 hover:border-accent hover:text-accent"
    >
      {n}
    </button>
  );
}
