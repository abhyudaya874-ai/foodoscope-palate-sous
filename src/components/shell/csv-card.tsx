"use client";
// CSV change card: only cells that differ from the previous version are highlighted (before -> after on hover).
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const parse = (t: string) => t.split("\n").filter((l) => l.trim()).map((l) => l.split(","));

export function CsvCard({ path, before, after }: { path: string; before: string; after: string }) {
  const [head, ...body] = parse(after);
  if (!head) return null;
  const prev = new Map(parse(before).slice(1).map((r) => [r[0], r]));
  let changed = 0;
  const rows = body.map((r) => {
    const old = prev.get(r[0]);
    return r.map((cell, i) => { const diff = !old || old[i] !== cell; if (diff) changed++; return { cell, diff, was: old?.[i] }; });
  });
  return (
    <div className="overflow-hidden rounded-md border border-line-1 bg-bg-1">
      <div className="flex items-center gap-2 border-b border-line-1 px-2.5 py-1.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-text-1">{path}</span>
        <span className="tnum text-[10px] text-text-3">rows: {prev.size} → {body.length}</span>
        <span className="tnum text-[10px] text-text-3">{changed === 0 ? "0 cells changed · re-verified" : `${changed} cells changed`}</span>
      </div>
      <div className="max-h-56 overflow-auto">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">{head.map((h, i) => <TableHead key={i} className="h-7 px-2 text-[10px] text-text-3">{h}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {rows.slice(0, 40).map((r, ri) => (
              <TableRow key={ri} className="hover:bg-bg-2">
                {r.map((c, ci) => (
                  <TableCell key={ci} title={c.diff ? `before → after: ${c.was ?? "∅"} → ${c.cell}` : c.cell} className="max-w-36 truncate px-2 py-1 font-mono text-[10px] text-text-2">
                    {c.diff ? <span className="rounded bg-accent-dim px-1 text-accent">{c.cell}</span> : c.cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
