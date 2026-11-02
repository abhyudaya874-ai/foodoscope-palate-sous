"use client";

export interface Source { title: string; url?: string; detail?: string }

export function Sources({ items }: { items: Source[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {items.map((s, i) => (
        <span key={i} className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400" title={s.url}>
          [{i + 1}] {s.title}
        </span>
      ))}
    </div>
  );
}

export function InlineCitation({ index, source }: { index: number; source: Source }) {
  return (
    <sup className="relative group cursor-help">
      <span className="text-emerald-400 text-[10px]">[{index}]</span>
      <span className="absolute bottom-full left-0 z-10 hidden w-56 rounded border border-zinc-700 bg-zinc-900 p-2 text-[10px] text-zinc-300 shadow-xl group-hover:block">
        {source.title}
        {source.detail && <span className="block text-zinc-500">{source.detail}</span>}
        {source.url && <span className="block text-emerald-500 truncate">{source.url}</span>}
      </span>
    </sup>
  );
}

export function Suggestion({ items, onPick }: { items: string[]; onPick?: (s: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <button key={s} onClick={() => onPick?.(s)} className="rounded-full border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 hover:border-emerald-700 hover:text-emerald-300">
          {s}
        </button>
      ))}
    </div>
  );
}

export function AnswerCard({ text, sources, suggestions, onSuggestion }: {
  text: string; sources?: Source[]; suggestions?: string[]; onSuggestion?: (s: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{text}</div>
      {sources && <Sources items={sources} />}
      {suggestions && <div className="pt-1"><div className="pb-1 text-[10px] uppercase tracking-wider text-zinc-600">Related</div><Suggestion items={suggestions} onPick={onSuggestion} /></div>}
    </div>
  );
}
