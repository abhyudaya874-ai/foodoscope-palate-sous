# Palate + Sous (Foodoscope Fork It 2026)

Gamified profile cards plus **Sous**, an autonomous agent that probes the Foodoscope APIs, ships verified fixes, and proves it from an event log.

- Rules live in `.devin/rules/` (auto-loaded by trigger). Read `00-mission.md` and `15-small-model-guardrails.md` first. Contract files in `reference/` are copied verbatim.
- Workflows (run in order): `/bootstrap` → `/build-llm-gateway` → `/build-live-workspace` → `/build-sous-agent` → `/build-search-intel` → `/build-browser-agent` → `/build-ui-shell` → `/build-gamification` → `/proof-pack` → `/demo-replay` → `/verify-and-ship`.
- Never invent numbers (`NA` / `[measure]`). Never exceed `BUDGET.json`. Act, don't ask, unless a secret is missing or an action is destructive.
