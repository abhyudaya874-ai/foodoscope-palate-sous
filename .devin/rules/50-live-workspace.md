---
trigger: glob
globs: "src/lib/workspace/**, src/components/workspace/**, workspace/**"
description: Live file workspace - streaming diffs, CSV/code changes shown Devin-style
---
# Goal
The judge watches files change **while the agent works**: a CSV gains rows, a shim file gains lines, a test flips red→green.

# Virtual workspace
- Real files under `workspace/`; server holds a `WorkspaceStore` (path → content, version).
- Agent writes only through tools: `fs.write(path, content)`, `fs.patch(path, unifiedDiff)`, `csv.upsert(path, rows)`. Every write emits `patch.proposed` (before apply) with `{path, before, after, diffStats}`.
- Writes outside `workspace/` are rejected with a `contract` error.

# Streaming protocol (SSE, `/api/run/:id/stream`)
Message types: `plan`, `reasoning.delta`, `text.delta`, `tool.start`, `tool.end`, `file.patch`, `test.result`, `budget`, `xp`, `confirm.request`, `done`. Each is `{seq, ts, type, data}`; client dedupes by `seq` and can resume from `Last-Event-ID`.

# Rendering (compose, don't invent)
| View | Built from |
|---|---|
| Files | File Tree; clicking opens Code Block (syntax highlight) |
| Diff | Two-column Code Block with add/remove line classes from `diff` lib output; header shows `+N −M` and file path |
| CSV | Data Table; changed cells get a highlight that fades after 1.5 s; new rows slide in; header shows `rows: before → after` |
| Terminal | Terminal element; ANSI stripped; shows the curl for every probe call |
| Tests | Test Results; red→green transition animates once |
| Checkpoint | Checkpoint before each `patch.applied`; "Restore" reverts the store to that version |
- Typewriter streaming for code: token chunks append, no full re-render; virtualize files over 500 lines.
- Every patch card has: Approve / Deny (Confirmation) only for sponsor-facing paths; others auto-apply with an Undo.

# Quality
- Idempotent apply: applying the same patch twice is a no-op.
- Atomic: write to temp then rename; never leave a half-written CSV.
- Unit tests: diff rendering, CSV upsert, path-scope guard, checkpoint restore.
