---
description: Add the Comet-style agentic browser - observe/decide/guard/act loop with safety invariants and live UI
---
# /build-browser-agent
**Context rules:** `15-small-model-guardrails.md`, `95-browser-agent.md`, `70-prompt-standards.md`, `30-llm-gateway.md`.
**Decide first:** 5-line design note in `DECISIONS.md` (rule 5). Name the 2 read-only tasks you will run.

1. **Copy contracts verbatim:** `reference/src/lib/browser/{types,guards,agent,decide,pw-driver}.ts` → `src/lib/browser/`. Add `maxBrowserSteps` (≤ 15) to `BUDGET.json`; add event type `browser.step`. One new dependency: `playwright` (then `pnpm exec playwright install chromium`).
2. **Copy tests:** `reference/tests/browser.test.ts` → `tests/`. All 9 must pass before any UI work. Never edit a test to pass.
3. **Wire `decide`:** `makeDecide(complete)` where `complete` calls the gateway role `browser` (temperature 0, JSON only), returning text. Do not change `decide.ts` logic; change only the injected function.
4. **Launcher** `scripts/run-browser.ts`: dynamic `import("playwright")`, headless by default, `--headed` flag for the demo; builds `driver` with `createPlaywrightDriver`; `allowDomains` from CLI; `confirm` = auto-deny in scripts, Confirmation element in the UI.
5. **Two real tasks (read-only):** (a) "On foodoscope.com docs, find the ingredient count and the rate-limit text" → rows into `workspace/data/ui_facts.csv`; (b) one competitor pricing page → `rivals.csv` rows tagged `source=browser`. Each ends in `done` with evidence keys.
6. **UI:** per `95-browser-agent.md` mapping; live `thought` line, element ref highlighted in the Terminal log, Confirmation card for gated actions, Sources from `extracted`.
7. **Record/replay:** save each `Observation`+`Decision` pair to `fixtures/browser/<run>.jsonl`; replay driver reads them (label `REPLAY`).

**Verify:** `pnpm typecheck && pnpm test`; headless run of task (a) ends `done` or `blocked`/`failed` with a reason, never hangs.
**Done when:** both tasks have a recorded run and CSV rows whose `source_url` is an `extracted` page.
