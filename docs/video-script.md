# Pitch video — complete run-of-show (target 4:00, hard range 3:30–4:30)

Every number you say exists in `PROOF.md` with a source tag. If it shows `[measure]`, don't say the number.
Story spine: **their problems → our agent fixing them live → proof → what the sponsor gets.**

## Before you hit record (10 min)
1. `pnpm dev` → app on `localhost:3001` (port 3000 is another project on this machine).
2. Open tabs, in order, all pre-loaded: (a) the app idle screen, (b) `PROOF.md` scrolled to the top, (c) `workspace/reports/bug-h2.md`, (d) `workspace/data/crosswalk.csv`.
3. Terminal ready with `pnpm tsx scripts/run-intel.ts --replay` typed but NOT run.
4. Browser zoom 125%, hide bookmarks bar, close every other tab, mic test 10 s.
5. Rehearse the two approval clicks — the run pauses there by design; don't panic, that's the demo.

## The script

| Time | On screen — do this | Say this (word for word) |
|---|---|---|
| 0:00–0:25 | Show the app idle screen (hero). Then cut to `bug-h2.md` for 3 s. | "Every team building on Foodoscope hits the same walls. The docs say one parameter name, the API rejects it. Numbers arrive as strings. RecipeDB and FlavorDB ingredient names don't line up. And with a 200-token trial, every team burns their budget rediscovering the same bugs. We know — we hit them too, and we kept the receipts." |
| 0:25–0:45 | Back to the app. Click the goal chip "Fix the crosswalk for my ingredient CSV". | "So we built Sous — an autonomous agent that probes the Foodoscope APIs, proves every gap with recorded evidence, ships the fix, and files the report. Watch it work." |
| 0:45–1:15 | The "Working" card opens: live model thinking streams (groq · gpt-oss-120b badge), then the plan card fills: 8 steps pending → running. | "First, real model reasoning — streamed live, not scripted. Then Sous plans the whole job: probe, detect, fix, verify, ship, report. Every step shows the model, the latency, the tokens." |
| 1:15–1:50 | Command card: `$ GET /flavordb/entities/by-natural-source → 400 (replayed)` then `→ 200`. Point cursor at the 400. | "Here's the sponsor's own doc bug, caught live: the documented parameter `naturalSource` returns HTTP 400. The API actually wants `natural_source_name`. Sous recorded both responses as fixtures — that's the evidence, reproducible by anyone." |
| 1:50–2:20 | The shim diff card (`+21 −0` on bug-h2.md / shim file), then the crosswalk CSV card: rows 30, cells highlighted. | "Sous doesn't just complain — it fixes. A client shim rewrites the parameter and coerces those string-encoded numbers. And a crosswalk with Hindi aliases — jeera to cumin — lifted ingredient matching from 9 to 13 out of 30 sample names." |
| 2:20–2:50 | Test card: before 3 passed · 2 failed → after 5 passed · 0 failed, red→green bar. | "And it proves the fix: the generated contract suite fails before the shim — 3 passed, 2 failed — and passes after — 5 for 5. No failing-then-passing test, no verified fix. That rule is the whole product." |
| 2:50–3:15 | The approval card: "Approval needed — sponsor-facing write". Click **Approve**. Then the second approval, click **Approve**. | "Sponsor-facing writes need a human. Sous is paused right now — nothing is written until I approve it. In an audit tool, that gate is the trust." |
| 3:15–3:40 | The answer settles with inline citations [1][2]; click [7] → Sources popover opens on row 7 (a real Tavily URL); hover another chip → preview card. | "The answer carries receipts. Click any citation and you land on the exact source — live web results from Tavily and Exa, plus our own API fixtures. Twelve real web receipts back the competitor checks. Nothing here is synthesized." |
| 3:40–4:00 | Right pane auto-follows to the Browser tab: Comet-style window, cursor moves to PRICING, click, extract highlight on the pricing table, "REPLAY · recorded run" label. | "Sous even delegates to its own browser agent — you're watching it open Spoonacular's pricing page, click Pricing, and extract the real table: free tier, 50 points a day. Recorded run, clearly labelled." |
| 4:00–4:25 | Left rail: Sous #1 card (rank Sous Chef, 176 XP, streak, badges). Then `PROOF.md` — scroll the numbers. | "Everything Sous does feeds its own profile — XP, ranks, streaks, all computed from the event log, never typed. And this is the proof file, regenerated from 136 events: 6 endpoints probed, 3 confirmed bugs, 2 verified fixes, rate limit measured at 25 requests per window." |
| 4:25–4:50 | Split: `PROOF.md` honesty box + the competitor board in the deck (or `docs/deck-outline.md` slide 5). | "Why this wins: Foodpairing does molecular pairing — but it's closed and paid. Spoonacular has no molecule layer. MyFitnessPal plus ChatGPT has no chemistry and no receipts. We don't claim 'only we' — we claim proof: an agent that audits the sponsor's own API, ships mergeable fixes, and hands CoSy Lab a free QA pipeline — the exact thing their Bug Bounty hamper rewards." |
| 4:50–5:00 | App hero screen. | "Palate plus Sous. Give it a goal. Watch it work. Every claim keeps its receipt." |

## If you must cut to 3:30
Drop the browser-agent beat (3:40–4:00) and the second approval click; keep everything else.

## What you're running (for the description / README link)
- `pnpm dev` — the app (replay mode: offline, no keys).
- `pnpm tsx scripts/run-intel.ts --replay` — regenerates rivals + claims CSVs from cached search evidence.
- `pnpm proof && pnpm proof:check` — regenerates and validates PROOF.md from the event log.

## Delivery notes
- Speak over the visuals, never ahead of them: name a thing only after it's on screen.
- The two pauses (approvals) are intentional — use them to breathe; they demonstrate the human gate.
- Never say "only", "first ever", "guaranteed". Say "documented", "measured", "recorded".
- If the thinking stream takes >8 s to start, keep talking about the plan card — it always arrives.

## Recording checklist
1080p · UI zoom 125% · hide env vars and other tabs · mic test · export H.264 CRF 28 ≤ 50 MB or public YouTube/Drive link · test the link logged-out.
