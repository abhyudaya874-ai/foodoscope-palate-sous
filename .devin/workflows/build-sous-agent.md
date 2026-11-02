---
description: Build the Sous agent loop - probe, detect, fix, verify, ship, report - with tools, subagents and gates
---
# /build-sous-agent
**Context rules:** `10-agent-loop.md`, `40-foodoscope-api.md`, `70-prompt-standards.md`, `30-llm-gateway.md`.

1. **Client:** `FoodoscopeClient` with token bucket, record/replay to `fixtures/`, typed errors, rate-limit header capture to `workspace/reports/limits.json`.
2. **Tools** (`src/lib/agent/tools/`): `probe.endpoint`, `fs.*`, `csv.upsert`, `test.run`, `report.draft`, `budget.check`. Each tool: Zod input/output, idempotent, emits events, returns structured errors.
3. **Prompts** (files per `70-prompt-standards.md`): `planner.plan`, `matcher.crosswalk`, `coder.shim`, `coder.contract-test`, `writer.bug-report`, `router.verify-claims`. Include one NA/abstention example in each.
4. **Loop** `runSous(goal)`: planner → DAG; for each step run tool-using sub-loop (max steps from budget); after Detect, enforce **repro-or-drop**; after Fix, run tests **before and after** the patch; Ship step raises `confirm.request`.
5. **Subagents:** per-endpoint probe and crosswalk batches run as parallel subagents; parent aggregates and owns the budget.
6. **Hypotheses H1-H6:** implement each as a contract test in `workspace/tests/`; the run records `CONFIRMED | NOT_REPRODUCED | INCONCLUSIVE`.
7. **Crosswalk:** per protocol; commit `sample.ingredients.csv`; output `crosswalk.csv` and a before/after summary event.
8. **Shim package:** `workspace/shim/` exports `createFoodoscopeShim()` that fixes confirmed contract issues only (no speculative patches).
9. **Bug reports:** markdown with title, environment, curl, expected vs actual, evidence path, severity; claims pass `router.verify-claims`.
10. **Tests:** loop with mocked client: budget stop, injection string in API response is ignored and logged, NOT_REPRODUCED path, retry only on `transient`.

**Verify:** `pnpm tsx scripts/run-sous.ts --replay` produces events, files, and a report, with zero network.
**Done when:** a live run (keys present, tiny budget) completes or stops cleanly on budget with a summary.
