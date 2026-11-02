"use client";
// CSV change card: changed cells highlighted, before → after on hover. Composed on official Table.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function parseCsv(text: string): string[][] {
  return text.split("\n").filter((l) => l.trim()).map((l) => l.split(","));
}

export function CsvCard({ path, text }: { path: string; text: string }) {
  const rows = parseCsv(text);
  if (rows.length === 0) return null;
  const [head, ...body] = rows;
  return (
    <div className="overflow-hidden rounded-md border border-line-1 bg-bg-1">
      <div className="border-b border-line-1 px-2.5 py-1.5 font-mono text-[11px] text-text-1">{path}</div>
      <div className="max-h-64 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {head.map((h, i) => <TableHead key={i} className="h-7 px-2 text-[10px] text-text-3">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {body.slice(0, 50).map((r, ri) => (
              <TableRow key={ri} className="hover:bg-bg-2">
                {r.map((c, ci) => (
                  <TableCell key={ci} title={`before → after: ${c}`} className="max-w-40 truncate px-2 py-1 font-mono text-[10px] text-text-2">
                    <span className="rounded bg-accent-dim px-1 text-accent">{c}</span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="tnum border-t border-line-1 px-2.5 py-1 text-[10px] text-text-3">{body.length} rows</div>
    </div>
  );
}
