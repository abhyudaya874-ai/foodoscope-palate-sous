---
trigger: always_on
description: Mission, prime directives and definition of done for Palate + Sous
---
# Mission
Build **Palate**: a gamified profile layer (profile cards, streak borders, ranks) plus **Sous**, an autonomous agent that probes the Foodoscope APIs (RecipeDB, FlavorDB, CocktailDB), finds gaps, ships fixes (client shim, data patches, tests, bug reports), verifies them, and reports.

Deadlines: round-1 PPT + 3-5 min video due **2 Nov 2026, 11:59 PM IST** (video file max 50 MB or public YouTube/Drive link). Finale 14-15 Nov 2026 (24 h, on-campus) needs a working prototype. Winners present at GastroSym, 12 Dec 2026.

# Prime directives
1. **Proof over polish.** Every number in UI, README or deck traces to a logged event or a source URL.
2. **Never invent data.** Unknown = `NA` in data, `[measure]` in prose. No estimates, no rounding up, no placeholder stats that look real.
3. **Creative concept, boring code.** Next.js + local files. No auth, no external DB, no microservices, no extra frameworks.
4. **Make the agent visible.** Plan, thinking, tool calls, file diffs, tests, provider/model, tokens and latency render live.
5. **The event log is the source of truth.** XP, ranks, streaks, profile stats and the proof table are *derived* from `events/*.jsonl`, never typed by hand.
6. **Do not over-claim.** Molecular pairing is not exclusive to Foodoscope (Foodpairing documents it). 25,595 molecules is not 25,595 food-linked molecules (2,254 in the 2017 paper). Say "documented", not "only".

# Definition of done
- `pnpm typecheck` and `pnpm test` pass; no new lint errors.
- The feature is visible in the UI and emits events.
- Proof numbers, if touched, regenerate with `pnpm proof`.
- No secrets in code, logs, fixtures or screenshots.

# How to work
- Before multi-file edits: a plan of at most 7 bullets. After each step: run the check, then continue.
- Do not ask what you can learn from the repo, docs or fixtures. Ask only for a missing secret or a destructive action. Log non-obvious decisions as one line in `DECISIONS.md`.
- Commits are small: `feat|fix|chore(scope): message`.
- Replies: action first, dense, no preamble.
