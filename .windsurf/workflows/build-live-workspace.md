---
description: Build the file workspace store, patch tools, SSE stream, and the Diff/CSV/Files/Terminal/Tests views
---
# /build-live-workspace
**Context rules:** `50-live-workspace.md`, `20-ui-ai-elements.md`.

1. **Store:** `WorkspaceStore` with path-scope guard, versions, atomic writes, `fs.write/patch`, `csv.upsert`, checkpoint/restore. Emit `patch.proposed` / `patch.applied` events.
2. **Stream:** `/api/run/[id]/stream` SSE with the message types and `seq` resume from `50-live-workspace.md`.
3. **Views** (fetch each AI Elements pattern `.md` first, copy to `src/components/ai-elements/`): `FileTreePane`, `DiffPane` (Code Block + `diff` output), `CsvPane` (Data Table + changed-cell highlight + `rows: before → after`), `TerminalPane`, `TestsPane`.
4. **Fixture run:** `fixtures/demo-run.jsonl` hand-recorded from a real tiny run (not invented stats); a dev page `/dev/workspace` replays it with a speed slider.
5. **Tests:** path guard rejects `../`, idempotent patch apply, CSV upsert, checkpoint restore, SSE resume.

**Verify:** open `/dev/workspace`, press play: a CSV gains rows, a shim file streams in, a test flips red→green.
**Done when:** all three changes are visible live and Undo restores the previous version.
