---
description: Build the OpenRouter/Groq/NVIDIA NIM gateway with roles, fallback, schemas, caching, budgets
---
# /build-llm-gateway
**Context rules:** `30-llm-gateway.md`, `70-prompt-standards.md`.

1. **Types first:** `src/lib/llm/types.ts` (Role, Provider, CompleteInput/Output, Usage) and `src/lib/events/types.ts` (event union from `10-agent-loop.md`) with a Zod schema for each event.
2. **Provider client:** one OpenAI-compatible fetch client parameterized by `{baseUrl, apiKeyEnv}`; supports `stream: true` (SSE parse) and non-stream. Timeout 30 s.
3. **Model discovery:** `scripts/fetch-models.ts` calls `GET /models` per provider with a present key, writes `fixtures/models.<provider>.json`; skip providers without keys and log it.
4. **Config:** `models.config.ts` maps role → ordered candidates by capability tag (not hardcoded IDs from memory). Ship a `pickModel(role)` that validates against the cached list and falls back.
5. **Gateway:** `complete()` per contract: schema validation + one repair retry, fallback chain with backoff, usage accounting, `llm.call` + `budget.update` events, response cache in `fixtures/llm-cache/`, `<untrusted_data>` wrapper helper.
6. **Route:** `src/app/api/llm/route.ts` (server only) for UI-initiated calls.
7. **Tests (vitest, no network):** fallback on 429, repair retry on bad JSON, cache hit emits `cache: true`, budget exhaustion throws `BudgetError`, secrets never appear in logged events.

**Verify:** `pnpm test` green; a script `pnpm tsx scripts/llm-smoke.ts` prints provider/model/latency for each available key.
**Done when:** removing one provider's key still lets every role resolve via fallback.
