"use client";
import { useEffect, useState } from "react";

export function RankUpToast({ rank, show }: { rank: string; show: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(t);
    }
  }, [show]);
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-amber-700 bg-zinc-900 px-4 py-3 text-sm shadow-2xl" role="status">
      <span className="text-amber-300">Rank up → </span>
      <span className="font-semibold text-zinc-100">{rank}</span>
    </div>
  );
}
