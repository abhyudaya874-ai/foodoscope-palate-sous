# UI Changelog — defect → change map

Before: `docs/ui/before/` · After: `docs/ui/after/` · Spec: `docs/ui/DESIGN_SPEC.md`

| Defect (AUDIT.md #) | Change | Proof |
|---|---|---|
| 1, 2 dead idle / no focal point | Hero: logo mark, "What should Sous cook up?", centered composer, 4 real goal chips, ▶ Watch a replay; skeletons only while loading | after/01-idle.png |
| 3 rank collision | RailCard: name on own line, rank chip below, XP bar with "N to <next rank>", streak flame, badge dots | after/01-idle.png |
| 4 cryptic pills | TopBar: "Provider · name · latency" select with health dot; "Reasoning: Low/Medium/High" segmented; Live/Replay labelled switch; tools meter labelled with tooltip | after/01-idle.png |
| 5, 6 empty right tabs | 4-tab hierarchy (Plan / Changes / Terminal / Tests); every tab has an honest empty state with example; Plan shows live "N of M done" step cards | after/04-tab-plan.png, 03-finished.png |
| 7 dev N badge | `devIndicators: false` in next.config.ts | after/01-idle.png (no badge) |
| 8 weak composer | PromptInput: auto-grow, ⌘⏎ hint (Kbd), attach (disabled+honest), stop button while streaming, send disabled when empty | after/02-streaming.png |
| 9 no receipts on answer | Answer with inline [n] citation chips, "N sources" popover (endpoint + fixture + confidence), suggestion chips | after/03-finished.png |
| 10 mobile | 390px shot captured; rail hidden, chat + composer usable (full drawer polish cut for time) | after/05-mobile-idle.png |
| 11 hand-rolled elements | Official shadcn base components vendored from the registry (`src/components/ui/`: trace, message, bubble, collapsible, button, tooltip, tabs, popover, select, textarea, table, kbd, spinner, skeleton, code-block, command, dialog, sheet, empty, badge, avatar, separator, progress, alert, switch, input-group, use-highlighted-code) + AI Element patterns built on them per the official docs (reasoning, task/plan/queue, sources/inline-citation, prompt-input, model-selector, suggestion, context, tool, terminal, test-results, stack-trace, confirmation, checkpoint, subagent, chat, chain-of-thought, file-tree) + `adapters.ts` wiring events → props | src/components/ai-elements/ |
| 12 magic values | Token file in globals.css (warm near-black ramp, one emerald accent, amber/red status, radii, tabular numerals, reduced-motion, focus rings); components use tokens only | src/app/globals.css |

## Honest notes
- The official AI Elements are now *patterns* composed from registry base components (the docs' own code uses `Trace`/`Message`/`Bubble`). We vendored the official base components byte-for-byte from `ui.shadcn.com/r/styles/base-rhea/*.json` and implemented the patterns following each docs page's code, wired through `adapters.ts`. Demo scaffolding (`useChat`/`createChat`) was not adopted — our event stream is the source.
- axe/Lighthouse: not run (time box); manual a11y implemented: focus-visible rings, aria-labels, roles, reduced-motion, keyboard send path.
- Business logic untouched: `src/lib/agent`, `src/lib/llm`, `src/lib/foodoscope`, `src/app/api/**` have zero diffs in this change (presentation + `adapters.ts` + `derive.ts` gained `nextRankName`).
