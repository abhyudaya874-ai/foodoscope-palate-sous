---
trigger: glob
globs: "src/lib/gamification/**, src/components/profile/**, events/**"
description: Gamification - XP, ranks, streaks, badges, profile cards, all derived from the event log
---
# Principle
**Gamification is a pure function of `events/*.jsonl`.** `deriveProfile(events) → Profile`. No hand-typed stats, no mutable counters. Delete the profile, replay events, get the same profile (property-test this).

# XP table (`src/lib/gamification/xp.config.ts`, tunable in one place)
| Event | XP |
|---|---|
| `probe.call` success | 2 |
| `bug.detected` (with saved repro) | 25 |
| `fix.verified` (failing→passing proof) | 40 |
| `report.drafted` approved by human | 15 |
| `patch.applied` that reduces tokens vs baseline | 10 |
| Day with ≥1 verified fix | streak +1 |
Anti-farming: XP only for events with `evidence`; duplicates (same repro hash) give 0.

# Ranks (name them with food puns, keep 6 levels)
Prep Cook → Line Cook → Sous Chef → Chef de Partie → Head Chef → Executive Chef. Thresholds in config; rank-up emits `xp.awarded` with `rankUp: true` and fires a one-time confetti (skipped under reduced motion).

# Streaks
- Streak = consecutive local days with ≥1 verified fix or approved report. Display flame count.
- **Streak border:** profile card border gradient tier by streak (1-2 plain, 3-6 ember, 7-13 gold, 14+ animated conic gradient). Pure CSS; static under `prefers-reduced-motion`.

# Badges (earned, not decorative; each has a rule and an evidence link)
`First Blood` (first confirmed bug) · `Green Run` (verify run with 0 regressions) · `Token Saver` (cache hit rate ≥ configured) · `Crosswalker` (match rate +X pts) · `Honest Broker` (a NOT_REPRODUCED report filed) · `Night Shift` (run between 00:00-05:00 local).

# Profile card (Discord-style, data-true)
- Banner gradient derived from the **molecule-family mix** of the user's last N cooked/probed ingredients (smoky, floral, sulfurous, citrus...). Mapping table in config; if no data: neutral banner, never random.
- Avatar, display name, rank pill, "Currently: <ingredient × ingredient>" status from the latest run, up to 3 pinned badges, XP bar to next rank, streak flame.
- **Two profiles exist:** the human's, and **Sous #1** (the agent's own card: endpoints probed · bugs found · fixes verified · tokens saved · crosswalk +pts). Sous's card is the live proof table.
- **Flavor twins:** cosine similarity over ingredient→molecule-family vectors between two profiles; show the shared molecules count. Requires real vectors; with fewer than 5 data points show "Not enough data" instead of a fake match.
- Customization (Discord feel): accent colour picker, banner preset vs data-derived toggle, pronoun-free bio (160 chars), badge pin order. Stored in `localStorage` + exported to `profile.json`.
