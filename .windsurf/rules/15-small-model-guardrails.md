---
trigger: always_on
description: Guardrails so small/fast models (Haiku 5.5) keep the architecture instead of improvising a weak one
---
# Why this exists
Small models fail at **system design**, not at typing code: they merge layers, invent parallel abstractions, widen types to `any`, and "simplify" safety away. These rules take design decisions out of their hands.

# 1. Contract files are frozen
Files marked `// CONTRACT FILE` (in `reference/`) are copied **verbatim** into `src/`. Never rename, reshape, widen or "improve" them. A change needs an ADR line in `DECISIONS.md` first: `ADR-n | what | why | tests touched`.

# 2. Copy the exemplar, don't invent
For any new module, find the nearest file in `reference/` and copy its **shape** (inputs injected, pure core, thin IO edge, one exported factory). Say which exemplar you copied in the commit body.

# 3. Layering is fixed (a module may import only downward)
`ui` → `agent/intel modules` → `search | browser | foodoscope | llm` → `events | workspace`. Providers (Tavily, Exa, Playwright) are imported only inside their own adapter file. UI never imports a provider.

# 4. Dependency injection, always
Anything that touches network, clock, disk, or a browser is passed in (`deps`). No module reads `process.env`, calls `fetch`, or launches Playwright outside its adapter or `src/lib/config.ts`. This is what makes replay mode and tests possible.

# 5. Decide before you code
Before a new module, write 5 lines in `DECISIONS.md`: inputs, outputs, failure modes, which test proves each invariant, which exemplar you copy. No 5 lines, no code.

# 6. Tests pin design
Each module ships the invariant tests listed in its workflow. A test is never weakened to pass. If an invariant seems wrong, stop and write an ADR.

# 7. Banned moves
`any`, `as unknown as`, `// @ts-ignore`, catching an error to return `[]`, regex-parsing model prose, string-building SQL/URLs/selectors from model output, a second HTTP helper, a second event bus, a "utils" dumping file, files over 200 lines.

# 8. One change at a time
One module per commit; run `pnpm typecheck && pnpm test` after each file you add, not at the end.

# 9. When unsure
Pick the option with fewer moving parts and log one line. Do not ask the human unless a secret is missing.
