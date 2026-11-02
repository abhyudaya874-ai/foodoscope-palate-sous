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

## Round 2 (Perplexity + Devin pass)
| Request | Change | Proof |
|---|---|---|
| Run finished instantly | Replay paced per event type (`MIN` table in `runs.ts`): ~45 s for the same recorded run; reasoning narration types in (typewriter) | after/03-tools.png |
| Real thinking streaming | `POST /api/think` streams real token-by-token reasoning from a free-tier provider (groq `gpt-oss-120b`); shown as "Thought · groq/gpt-oss-120b · live · 7.3s", then the recorded tool run follows | after/03-tools.png |
| Tool calls visible | Steps card is open while working (spinner row, plan cards pending → running → done), collapses to "Steps · N · Xs" when finished | after/03, 07 |
| "5 passed · 0 failed" / zeros | Tests grouped as before → after (3 passed·2 failed → 5 passed·0 failed, red→green bar) inline in chat + Tests tab. Diff `+0 −0` replaced: real `+21 −0` for the new report; idempotent re-writes labelled "re-verified · N lines · no change"; duplicate bug-h2.md rows merged | after/10-changes.png |
| Tests in a suitable place | Inline Test Results card in the thread + dedicated Tests tab | after/04, 07 |
| Comet-style agentic browser | Browser tab: window chrome + URL bar, REAL page screenshots and element bounding boxes captured by `scripts/browser-capture.ts` from the recorded decisions; animated cursor, click ripple, extract highlight, typed thought, REPLAY label; auto-follows when the run finishes | after/05, 06, 07 |
| Sources popover scrolled the page | Height-bounded, internal scroll (`overscroll-contain`), provider filters (ALL/API/TAVILY/EXA/BROWSER/VERIFY), host + link per row | after/08-sources.png |
| Right pane auto-follow | Tab follows the live step (Plan → Terminal → Changes → Tests → Browser); clicking pins, "follow live" resumes | after/03-06 |
| Gross layout | Perplexity-style thread: goal title → Steps → test card → answer with inline [n] → sources chip → Related; Devin-style live right pane | after/07-finished.png |

Notes: replay auto-approvals are labelled ("Auto-approved in replay"). No LLM text is fabricated: the live thought is the model's own stream; the plan narration is labelled "Sous narration · replay".

## Round 3 (match Perplexity + Devin references)
- Perplexity: left nav (logo, New, Replay/Browser/Reports/Sources, Pinned/Projects/Recents, collapsible, profile + XP at the bottom); hero with one large rounded composer (Probe | Browser pills, model label, round send) and quiet arrow-prefixed goal list; thread with Answer / Links tabs, serif answer streamed word-by-word, "Searched the web — N receipts" step with real hosts, hover-card citations (provider chip, host, snippet, confidence), Related list.
- Devin: Command card (`$ GET … → 200` lines), inline diff cards in the thread (`+21 −0`, "re-verified · no change"), test results card, subagent card, live right pane with auto-follow.
- Motion: staggered slide-in rows, word fade/de-blur answer, pop-in citation chips, hover-scale chips, focus-glow composer, tab underline transition, sources popover scale/fade, reduced-motion respected.
- Evidence: docs/ui/after/01-idle.png, 07-finished.png, 08-sources.png.

## Round 4 — real human approval gate
- Replay no longer auto-approves: the stream is held behind a gate (`useRunStream`) at every `confirm.request`; Sous stays paused until Approve / Deny. "Auto-approve rest of replay" is an explicit, visible checkbox.
- Pending = warning action card (path chip, "Sous is paused. Nothing is written until you decide."); decided = slim receipt row ("Approved by you · receipt logged" / "Denied · nothing written" / "Auto-approved (replay)"). Denied paths are removed from the Changes tab.
- Evidence: docs/ui/after/11-approval-pending.png, 12-approved-resumed.png, 13-after-both.png.
