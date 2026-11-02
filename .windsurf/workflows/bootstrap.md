---
description: Scaffold the Next.js app, tooling, folder layout, BUDGET.json and env template (run first)
---
# /bootstrap
**Goal:** a green, empty skeleton that every later workflow builds on. Time box: 20 min.

1. Read `AGENTS.md` and all `.devin/rules/*.md`. Summarize the 5 rules most likely to be violated in ≤5 lines in `DECISIONS.md`.
2. Scaffold: `pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --use-pnpm --yes` (skip if `package.json` exists).
3. Add tooling: `pnpm dlx shadcn@latest init`, then `pnpm add ai zod diff fastest-levenshtein` and `pnpm add -D vitest @vitest/coverage-v8 tsx`. No other dependencies.
4. Create folders: `src/lib/{llm,foodoscope,agent,events,workspace,gamification,prompts}`, `src/components/{ai-elements,workspace,profile}`, `workspace/{tests,bugs,data,shim,reports}`, `fixtures/`, `events/`, `scripts/`.
5. Write `BUDGET.json` with: `maxToolCallsPerRun: 40`, `maxApiCalls`, `maxLlmTokensPerRun`, `perRoleTokenCaps`, `foodoscopeTokenWallet` (use a deliberately low default; a human raises it).
6. Write `.env.example` (`GROQ_API_KEY=`, `NVIDIA_API_KEY=`, `OPENROUTER_API_KEY=`, `FOODOSCOPE_API_KEY=`, `COCKTAILDB_ENABLED=false`), add `.env*` (except example) to `.gitignore`.
7. Add scripts to `package.json`: `typecheck`, `test`, `eval`, `proof`, `demo:replay`, `scan` (`bash scripts/scan-secrets.sh`).
8. `git init`, first commit `chore: scaffold`.

**Verify:** `pnpm typecheck && pnpm build` pass. **Done when:** the app boots at `localhost:3000` and the folder tree matches step 4.
**Stop and ask only if:** `pnpm` or Node is missing.
