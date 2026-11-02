"use client";
// Official patterns: Sources + Inline Citation (https://ui.shadcn.com/docs/ai-elements/base/sources.md)
import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SourceRow {
  n: number;
  title: string;
  detail?: string;      // endpoint / record id / query
  confidence?: "H" | "M" | "L" | string;
  url?: string;
}

export function Sources({ rows, className }: { rows: SourceRow[]; className?: string }) {
  if (rows.length === 0) return <span className="text-[11px] text-text-3">No sources yet — receipts appear with each probe.</span>;
  return (
    <Popover>
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
            <li key={r.n} data-source-row={r.n} className="rounded-md px-2 py-1.5 text-[12px] hover:bg-bg-2">
              <span className="mr-1.5 font-mono text-[10px] text-text-3">[{r.n}]</span>
              <span className="text-text-1">{r.title}</span>
              {r.detail && <div className="truncate font-mono text-[10px] text-text-3">{r.detail}</div>}
              {r.confidence && <Confidence c={r.confidence} />}
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

/** Inline citation chip [n]; click scrolls + highlights the row in the Sources popover. */
export function InlineCitation({ n, onClick }: { n: number; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`source ${n}`}
      className="mx-0.5 inline-grid size-4 place-items-center rounded border border-line-1 bg-bg-2 align-middle font-mono text-[9px] text-text-2 hover:border-accent hover:text-accent"
    >
      {n}
    </button>
  );
}
