"use client";
// Official patterns: Sources + Inline Citation (https://ui.shadcn.com/docs/ai-elements/base/sources.md)
// Controlled popover: clicking an inline [n] opens it and highlights + scrolls to row n.
// The list is height-bounded and scrolls internally (never scrolls the page behind).
import * as React from "react";
import { ExternalLinkIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SourceRow {
  n: number;
  title: string;
  detail?: string;
  confidence?: "H" | "M" | "L" | string;
  url?: string;
  provider?: string;
  evidence_id?: string;
  kind?: string;
}

const TONE: Record<string, string> = {
  tavily: "text-accent border-accent/40 bg-accent-dim",
  exa: "text-warn border-warn/40 bg-warn-dim",
  browser: "text-text-1 border-line-2 bg-bg-2",
  api: "text-text-2 border-line-1 bg-bg-2",
  verify: "text-text-2 border-line-1 bg-bg-2",
};

function host(u?: string) { try { return u ? new URL(u).hostname.replace(/^www\./, "") : ""; } catch { return ""; } }

export function Sources({ rows, className, openSignal }: { rows: SourceRow[]; className?: string; openSignal?: number | null }) {
  const [userOpen, setUserOpen] = React.useState(false);
  const [hl, setHl] = React.useState<number | null>(null);
  const [prevSignal, setPrevSignal] = React.useState<number | null>(null);
  const [filter, setFilter] = React.useState("all");
  const signal = openSignal ?? null;
  if (signal !== prevSignal) {
    setPrevSignal(signal);
    if (signal !== null) { setHl(signal); setUserOpen(true); setFilter("all"); }
  }
  React.useEffect(() => {
    if (hl === null) return;
    const t = setTimeout(() => setHl(null), 2400);
    return () => clearTimeout(t);
  }, [hl]);
  const providers = Array.from(new Set(rows.map((r) => r.provider ?? "api")));
  const shown = filter === "all" ? rows : rows.filter((r) => (r.provider ?? "api") === filter);
  if (rows.length === 0) return <span className="text-[11px] text-text-3">No sources yet — receipts appear with each probe.</span>;
  return (
    <Popover open={userOpen} onOpenChange={setUserOpen}>
      <PopoverTrigger className={cn("inline-flex items-center gap-1.5 rounded-full border border-line-1 bg-bg-1 px-2.5 py-1 text-[11px] text-text-2 hover:border-line-2 hover:text-text-1", className)}>
        <span className="flex -space-x-1" aria-hidden>
          {providers.slice(0, 3).map((p) => (
            <span key={p} className={cn("grid size-4 place-items-center rounded-full border font-mono text-[8px] uppercase", TONE[p] ?? TONE.api)}>{p[0]}</span>
          ))}
        </span>
        <span className="tnum">{rows.length} sources</span>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="flex max-h-[min(68vh,520px)] w-[380px] flex-col gap-0 overflow-hidden rounded-lg border border-line-1 bg-bg-1 p-0 shadow-none">
        <div className="flex shrink-0 flex-wrap gap-1 border-b border-line-1 p-2">
          {["all", ...providers].map((p) => (
            <button key={p} onClick={() => setFilter(p)}
              className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase", filter === p ? "border-accent/50 bg-accent-dim text-accent" : "border-line-1 text-text-3 hover:text-text-2")}>
              {p} {p === "all" ? rows.length : rows.filter((r) => (r.provider ?? "api") === p).length}
            </button>
          ))}
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
          {shown.map((r) => (
            <li key={r.n} data-source-row={r.n}
              ref={(el) => { if (hl === r.n && el) el.scrollIntoView({ block: "nearest" }); }}
              className={cn("rounded-md px-2 py-1.5 text-[12px] hover:bg-bg-2", hl === r.n && "bg-accent-dim ring-1 ring-accent/50")}>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-text-3">[{r.n}]</span>
                <span className={cn("rounded border px-1 py-px font-mono text-[9px] uppercase", TONE[r.provider ?? "api"] ?? TONE.api)}>{r.provider ?? "api"}</span>
                {r.confidence && <Confidence c={r.confidence} />}
                <span className="truncate text-[10px] text-text-3">{host(r.url)}</span>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`open ${r.title}`} className="ml-auto text-text-3 hover:text-accent">
                    <ExternalLinkIcon className="size-3" />
                  </a>
                )}
              </div>
              {r.url
                ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="line-clamp-1 text-text-1 hover:text-accent hover:underline">{r.title}</a>
                : <span className="line-clamp-1 text-text-1">{r.title}</span>}
              {r.detail && <div className="line-clamp-2 text-[10px] text-text-3">{r.detail}</div>}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function Confidence({ c }: { c: string }) {
  const tone = c === "H" ? "text-accent" : c === "M" ? "text-warn" : "text-text-3";
  return <span className={cn("font-mono text-[10px]", tone)} title="confidence">{c}</span>;
}

export function InlineCitation({ n, onOpen }: { n: number; onOpen?: (n: number) => void }) {
  return (
    <button type="button" onClick={() => onOpen?.(n)} aria-label={`open source ${n}`}
      className="mx-0.5 inline-grid size-[18px] -translate-y-px place-items-center rounded-full border border-line-1 bg-bg-2 align-middle font-mono text-[9px] text-text-2 hover:border-accent hover:text-accent">
      {n}
    </button>
  );
}
