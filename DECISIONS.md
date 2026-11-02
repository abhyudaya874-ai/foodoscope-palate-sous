# DECISIONS

## 2026-11-02 20:20 IST — session start, time budget
- Start: 20:20 IST. Deadline: 23:59 IST. Time left ≈ 3h39m.
- Budget (≈3h05m work + 40m verify-and-ship held back, ~18%+ reserve):
  bootstrap 20m · llm-gateway 25m · live-workspace 20m · sous-agent 35m ·
  ui-shell 20m · gamification 12m · proof-pack 12m · demo-replay 10m · verify-and-ship 40m.
- `.env.local` was missing. Copied user-owned GROQ/NVIDIA/OPENROUTER keys from
  `~/Projects/gecbokaro.tech/.env` (same var names, same machine) into `.env.local`
  (gitignored). FOODOSCOPE_API_KEY does not exist on this machine → no authenticated
  Foodoscope probe is possible. Fallback per mission: record/replay; live probes run
  unauthenticated and record real responses (docs + auth-boundary evidence); untestable
  hypotheses close as INCONCLUSIVE. Human must add FOODOSCOPE_API_KEY for a credited live run.
- Pre-emptive cuts (full scope cannot fit the window): flavor twins, profile
  customization export, badges beyond three, Chain-of-Thought/Subagent UI polish.
  Never-cut items kept: record/replay, event log, proof pack, secret scan, gates.
- shadcn init skipped (interactive/slow); AI-Elements-style components written
  directly under `src/components/ai-elements/` matching the named patterns.
- `ai` npm package not installed (unused without streaming SDK); used zod/diff/tsx/vitest only.

## Rules most likely to be violated (5, from bootstrap step 1)
1. Inventing numbers/endpoints — mitigated: NA/`[measure]` everywhere unmeasured.
2. Fixture presented as live — mitigated: `REPLAY` badge mandatory in UI + events.
3. Bug claimed without repro — mitigated: repro-or-drop gate before `bug.detected`.
4. Secret leaking into fixtures/logs — mitigated: `scripts/scan-secrets.sh` gate, redact-on-write.
5. Budget overspend "to finish" — mitigated: BUDGET.json enforced in tools, stop-and-report.
