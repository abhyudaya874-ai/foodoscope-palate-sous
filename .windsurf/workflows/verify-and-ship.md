---
description: Final gates, secret scan, README, submission checklist and finale readiness
---
# /verify-and-ship
1. Run gates in order: `pnpm typecheck && pnpm lint && pnpm test && pnpm eval && pnpm proof && pnpm proof:check && pnpm build`. Fix failures at the root cause; never weaken tests.
2. `bash scripts/scan-secrets.sh` on the working tree **and** `git log -p`; rotate any key found.
3. **Self-audit (chain-of-verification):** list every number and comparison claim in README, PROOF.md, `docs/deck-outline.md`, `docs/video-script.md`. For each, output `{claim, source, verified: yes|no}`. Remove or mark `[measure]` anything `no`.
4. README (≤ 80 lines): what it is, 5-minute run steps (replay first, live second), architecture diagram (Mermaid), env vars, endpoints used, honesty box, limitations, license.
5. Repo hygiene: public repo, LICENSE, `.env.example`, no large binaries, `fixtures/` redacted.
6. **Submission checklist** (output as a checkbox list for the human): PPT uploaded; video file ≤ 50 MB or public link verified logged-out; repo link works; team members' ages/IDs ready if CocktailDB is used (default off); finale kit: laptop, charger, offline replay tested.
7. Tag `v0.1-round1`; write a 10-line "finale plan" in `docs/finale-plan.md` (what to build live in the 24 h on top of this base).

**Done when:** the checklist is printed, every box is either checked by you or assigned to the human with the exact action.
**Stop and ask only if:** a gate fails twice for a reason you cannot determine from logs.
