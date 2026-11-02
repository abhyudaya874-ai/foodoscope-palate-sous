# Design Spec — Palate + Sous v2

## 1. Tokens (`src/app/globals.css`, CSS vars + `@theme inline`)

- **Neutrals (warm near-black ramp, 6 steps):** `--bg-0 #0c0d0c` (app), `--bg-1 #141614` (panels), `--bg-2 #1b1e1b` (cards), `--line-1 #262a26` (borders), `--text-1 #e8eae6` (primary), `--text-2 #9ba39a` (secondary), `--text-3 #6b736b` (muted).
- **Accent:** emerald `--accent #34d399` (+ `--accent-dim` 12% tint bg). **Warning:** amber `#fbbf24`. **Danger:** red `#f87171`.
- **Radius:** 6 (sm) / 10 (md) / 16 (lg). **Elevation:** 1px borders + inset highlight `inset 0 1px 0 rgba(255,255,255,.03)`; no heavy shadows.
- **Type:** Geist Sans UI; Geist Mono for code/IDs/endpoints; tabular numerals (`font-variant-numeric: tabular-nums`) on all counters. Scale: 11/12/13/15/18/28.
- **Spacing:** 4/8 grid (Tailwind default). Zero magic hex in components — tokens only.

## 2. Component inventory

| Surface | Action |
|---|---|
| Chat, Message, Reasoning, Task, Tool, Plan, Queue, Sources, Inline Citation, Prompt Input, Model Selector, Suggestion, Chain of Thought, Context, File Tree, Terminal, Test Results, Stack Trace, Confirmation, Checkpoint, Subagent, Code Block | Copy official shadcn AI Elements from ui.shadcn.com/docs/ai-elements/base/<name>.md into `src/components/ai-elements/`; restyle via tokens only |
| `adapters.ts` | NEW thin mapper: existing events → element props (no agent-loop changes) |
| Hero, TopBar, RailCard, RightPane shell, EmptyState | NEW presentation components under `src/components/shell/` |
| ProfileCard/StreakBorder | Keep logic; restyle with tokens; fix rank-below-name layout |

## 3. Layout grids

- **1440/1920:** `rail 240px | center flex | right 400px`; right pane collapsible; center max-w-3xl content column.
- **1024:** right pane overlays as drawer (toggle), rail stays.
- **390:** rail → top sheet (avatar row); right pane → bottom drawer with tab strip; composer sticky above keyboard (`pb-[env(safe-area-inset-bottom)]`).

## 4. State matrix (idle / loading / streaming / success / empty / error / disabled)

| Component | idle | streaming | empty | error |
|---|---|---|---|---|
| Hero | logo+headline+composer+4 chips+replay | hidden (chat takes over) | — | — |
| Steps list | collapsed "Steps · N · Xs" | auto-expanded, live pulse on running row | not rendered | row shows red + Stack Trace |
| Sources chip | "N sources" | counts up | "No sources yet" | — |
| Plan tab | step cards pending | running row animated | "Plan appears when a run starts — try ▶ Watch a replay" | failed row red |
| Files/Diff/CSV | — | live | "Files Sous changes appear here (e.g. workspace/data/crosswalk.csv)" | — |
| Terminal | — | curl lines stream | "Probe commands appear here" | — |
| Tests | — | red→green | "Contract tests appear here" | — |
| Composer | enabled | stop button, disabled send | — | inline error text |

## 5. Key screens (ASCII)

```
IDLE (1440)                          RUN (center column)
┌──────┬───────────────────┬──────┐  ┌────────────────────────┐
│ rail │      (void)       │ right│  │ ▸ Steps · 7 · 4.2s     │
│ card │   ◆ logo mark     │ Plan │  │   ✓ probe recipeByTitle│
│ XP   │ What should Sous  │ Files│  │     groq/qwen3.8 210ms │
│ queue│   cook up?        │ Diff │  │ ✓ crosswalk 9→13/30    │
│      │ ┌───────────────┐ │ CSV  │  │ Answer …[1][2]         │
│      │ │ composer      │ │ Term │  │ [1][2] Sources · 6     │
│      │ └───────────────┘ │ Tests│  └────────────────────────┘
│      │ (chip)(chip)      │ Prof │
│      │ (chip)(chip) ▶Replay    │
└──────┴───────────────────┴──────┘
```

## 6. Decisions taken without asking
- Profile tab moved into left rail (dedupe); right pane = Plan / Changes(Files·Diff·CSV) / Terminal / Tests.
- Provider picker = labelled dropdown w/ health dot fed by gateway-reported provider only; when none: "Provider · not connected" + hint to add keys, never raw "no-provider".
- axe/Lighthouse run only if time remains after gates; noted in CHANGELOG otherwise.
