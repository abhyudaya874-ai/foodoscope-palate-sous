# Devin kit: Palate + Sous

1. Copy this folder's contents into your repo root (keep `.devin/`, `AGENTS.md`, `scripts/`).
2. Open Devin, point it at the repo, and send: `/bootstrap`. Then run the workflows in the order listed in `AGENTS.md`, one per session.
3. Put keys in `.env.local` (never commit). `BUDGET.json` caps spend; raise it deliberately.
4. Using another tool? `bash scripts/sync-rules.sh` mirrors rules to `.windsurf/`, `.cursor/`, `CLAUDE.md`.

Time-boxed order for submission day: bootstrap → gateway → workspace → agent → UI → gamification → proof → replay → ship. If short on time, cut gamification depth first, never the proof pack.
