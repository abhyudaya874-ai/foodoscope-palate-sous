"use client";
import { useState } from "react";

export function RankUpToast({ rank, show }: { rank: string; show: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  if (!show || dismissed) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-amber-700 bg-zinc-900 px-4 py-3 text-sm shadow-2xl" role="status">
      <div>
        <span className="text-amber-300">Rank up → </span>
        <span className="font-semibold text-zinc-100">{rank}</span>
      </div>
      <button onClick={() => setDismissed(true)} className="text-zinc-500 hover:text-zinc-200" aria-label="dismiss rank toast">✕</button>
    </div>
  );
}
