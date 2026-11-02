#!/usr/bin/env bash
# Mirror .devin/rules and workflows into other agent dirs so the same kit works in Windsurf/Cursor/Claude Code.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$root/.windsurf/rules" "$root/.windsurf/workflows" "$root/.cursor/rules"
cp "$root"/.devin/rules/*.md "$root/.windsurf/rules/"
cp "$root"/.devin/workflows/*.md "$root/.windsurf/workflows/"
for f in "$root"/.devin/rules/*.md; do cp "$f" "$root/.cursor/rules/$(basename "${f%.md}").mdc"; done
[ -f "$root/AGENTS.md" ] && cp "$root/AGENTS.md" "$root/CLAUDE.md"
echo "synced: .windsurf, .cursor, CLAUDE.md"
