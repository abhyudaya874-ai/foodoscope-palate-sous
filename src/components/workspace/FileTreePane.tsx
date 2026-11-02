"use client";

export function FileTreePane({ files, active, onSelect }: { files: string[]; active?: string; onSelect?: (p: string) => void }) {
  return (
    <div className="text-sm font-mono">
      {files.length === 0 && <div className="text-zinc-500 p-3">no files yet</div>}
      {files.map((f) => (
        <button
          key={f}
          onClick={() => onSelect?.(f)}
          className={`block w-full text-left px-3 py-1 truncate hover:bg-zinc-800 ${f === active ? "bg-zinc-800 text-emerald-400" : "text-zinc-300"}`}
          aria-label={`open ${f}`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
