# UI Audit — before (2026-11-02, replay mode, 1440×900 + 390 mobile)

Screenshots: `docs/ui/before/01-idle.png` … `05-mobile-idle.png`.

## Defects (ranked by impact)

| # | Defect | Evidence | Impact |
|---|---|---|---|
| 1 | Idle state is dead: two grey skeleton bars, no headline, no actions, no explanation | 01-idle.png center | Judge sees an empty app; 3-second comprehension fails |
| 2 | No focal point: everything same grey/size/weight; center is a void | 01-idle.png | Eye lands nowhere useful |
| 3 | Rank chip "Prep Cook" collides with "Sous #1" name on one line; card feels pasted on | 01-idle.png left rail | Identity layer unreadable |
| 4 | Top-bar pills cryptic: `no-provider`, `—`, `low` unlabeled; REPLAY badge tiny | 01-idle.png top | User can't tell what these are or change them |
| 5 | Right-pane tabs open to bare empty boxes ("PLAN" label only), 7 equal-weight tabs | 04-tab-*.png | No guidance; noise |
| 6 | Plan tab empty even though a plan exists after run (plan renders only in center) | 04-tab-plan.png | Right pane looks broken |
| 7 | Next.js dev "N" badge overlaps bottom-left | 01-idle.png | Unprofessional in demo |
| 8 | Composer is a bare input; no mode/provider pickers inside, no budget ring, no stop state | 01-idle.png footer | Single most important control is weakest |
| 9 | No citations/sources UI on the answer; receipts live only in tool rows | 03-finished.png | "Every claim has a receipt" not communicated |
| 10 | Mobile: rail hidden entirely, no sheet/drawer; right pane gone | 05-mobile-idle.png | 390px unusable beyond chat |
| 11 | Hand-rolled ai-elements (text/flow/input/tooling/answer) not the official shadcn patterns | src/components/ai-elements/ | DoD requires official patterns |
| 12 | Hardcoded zinc/emerald hex-ish classes everywhere; no token file | globals.css, page.tsx | Can't theme; magic values |

## What already works (keep)
- SSE replay stream + event→view mapping; tool cards with model badge/latency/tokens; red→green test flip; REPLAY badge concept; event-derived profile (no hardcoded stats).
