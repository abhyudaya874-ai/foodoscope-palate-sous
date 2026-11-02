"use client";
import type { Profile } from "@/lib/gamification/derive";
import { StreakBorder } from "./StreakBorder";

export function BadgeShelf({ badges }: { badges: Profile["badges"] }) {
  if (!badges.length) return <div className="text-[10px] text-zinc-600">no badges yet</div>;
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <span key={b.id} className="rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-300" title={b.evidence ?? b.id}>
          {b.name}
        </span>
      ))}
    </div>
  );
}

export function ProfileCard({ profile, mini }: { profile: Profile; mini?: boolean }) {
  const pct = profile.nextRankAt > 0 ? Math.min(100, (profile.xp / profile.nextRankAt) * 100) : 100;
  return (
    <StreakBorder streak={profile.streak}>
      <div className="overflow-hidden rounded-[10px]">
        <div className="h-14" style={{ background: `linear-gradient(135deg, ${profile.banner.from}, ${profile.banner.to})` }} />
        <div className="-mt-6 px-3 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-sm font-bold text-emerald-300">
            {profile.name.slice(0, 1)}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm font-semibold text-zinc-100">{profile.name}</span>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-amber-300">{profile.rank}</span>
            {profile.streak > 0 && <span className="text-[10px] text-orange-400" aria-label={`streak ${profile.streak} days`}>🔥{profile.streak}</span>}
          </div>
          {!mini && <div className="pt-0.5 text-[11px] text-zinc-500">{profile.status}</div>}
          <div className="pt-2">
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>{profile.xp} XP</span>
              <span>next: {profile.nextRankAt}</span>
            </div>
            <div className="mt-0.5 h-1.5 rounded bg-zinc-800">
              <div className="h-full rounded bg-emerald-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {!mini && (
            <>
              <div className="pt-2"><BadgeShelf badges={profile.badges} /></div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-3 text-[10px] text-zinc-500">
                <span>endpoints probed · <b className="text-zinc-300">{profile.stats.endpointsProbed}</b></span>
                <span>bugs found · <b className="text-zinc-300">{profile.stats.bugsFound}</b></span>
                <span>fixes verified · <b className="text-zinc-300">{profile.stats.fixesVerified}</b></span>
                <span>cache hits · <b className="text-zinc-300">{profile.stats.cacheHits}</b></span>
                <span className="col-span-2">crosswalk · <b className="text-zinc-300">{profile.stats.crosswalk}</b></span>
              </div>
            </>
          )}
        </div>
      </div>
    </StreakBorder>
  );
}
