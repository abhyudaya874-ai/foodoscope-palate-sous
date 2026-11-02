# Palate + Sous (Foodoscope Fork It 2026, round 1)

**Palate**: gamified profile cards (XP, ranks, streak borders, badges) derived purely from an append-only event log. **Sous**: an autonomous agent that probes the Foodoscope APIs, proves or disproves contract gaps, ships verified fixes, and generates `PROOF.md` — every number traceable to an event or file.

## Run (replay, ~5 min, no keys, no network)

```bash
pnpm install
pnpm demo:replay        # offline agent run -> events + reports + UI fixture
pnpm dev                # http://localhost:3000 — press "▶ replay demo" (REPLAY badge)
pnpm test && pnpm proof # suite + regenerated PROOF.md
```

Live mode: copy `.env.example` → `.env.local`, add keys, `pnpm demo:record` (needs `FOODOSCOPE_API_KEY`), `tsx scripts/llm-smoke.ts` (LLM smoke). All API responses record to `fixtures/`; reruns replay offline.

## Architecture

Next.js 16 (App Router, TS, Tailwind). Append-only `events/*.jsonl` is the source of truth for XP/ranks/streaks and for `PROOF.md`. Loop: `probe → detect → fix → verify → ship → report` (`src/lib/agent/loop.ts`). LLM gateway: Groq / NVIDIA NIM / OpenRouter, OpenAI-compatible, fallback chain, budget caps (`BUDGET.json`), response cache in `fixtures/llm-cache/`. UI streams events over SSE (`/api/run`, `/api/run/[id]/stream`) into ai-elements blocks: Plan, Reasoning, Tool (provider/model/latency/tokens), Diff, CSV, Tests, Confirmation.

## Env vars

`GROQ_API_KEY` `NVIDIA_API_KEY` `OPENROUTER_API_KEY` `FOODOSCOPE_API_KEY` `COCKTAILDB_ENABLED` (gate; see honesty box). Missing keys → fallback/replay continues, never blocks.

## Endpoints

`POST /api/run` (replay run → `{runId}`) · `GET /api/run/[id]/stream?from=` (SSE, seq'd, resumable) · `POST /api/llm` (server-side gateway) · `/dev/workspace` (file/diff/CSV/terminal/tests panes).

## Fingerprint

`ApiKey not provided` → `Invalid API key` (401, Bearer auth gate fires before routing). Rate limit measured `x-ratelimit-limit: 25`/window (real header, `workspace/reports/limits.json`).

## Findings (repro-gated; full list in PROOF.md)

| ID | Status | Evidence |
|---|---|---|
| H2 param name `naturalSource`→`natural_source_name` | CONFIRMED | `fixtures/api/flavordb.entities.by.natural.source.923b967f.json` (400) + `.69fd2dc2.json` (200) |
| H1 entity has no molecule array | CONFIRMED (scoped to sampled entities) | `fixtures/api/…69fd2dc2.json` |
| B2 numeric fields string-encoded (`Calories:"832.0"`) | CONFIRMED | `fixtures/api/recipe2…d8de48bb.json` |
| H3 taste/aroma mixing · H4 doc-vs-API counts · H5 crosswalk drift · H6 molecule-count stub | INCONCLUSIVE / scoped | see PROOF.md + hypotheses.json |

Fix: `workspace/shim/index.ts` (param rewrite + numeric coercion). Verify: `workspace/tests/contract.test.ts` fails 2 without shim (`SOUS_SHIM=0`), 5/5 pass with it (`workspace/reports/verify-*.json`).

## Docs

`PROOF.md` (computed) · `docs/deck-outline.md` · `docs/video-script.md` · `docs/self-audit.md` · `docs/finale-plan.md` · `DECISIONS.md` · `workspace/openapi.inferred.yaml`.

## Honesty box

- Sous cannot patch the sponsor's server — it proposes mergeable fixes + a client shim; sponsor-facing writes require human confirmation.
- Unmeasured values render `[measure]`; `NA` in data. No invented endpoints, stats, or comparisons.
- The 3 confirmed bugs come from 3 real authenticated API calls (budget-stopped); everything else replays from those fixtures.
- CocktailDB is disabled unless `COCKTAILDB_ENABLED=true` (age rule).
- Only Groq returned a live response in testing; OpenRouter had no credits, NVIDIA rejected the catalog models — the fallback chain handles it.
