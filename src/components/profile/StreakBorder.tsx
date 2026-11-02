"use client";

const TIERS: [number, string][] = [
  [14, "conic-gradient(from 0deg, #f59e0b, #ef4444, #f59e0b)"],
  [7, "linear-gradient(135deg, #f59e0b, #fbbf24)"],
  [3, "linear-gradient(135deg, #ea580c, #fb923c)"],
  [1, "linear-gradient(135deg, #52525b, #71717a)"],
  [0, "linear-gradient(135deg, #3f3f46, #3f3f46)"],
];

export function StreakBorder({ streak, children }: { streak: number; children: React.ReactNode }) {
  const grad = TIERS.find(([min]) => streak >= min)?.[1] ?? TIERS[TIERS.length - 1][1];
  return (
    <div
      className={`rounded-xl p-[2px] ${streak >= 14 ? "animate-[spin_6s_linear_infinite] motion-reduce:animate-none" : ""}`}
      style={{ background: grad }}
    >
      <div className="rounded-[10px] bg-zinc-900">{children}</div>
    </div>
  );
}
