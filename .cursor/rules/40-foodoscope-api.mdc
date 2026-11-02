---
trigger: glob
globs: "src/lib/foodoscope/**, workspace/**, fixtures/**, scripts/**"
description: Foodoscope API client rules, known issues as hypotheses to test, probing protocol
---
# Ground rules
- Base URLs, paths, params and auth come from the **official docs / the live API**, discovered at probe time. Do not guess endpoints. If docs are unreachable, the probe infers from responses and logs `docs: unavailable`.
- Trial limits reported by the sponsor material: ~200 tokens, ~25 req/min. Treat as **unverified until the probe measures them**; read rate-limit headers and write the measured values to `workspace/reports/limits.json`.
- Client: one typed wrapper `FoodoscopeClient` with `get()`, token-bucket rate limiter, request id, record/replay, and typed errors (`ContractError`, `AuthError`, `RateLimitError`, `BudgetError`).

# Hypotheses to TEST (never assert as fact)
| ID | Hypothesis | Test that decides it |
|---|---|---|
| H1 | Ingredient response lacks a molecule array, so no direct ingredient→molecule join | Call ingredient endpoint, assert field presence; if absent, build join via FlavorDB name lookup |
| H2 | A by-flavor-profile endpoint rejects the documented param name (HTTP 400) and wants another | Call with documented and alternative names; record both statuses |
| H3 | Taste vs aroma descriptors are mixed in one field | Sample N descriptors, classify with rule table, hand-check 20 rows |
| H4 | Ingredient counts differ between docs, UI and API (e.g. 936 vs "1,000+") | Count via API pagination where possible; record version/date |
| H5 | RecipeDB and FlavorDB ingredient names do not align | Crosswalk match rate before/after on a fixed sample file |
| H6 | Only a fraction of FlavorDB molecules are food-linked | Count linked vs total from API; cite paper only as context |
Status per hypothesis: `CONFIRMED | NOT_REPRODUCED | INCONCLUSIVE`, with evidence path. A clean production API is a **good result**: the story becomes "continuous integrity monitor, 0 regressions".

# Probe protocol
1. Read docs page(s) → list endpoints (cap at budget).
2. One call per endpoint with minimal params; save `fixtures/<endpoint>.json` (redacted).
3. Infer schema (types, nullable, enums) → `workspace/openapi.inferred.yaml`.
4. Generate contract tests from the inferred schema plus H1-H6.
5. Compute: endpoints probed, tokens spent, failures/tests.

# Crosswalk protocol (the measurable fix)
Fixed sample file `workspace/data/sample.ingredients.csv` (committed, never regenerated mid-run). Pipeline: normalize (lowercase, strip, singularize, remove punctuation) → exact → alias table (Hindi/Indian names: `jeera`→`cumin`, `haldi`→`turmeric`, ...) → fuzzy (token-set ratio ≥ threshold in config) → LLM suggestion for the remainder with `matcher` role, confidence-labelled. Report `matched_before`, `matched_after`, `N`, plus hand-checked precision on 20 sampled rows (human fills `checked` column; empty = `[measure]`).

# Cocktails
CocktailDB requires every team member to be 18+ and declared at registration. **Default: do not call CocktailDB.** Enable only if `COCKTAILDB_ENABLED=true` is set by a human.
