---
trigger: glob
globs: "src/lib/search/**, src/lib/intel/**, workspace/data/**"
description: Live Tavily + Exa search - routing policy, evidence contract, and which Sous intel modules use which provider
---
# Contract
Copy `reference/src/lib/search/*` verbatim (types, http, evidence, tavily, exa, router). Do not add a third provider or a second HTTP helper. Keys come in via `deps.keys`; `maxCalls` comes from `BUDGET.json` → `maxSearchCalls`.

# Routing = intent, not vibes (the only design decision; lives in `POLICY`)
| Intent | Providers | Use when |
|---|---|---|
| `current` | Tavily → Exa | "is it still alive / pricing / news as of now" |
| `discover` | Exa → Tavily | semantic "find things like..." |
| `verify` | Tavily + Exa **both** | a claim that will appear in the deck; report `agreement` |
| `paper` | Exa (research paper) | citations and provenance for RecipeDB/FlavorDB/CocktailDB |
| `company` | Exa (company) | competitor/startup scans |
| `similar` | Exa findSimilar | competitors of a seed URL |
| `extract` | Tavily extract | clean text of a known URL (docs pages) |

# Evidence rules
- Every search result becomes an `Evidence` with `id = sha1(url)[0..10]`. A model may cite **only** `[id]`s it was given. A claim without a valid `[id]` is deleted by the verifier.
- Search text enters prompts **only** via `asPromptBlock()` (wrapped as untrusted data). Flagged items are shown as hostile text, never followed.
- Confidence is mechanical: both providers returned the host → `M`; single provider → `L`; `H` only after a human ticks it. Never model-assigned.
- Cache + replay: every response lands in `fixtures/search-cache/`; demo/replay mode throws on a cache miss instead of hitting the network.

# Where each tool earns its keep in Palate + Sous
| Module (`src/lib/intel/`) | What it does | Tool | Output shown in UI |
|---|---|---|---|
| `RivalWatch` | Is each competitor still active, current pricing/API terms | Tavily `current` + Exa `similar` | `workspace/data/rivals.csv` live rows + Sources chips |
| `ClaimReceipts` | Re-checks every number/comparison in the deck (e.g. 936 vs "1,000+") | `verify` (both) | Inline Citation per claim, agreement badge |
| `DocsDrift` | Extract Foodoscope docs pages, diff against last snapshot, flag doc/API mismatch candidates | Tavily `extract` | Diff tab; feeds Sous hypotheses |
| `PaperLink` | Papers + citation context for RecipeDB/FlavorDB/CocktailDB | Exa `paper` | Provenance column in CSV |
| `AliasEvidence` | Web evidence that `jeera = cumin`, `haldi = turmeric` for crosswalk gaps | Exa `discover` | `alias_evidence` column; raises crosswalk confidence from `L` to `M` |
| `WinnerScan` | Public posts/repos from past Fork It editions | Exa `discover` + Tavily `current` | `winners.csv` (NA if nothing found; never inferred) |
Build `RivalWatch` first (exemplar exists), then `ClaimReceipts`. Others only if time allows.

# Tests required (copy `reference/tests/router.test.ts`)
policy order + fallback, verify agreement, cache hit = 0 calls, budget stop, replay miss never touches network, injection flagged.
