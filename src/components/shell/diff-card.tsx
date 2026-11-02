"use client";
// Devin-style diff card: file chip, +N −N, syntax lines, expandable. Composed on official CodeBlock conventions.
import * as React from "react";
import { ChevronRightIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

function diffLines(before: string, after: string) {
  const b = before.split("\n"), a = after.split("\n");
  const rows: { text: string; kind: "add" | "del" | "ctx" }[] = [];
  let i = 0, j = 0;
  while (i < b.length || j < a.length) {
    if (b[i] === a[j]) { rows.push({ text: b[i] ?? "", kind: "ctx" }); i++; j++; }
    else {
      if (i < b.length) { rows.push({ text: b[i], kind: "del" }); i++; }
      if (j < a.length) { rows.push({ text: a[j], kind: "add" }); j++; }
    }
  }
  return rows;
}

export function DiffCard({ title, before, after }: { title: string; before: string; after: string }) {
  const [open, setOpen] = React.useState(false);
  const rows = React.useMemo(() => diffLines(before, after), [before, after]);
  const added = rows.filter((r) => r.kind === "add").length;
  const removed = rows.filter((r) => r.kind === "del").length;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="overflow-hidden rounded-md border border-line-1 bg-bg-1">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] hover:bg-bg-2">
        <ChevronRightIcon className={cn("size-3 text-text-3 transition-transform", open && "rotate-90")} />
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-text-1">{title}</span>
        <span className="tnum text-[10px] text-accent">+{added}</span>
        <span className="tnum text-[10px] text-danger">−{removed}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="max-h-64 overflow-auto border-t border-line-1 p-2 font-mono text-[10px] leading-4">
          {rows.slice(0, 200).map((r, i) => (
            <div key={i} className={cn("whitespace-pre", r.kind === "add" && "bg-accent-dim text-accent", r.kind === "del" && "bg-danger-dim text-danger")}>
              {r.kind === "add" ? "+" : r.kind === "del" ? "−" : " "} {r.text}
            </div>
          ))}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
