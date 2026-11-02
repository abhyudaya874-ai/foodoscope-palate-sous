"use client";
// Official patterns: Chat + Message (auto-scroll that keeps place while streaming)
// + Chain of Thought (collapsible steps summary) + File Tree.
import * as React from "react";
import { ChevronDownIcon, ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/** Auto-scrolls to bottom while streaming unless the user scrolled up. */
export function Chat({ children, streaming }: { children: React.ReactNode; streaming?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const pinned = React.useRef(true);
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };
  React.useEffect(() => {
    const el = ref.current;
    if (el && streaming && pinned.current) el.scrollTop = el.scrollHeight;
  });
  return (
    <div ref={ref} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4">{children}</div>
    </div>
  );
}

export function Message({ children, from }: { children: React.ReactNode; from: "user" | "assistant" }) {
  return (
    <article aria-label={from === "user" ? "your message" : "Sous"} className={cn("flex flex-col", from === "user" && "items-end")}>
      {children}
    </article>
  );
}

/** Chain of Thought: "Steps · N · Xs" summary that expands into step rows. */
export function ChainOfThought({ count, durationMs, children, running }: {
  count: number; durationMs?: number; children: React.ReactNode; running?: boolean;
}) {
  const [userOpen, setUserOpen] = React.useState<boolean | undefined>(undefined);
  const open = userOpen ?? !!running;
  return (
    <Collapsible open={open} onOpenChange={setUserOpen} className="rounded-lg border border-line-1 bg-bg-1">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-text-1 hover:bg-bg-2">
        <ChevronDownIcon className={cn("size-3 text-text-3 transition-transform", !open && "-rotate-90")} />
        <span className="font-medium">{running ? "Working" : "Steps"}</span>
        <span className="tnum text-text-3">· {count}</span>
        {running && <span className="live-pulse size-1.5 rounded-full bg-accent" aria-hidden />}
        {durationMs !== undefined && <span className="tnum text-text-3">· {(durationMs / 1000).toFixed(1)}s</span>}
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-line-1 px-2.5 py-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** File Tree: files the agent changed. */
export function FileTree({ files, onSelect }: { files: { path: string; added?: number; removed?: number }[]; onSelect?: (path: string) => void }) {
  if (files.length === 0)
    return (
      <div className="rounded-md border border-dashed border-line-1 p-4 text-center text-[12px] text-text-2">
        Files Sous changes appear here while it works.
        <div className="pt-1 font-mono text-[10px] text-text-3">e.g. workspace/data/crosswalk.csv</div>
      </div>
    );
  return (
    <ul className="flex flex-col gap-0.5">
      {files.map((f) => (
        <li key={f.path}>
          <button onClick={() => onSelect?.(f.path)} className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] text-text-1 hover:bg-bg-2">
            {f.path.includes("/") ? <FolderIcon className="size-3.5 text-text-3" /> : <FileIcon className="size-3.5 text-text-3" />}
            <span className="min-w-0 flex-1 truncate font-mono text-[11px]">{f.path}</span>
            {f.added !== undefined && <span className="tnum text-[10px] text-accent">+{f.added}</span>}
            {f.removed !== undefined && f.removed > 0 && <span className="tnum text-[10px] text-danger">−{f.removed}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
