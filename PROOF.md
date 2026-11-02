# PROOF — Palate + Sous

Generated: 2026-11-02T15:25:33.781Z from 33 events in events/*.jsonl

## Probe coverage
- endpoints probed: 6 (source: probe.call events)
- API calls spent: 3 live / 3 replayed (source: probe.call.replay)
- measured rate limit: 25 req/window (source: workspace/reports/limits.json)

## LLM usage
- llm calls: 0 (replay run used deterministic plan) (source: events)
- llm tokens total: [measure] (source: llm.call)
- cache hits: 0 (rate [measure]); tokens saved vs uncached baseline: 0 (source: fixtures/llm-cache + llm.call.cache)

## Bugs by status
- CONFIRMED: by-natural-source rejects documented param 'naturalSource'; actual param is 'natural_source_name' (source: fixtures/api/flavordb.entities.by.natural.source.923b967f.json)
- CONFIRMED: Entity response lacks molecule array — no direct entity→molecule join (source: fixtures/api/flavordb.entities.by.natural.source.69fd2dc2.json)
- CONFIRMED: Recipe numeric fields (Calories, times, servings) are string-encoded (source: fixtures/api/recipe2.api.recipe.bytitle.recipebytitle.d8de48bb.json)

## Verified fixes (failing before -> passing after)
- H2: workspace/reports/verify-run-mvzesxsd-72fc1a.json (source: workspace/reports/verify-run-mvzesxsd-72fc1a.json)
- B2: workspace/reports/verify-run-mvzesxsd-72fc1a.json (source: workspace/reports/verify-run-mvzesxsd-72fc1a.json)

## Test phases
- workspace/tests/contract.test.ts [before]: 3 pass / 2 fail (source: test.run events)
- workspace/tests/contract.test.ts [after]: 5 pass / 0 fail (source: test.run events)

## Crosswalk
- matched: 9 -> 13 on N=30 sample rows (source: workspace/data/crosswalk.csv recomputed)
- hand-checked precision on 20 rows: [measure] (checked column empty)

## Reports
- workspace/reports/bug-h2.md approved=true (source: report.drafted)

## Honesty box
- Sous cannot patch the sponsor's server. It proposes mergeable patches + a client shim; applying data/report outputs asks a human (Confirmation gate; replay auto-approves and says so).
- Numbers not measured render as [measure], never estimates.
- CocktailDB: disabled unless COCKTAILDB_ENABLED=true (source: .env.example + 40-foodoscope-api.md)
