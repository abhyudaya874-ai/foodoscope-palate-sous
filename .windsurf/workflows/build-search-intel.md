---
description: Add live Tavily + Exa search with intent routing, evidence ids, caching, and the RivalWatch/ClaimReceipts intel modules
---
# /build-search-intel
**Context rules:** `15-small-model-guardrails.md`, `90-search-intel.md`, `70-prompt-standards.md`, `30-llm-gateway.md`.
**Decide first:** write the 5-line design note in `DECISIONS.md` (rule 5).

1. **Copy contracts verbatim:** `reference/src/lib/search/{types,http,evidence,tavily,exa,router}.ts` → `src/lib/search/`. Add `maxSearchCalls` to `BUDGET.json`; add `TAVILY_API_KEY`, `EXA_API_KEY` to `.env.example` (empty). Add event types `search.call` to `src/lib/events/types.ts`.
2. **Copy tests:** `reference/tests/router.test.ts` → `tests/`. Run `pnpm test`; all 6 pass before continuing.
3. **Config:** in `src/lib/config.ts` (the only reader of env) build `deps` (keys, mode live|replay, cacheDir `fixtures/search-cache`, maxCalls, emit). If a key is missing, leave it undefined; the router already skips that provider.
4. **Prompts:** copy `reference/src/lib/prompts/search.*.prompt.md`; wire `planner` → `createSearch()` → `synthesize` using the `writer` role with the Zod schemas from the prompt files; validate; invalid JSON retries once.
5. **RivalWatch:** copy `reference/src/lib/search/rival-watch.ts` to `src/lib/intel/`; wire `csv` to the workspace `csv.upsert` tool so rows stream into the CSV tab. Run for the six rivals in `docs/rivals.txt` (Spoonacular, Edamam, Foodpairing, Samsung Food, HealthifyMe, NotCo).
6. **ClaimReceipts:** copy the RivalWatch shape; input = list of claims from the deck outline; call `verify`; output `claims.csv` with `claim, verdict(supported|contradicted|NA), ids, agreement, confidence`. A claim with no evidence = `NA`, never `supported`.
7. **UI:** Sources row + Inline Citation per `[id]` (hover shows title, url, provider, date); Terminal shows `search.call` lines with `cached` and latency; Context bar shows `calls used / maxSearchCalls`.
8. **Live run:** one real run with `maxSearchCalls` ≤ 12 (RivalWatch for 6 rivals + 3 ClaimReceipts). Cache lands in `fixtures/search-cache/`.

**Verify:** `pnpm typecheck && pnpm test`; then `pnpm tsx scripts/run-intel.ts --replay` makes `rivals.csv` and `claims.csv` with zero network.
**Done when:** every row in both CSVs has a `source_url` and `evidence_id`; unsupported claims are `NA`.
