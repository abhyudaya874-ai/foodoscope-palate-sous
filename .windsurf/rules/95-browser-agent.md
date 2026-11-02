---
trigger: glob
globs: "src/lib/browser/**, src/components/browser/**, src/lib/intel/**"
description: Comet-style agentic browser - observe/decide/guard/act loop, safety invariants, UI mapping
---
# Contract
Copy `reference/src/lib/browser/*` verbatim: `types.ts` (Action/Decision/Driver), `guards.ts`, `agent.ts`, `decide.ts`, `pw-driver.ts`. The loop knows only the `Driver` interface; Playwright lives in `pw-driver.ts` and is the **only** file allowed to import it (dynamic `import("playwright")`, 1 new dependency).

# Loop (do not add stages)
observe → decide (LLM, JSON only) → validate (Zod) → guard → act → emit `browser.step`.
- Page state is a **numbered element list** (`e1..e60`) plus a 1.5k-char text excerpt, not raw HTML or screenshots. Refs are regex-validated (`^e\d{1,3}$`) so a model can never inject a CSS selector.
- Model role: `browser` (fast, cheap, JSON-reliable). Temperature 0. One action per step. `thought` ≤ 20 words (shown in the UI as the live "thinking" line).

# Safety invariants (each has a test; none may be removed)
1. **Default-deny hosts:** `goto` only to `allowDomains`; 3 blocked attempts end the run (`blocked`).
2. **Human gate:** password/OTP/card fields and buy/pay/delete/post/send style controls call `confirm()` first; denial ends the run.
3. **Grounded finish:** `done` requires `evidenceKeys` that exist in `extracted`. No extract, no answer.
4. **Loop stop:** same URL + same action 3× → `failed`. Hard `maxSteps` from `BUDGET.json` → `maxBrowserSteps`.
5. **Untrusted page:** page text is wrapped in `<untrusted_data>`; injection-looking text emits `bug.detected {kind:"injection"}` and is never obeyed.
6. **No secrets typed:** the agent never receives keys; extracted text is passed through `redact()`.
7. **Read-only by default:** tasks are lookups. Any write action needs an explicit task flag AND `confirm()`.

# Tasks worth giving it (read-only, allowlisted)
Read the token dashboard / rate limits page (human logs in first, agent reads), render-dependent docs pages Tavily can't see, competitor pricing/plan pages, a before/after "is the endpoint list in the UI the same as the docs". Output goes to `workspace/data/*.csv` via `csv.upsert` and shows live in the CSV tab.

# UI mapping (shadcn AI Elements, per `20-ui-ai-elements.md`)
Task = one `browser.step`; Reasoning = `thought` line; Tool = the action; Terminal = url + action log; Sources/Inline Citation = `extracted` keys with url; Confirmation = `confirm()`; Checkpoint before any write; shimmer while a step runs. Label replayed runs `REPLAY`.

# Tests required (copy `reference/tests/browser.test.ts`)
happy path, done-without-evidence rejected, host block, confirm denied, loop stop, invalid output ×2, unknown ref refused, injection flagged, step budget.
