# Finale plan (14–15 Nov, 24h on-campus)

## Pre-finale (before travel)
- [ ] Rotate `FOODOSCOPE_API_KEY` (key was pasted in chat — treat as compromised). Add to `.env.local`.
- [ ] `pnpm demo:record` — one fresh live run on rotated key (tiny budget); commit new fixtures/events/PROOF.
- [ ] Record the video per `docs/video-script.md`; export ≤50 MB or public link; verify link logged-out.
- [ ] Build the PPT per `docs/deck-outline.md` using `proof.slides.json` numbers.
- [ ] Submit round-1: repo public link + video + PPT by 23:59 IST.

## At the finale (24h)
- [ ] `pnpm install && pnpm demo:replay` on fresh machine BEFORE relying on venue Wi-Fi.
- [ ] Widen probe coverage within `BUDGET.json` (postman-derived endpoint list, rate-limit-aware).
- [ ] Hand-check 20 crosswalk rows; fill `checked` column; flip `[measure]` to a real precision number.
- [ ] CocktailDB only if all members confirmed 18+ AND `COCKTAILDB_ENABLED=true`.
- [ ] Flavor twins: requires ≥5 profile vectors — build from real run data, else show "Not enough data".
- [ ] Final gates: typecheck → lint → test → eval → proof → proof:check → build; tag `v1.0-finale`.

## Risks
- Venue network dead → replay mode covers the whole demo (verified offline).
- Trial wallet exhausted → replay + documented-paths demo; no live spend needed.
- Model provider flaky → gateway falls back (proven live: nvidia 404 → openrouter 402 → groq 200).
