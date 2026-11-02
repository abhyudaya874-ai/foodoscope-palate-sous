---
trigger: glob
globs: "src/**/*.tsx, src/**/*.css"
description: UI rules - shadcn AI Elements, Perplexity x Devin look and feel
---
# Source of truth
Use only patterns that exist at https://ui.shadcn.com/docs/ai-elements. Fetch a pattern via its `.md` URL, e.g. `https://ui.shadcn.com/docs/ai-elements/base/reasoning.md`, and copy it to `src/components/ai-elements/`. Base components: `pnpm dlx shadcn@latest add <name>`. Never invent props; read the pattern page first.

# Pattern map
| Need | Use |
|---|---|
| Thread | Chat + Message Scroller, Message |
| LLM thinking, live | Reasoning (streams); Chain of Thought (summary that expands into steps) |
| Each tool call | Tool; failures go to Stack Trace |
| Agent steps | Task (steps share the Trace shape) |
| Plan and progress | Plan, Queue (left / done) |
| Probe and shell output | Terminal |
| Test runs | Test Results |
| Changed files | File Tree |
| Parallel workers | Subagent |
| Human gate and rollback | Confirmation, Checkpoint |
| Perplexity answer feel | Sources, Inline Citation (hover card), Suggestion chips |
| Input | Prompt Input (+ Attachment) |
| Model and effort | Model Selector (two menus: model, thinking effort) |
| Budget | Context (tokens used) + Progress for the API token wallet |
| Active state | `shimmer` util; `scroll-fade` on long panes |

AI Elements has **no diff or CSV viewer**. Compose it from Code Block, Table / Data Table and Tabs (see `50-live-workspace.md`).

# Layout (desktop first, 1280 px min)
Three Resizable panes. Left: Sidebar (runs, mini profile card, rank). Center: answer-first Chat. Right: Workspace tabs `Plan · Files · Diff · CSV · Terminal · Tests · Profile`. Top bar: Model Selector, Context, run status. Footer: Prompt Input + Suggestions. Mobile: Tabs instead of Resizable.

# Look and feel
- **Perplexity:** answer first; a Sources row under every answer; Inline Citation on every claim derived from API data (endpoint, record id, taste/aroma tag, confidence); "Related" Suggestions.
- **Devin:** the right pane updates live while the agent works; every step shows a model badge (provider/model), latency and tokens.
- One accent colour plus neutrals; dark mode default; gradients only on the profile banner and streak border.
- Every async state has Skeleton / Spinner / shimmer; every error has Stack Trace or Alert with Retry.
- Respect `prefers-reduced-motion`. Keyboard: ⌘K Command, ⌘Enter send (show Kbd hints). Icon buttons have accessible names; contrast AA.
