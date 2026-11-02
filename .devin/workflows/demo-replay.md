---
description: Build record/replay demo mode and the 4-minute video run-of-show; works offline for the finale
---
# /demo-replay
1. `pnpm demo:record` performs one real run (tiny budget), saving API fixtures, LLM cache and `events/demo.jsonl`. Scan for secrets after.
2. `pnpm demo:replay` replays the same run at adjustable speed with the `REPLAY` badge; zero network, zero keys.
3. **Scripted beats** (`docs/video-script.md`, timings must sum to 3:30-4:30):
   - 0:00-0:30 problem: hackathon teams hit the same API gaps (cite only what PROOF.md shows).
   - 0:30-1:30 Palate profile card: data-derived banner, streak border, rank, flavor twin.
   - 1:30-3:00 Sous run: plan → probe → bug with curl → shim diff → CSV crosswalk grows → test red→green → receipts.
   - 3:00-3:45 Sous card + Proof table + report drafted (human Confirmation click).
   - 3:45-4:15 how it stands out (documented comparison only), scale, endpoints used (list from the probe, not memory).
4. **Slide support:** `docs/deck-outline.md` with 8 slides mapped to the PPT rubric: idea, problem, users, how it helps, similar products + key difference, practicality & scalability, endpoints, proof.
5. **Recording checklist:** 1080p, hide env vars and tabs, increase UI zoom, mic test, ≤ 50 MB (export H.264, CRF 28) or public YouTube/Drive link; test the link logged-out.

**Verify:** unplug network and run `pnpm demo:replay`; it must finish and show identical numbers to PROOF.md.
**Done when:** the run-of-show timings sum correctly and every spoken number exists in PROOF.md.
