---
description: Build XP, ranks, streaks, badges, data-true profile cards, flavor twins and the Sous agent card
---
# /build-gamification
**Context rules:** `60-gamification.md`, `20-ui-ai-elements.md`.

1. **Derivation:** `deriveProfile(events)` pure function + config files (`xp.config.ts`, `ranks.config.ts`, `badges.config.ts`, `families.config.ts` for banner colors).
2. **Property tests:** replaying the same events yields the same profile; duplicate repro hash gives 0 XP; events without `evidence` give 0 XP; streak rolls over local midnight correctly.
3. **Components:** `ProfileCard` (banner, avatar, rank pill, status, pinned badges, XP bar, flame), `StreakBorder` (CSS conic gradient tiers, static under reduced motion), `BadgeShelf`, `RankUpToast`.
4. **Sous card:** a second `ProfileCard` bound to the agent's own events: endpoints probed · bugs found · fixes verified · tokens saved · crosswalk +pts. Anything unmeasured renders `[measure]`.
5. **Flavor twins:** cosine similarity on molecule-family vectors; "Not enough data" under 5 points; show shared-molecule count only from real data.
6. **Customization:** accent picker, banner toggle (data-derived vs preset), bio (160 chars), badge pin order; persisted to `localStorage` and exportable `profile.json`.
7. **Profile tab** in the workspace panes plus the sidebar mini-card.

**Verify:** run replay; XP ticks up as events stream, a badge unlocks, the streak border tier changes when seeded with multi-day events.
**Done when:** deleting `localStorage` and reloading reproduces identical stats from the event log.
