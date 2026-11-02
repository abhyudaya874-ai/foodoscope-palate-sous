---
description: Generate PROOF.md and chart-ready data from the event log; flag every unmeasured number
---
# /proof-pack
**Principle:** the proof is computed, never written. Context: `00-mission.md`, `80-quality-gates.md`.

1. `scripts/proof.ts` reads `events/*.jsonl` and emits `PROOF.md` + `proof.json`:
   - endpoints probed, tokens spent (API wallet), LLM tokens by provider, cache hit rate / tokens saved vs naive baseline (baseline = same calls with no cache and no shim, computed by replaying the call list),
   - bugs by status (CONFIRMED / NOT_REPRODUCED / INCONCLUSIVE) with evidence paths,
   - tests failing-before / passing-after per fix, regressions,
   - crosswalk `matched_before → matched_after` on N sample rows, hand-checked precision (or `[measure]`).
2. Each number links to its source event ids or file path. Missing → `[measure]`, never an estimate.
3. Emit `proof.slides.json`: arrays ready for python-pptx native charts (before/after bar, funnel of probe→bug→fix→verified), each with `headline`, `source`, `as_of`.
4. Add `pnpm proof:check`: fails if `PROOF.md` contains a number with no `source:` tag.
5. Add a "Honesty box" to PROOF.md: what Sous cannot do (cannot patch the sponsor's server; proposes mergeable patches and a client shim).

**Verify:** `pnpm proof && pnpm proof:check` pass; deleting an evidence file turns that line into `[measure]` instead of crashing.
**Done when:** every claim you plan to say in the video appears in PROOF.md with a source.
