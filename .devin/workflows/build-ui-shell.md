---
description: Build the Perplexity x Devin UI shell - chat, thinking, tool cards, plan/queue, workspace tabs, model selector
---
# /build-ui-shell
**Context rules:** `20-ui-ai-elements.md`, `50-live-workspace.md`.

1. **Install** the needed AI Elements by reading each pattern page (`.md`) from https://ui.shadcn.com/docs/ai-elements and copying it: Chat/Message Scroller, Message, Reasoning, Chain of Thought, Tool, Task, Plan, Queue, Terminal, Test Results, File Tree, Subagent, Confirmation, Checkpoint, Sources, Inline Citation, Suggestion, Prompt Input, Model Selector, Context, Stack Trace, Code Block. Fix import paths; do not change behavior.
2. **Layout:** three Resizable panes per rule; top bar with Model Selector (model + thinking effort), Context bar, run status; footer Prompt Input + Suggestions; ⌘K Command palette.
3. **Event → UI mapper** `src/lib/ui/eventToView.ts` (pure, unit tested): `reasoning.delta`→Reasoning, `tool.*`→Tool card with model badge, latency, tokens; `plan`→Plan+Queue; `file.patch`→workspace tabs; `test.result`→Test Results; `confirm.request`→Confirmation.
4. **Answer card (Perplexity feel):** answer text, Sources row, Inline Citation for every API-derived claim (endpoint, record id, taste/aroma tag, confidence), "Related" Suggestions.
5. **States:** Skeleton/shimmer for pending, Stack Trace for errors with Retry, `REPLAY` badge when running from fixtures.
6. **Accessibility:** keyboard path for send/approve/deny, labels on icon buttons, reduced-motion respected.
7. **Tests:** mapper unit tests; one Playwright-free smoke test rendering the replay fixture.

**Verify:** run replay in the browser; Reasoning streams, tool cards appear with provider/model badges, right pane tabs update.
**Done when:** a first-time viewer can tell what the agent is thinking, doing, and changing without reading any docs.
