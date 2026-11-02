"use client";

const ANSI = /[\u001b\u009b][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

export function stripAnsi(s: string): string {
  return s.replace(ANSI, "");
}

export function TerminalPane({ lines }: { lines: string[] }) {
  return (
    <div className="text-xs font-mono bg-black border border-zinc-800 rounded p-3 overflow-auto max-h-96 leading-5">
      {lines.length === 0 && <div className="text-zinc-600">$ waiting…</div>}
      {lines.map((l, i) => (
        <div key={i} className={l.startsWith("$") ? "text-zinc-300" : l.includes("ERROR") || l.includes("err") ? "text-rose-400" : "text-zinc-500"}>
          {stripAnsi(l)}
        </div>
      ))}
    </div>
  );
}
