import { XP_TABLE, RANKS } from "./xp.config";
import { BADGES } from "./badges.config";
import { AGENT_BANNER, NEUTRAL_BANNER } from "./families.config";
import type { AppEvent } from "../events/types";
import type { SseMessage } from "../ui/sseMap";

export interface Badge { id: string; name: string; evidence?: string }
export interface Profile {
  name: string;
  xp: number;
  rank: string;
  rankIndex: number;
  nextRankAt: number;
  streak: number;
  badges: Badge[];
  banner: { from: string; to: string };
  stats: {
    endpointsProbed: number;
    bugsFound: number;
    fixesVerified: number;
    cacheHits: number;
    crosswalk: string; // "before -> after" or "[measure]"
  };
  status: string;
}

export function localDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function streakDays(days: Set<string>, today = new Date()): number {
  let streak = 0;
  const cur = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(localDay(cur.toISOString()))) {
    const y = new Date(cur); y.setDate(y.getDate() - 1);
    if (!days.has(localDay(y.toISOString()))) return 0;
    cur.setDate(cur.getDate() - 1);
  }
  while (days.has(localDay(cur.toISOString()))) { streak++; cur.setDate(cur.getDate() - 1); }
  return streak;
}

export function deriveProfile(events: AppEvent[], name = "Sous #1"): Profile {
  let xp = 0;
  const seenRepro = new Set<string>();
  const fixDays = new Set<string>();
  const earnedBadges: Badge[] = [];
  const stats = { endpointsProbed: 0, bugsFound: 0, fixesVerified: 0, cacheHits: 0, crosswalk: "[measure]" };

  let xwBefore: number | undefined, xwAfter: number | undefined;
  for (const e of events) {
    if (e.type === "probe.call" && e.payload.status !== 0 && e.evidence) { xp += XP_TABLE["probe.call"]; stats.endpointsProbed++; }
    if (e.type === "bug.detected" && e.payload.status === "CONFIRMED" && e.evidence) {
      const repro = e.payload.reproPath;
      if (!seenRepro.has(repro)) { seenRepro.add(repro); xp += XP_TABLE["bug.detected"]; stats.bugsFound++; }
      if (!earnedBadges.some((b) => b.id === "first-blood")) earnedBadges.push({ id: "first-blood", name: "First Blood", evidence: e.evidence });
    }
    if (e.type === "fix.verified" && e.payload.failedBefore && e.payload.passesAfter && e.evidence) {
      xp += XP_TABLE["fix.verified"]; stats.fixesVerified++;
      fixDays.add(localDay(e.ts));
      if (!earnedBadges.some((b) => b.id === "green-run")) earnedBadges.push({ id: "green-run", name: "Green Run", evidence: e.evidence });
    }
    if (e.type === "report.drafted" && e.payload.approved) {
      xp += XP_TABLE["report.drafted"];
      fixDays.add(localDay(e.ts));
    }
    if (e.type === "llm.call" && e.payload.cache) stats.cacheHits++;
    if (e.type === "patch.applied" && e.payload.path.includes("crosswalk.csv") && e.evidence) {
      xp += XP_TABLE["patch.applied.tokensaved"];
    }
  }

  if (xwBefore !== undefined && xwAfter !== undefined && xwAfter > xwBefore) {
    earnedBadges.push({ id: "crosswalker", name: "Crosswalker" });
    stats.crosswalk = `${xwBefore} → ${xwAfter}`;
  }

  let rankIndex = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].at) rankIndex = i;
  const nextRankAt = rankIndex + 1 < RANKS.length ? RANKS[rankIndex + 1].at : RANKS[rankIndex].at;

  return {
    name, xp, rank: RANKS[rankIndex].name, rankIndex, nextRankAt,
    streak: streakDays(fixDays),
    badges: earnedBadges.slice(0, 6),
    banner: AGENT_BANNER,
    stats,
    status: `probing RecipeDB × FlavorDB`,
  };
}

export const HUMAN_BANNER = NEUTRAL_BANNER;
export { BADGES };

// UI adapter: derive a card straight from replayed SSE messages.
export function deriveSous(messages: SseMessage[]): Profile {
  const pseudo = messages
    .map((m) => {
      const d = m.data as Record<string, unknown>;
      if (typeof d.event !== "string") return null;
      return { type: d.event, payload: d, ts: m.ts, evidence: d.evidence as string | undefined } as unknown as AppEvent;
    })
    .filter((e): e is AppEvent => e !== null);
  // SSE-side crosswalk numbers ride on csv.upsert for crosswalk.csv
  const p = deriveProfile(pseudo);
  const xw = messages.find((m) => m.type === "csv.upsert" && String((m.data as { path?: string }).path ?? "").includes("crosswalk"));
  if (xw) {
    const d = xw.data as { rows?: number };
    p.stats.crosswalk = `+${d.rows ?? "?"} rows`;
  }
  return p;
}
