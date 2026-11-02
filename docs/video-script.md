# Video script — Palate + Sous (target 3:50; beats sum to 3:50 within the 3:30–4:30 rule)

Every number below exists in PROOF.md with a source tag. Where PROOF shows `[measure]`, we do not say the number.

## 0:00–0:30 — Problem
- Hackathon teams integrating the Foodoscope APIs hit the same walls: docs drift from the live API, numeric fields arrive as strings, names don't align between RecipeDB and FlavorDB.
- "We built Sous: an agent that probes the API, proves or disproves the gaps with recorded evidence, and ships verified fixes — plus Palate, the profile layer that turns that work into a game."
- Show: PROOF.md header (33 events → numbers on screen).

## 0:30–1:30 — Palate profile card
- Profile card = pure function of the event log: XP, rank, streak border, badges — nothing hand-typed.
- Show: the Sous #1 card — rank pill, XP bar, badges (First Blood, Green Run, Crosswalker), streak border tiers.
- Say: "Delete localStorage, replay events — identical stats. It's derived, never typed."

## 1:30–3:00 — Sous run (live replay, REPLAY badge visible)
- Plan appears → probe tool cards: `GET /recipe2-api/.../recipeByTitle` → 200, `GET /flavordb/entities/by-natural-source` → 400 then 200.
- Say: "every API response is saved as a fixture — this is the evidence the whole deck cites."
- Detect: H2 CONFIRMED — the Postman-documented param `naturalSource` is rejected; the API wants `natural_source_name`. Show bug card with the curl.
- Fix: crosswalk CSV gains rows on screen (9 → 13 of 30 sample names via the alias table); shim diff streams into `workspace/shim/index.ts` — param rewrite + numeric coercion.
- Verify: contract suite runs before → 2 failures; shim enabled → 5 pass / 0 fail. Red→green, once.
- Receipts: bug report drafted; human Confirmation approves the sponsor-facing write.

## 3:00–3:45 — Sous card + proof table
- Sous's own profile card is the live proof table: endpoints probed 6, bugs confirmed 3, fixes verified 2, crosswalk 9→13.
- Every number links to an event id or a committed file — that's the anti-hallucination design.

## 3:45–4:15 — How it stands out
- "Continuous integrity monitor": repro-or-drop means a hypothesis that doesn't reproduce is reported as NOT_REPRODUCED — no invented bugs.
- Documented comparison only: similar tools probe APIs; Sous produces evidence-linked fixes you can merge. (Nothing claimed exclusive.)
- Endpoints used — from the probe, not memory: `/recipe2-api/recipe-bytitle/recipeByTitle`, `/flavordb/entities/by-natural-source` (plus 39 documented FlavorDB paths listed in `workspace/openapi.inferred.yaml`).

## Recording checklist
1080p · UI zoom 125% · hide env vars/tabs · mic test · export H.264 CRF 28 ≤ 50 MB or public YouTube/Drive link · test link logged-out.
