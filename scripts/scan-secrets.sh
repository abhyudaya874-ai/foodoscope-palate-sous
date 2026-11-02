#!/usr/bin/env bash
# Fails if likely secrets are present in tracked/working files.
# .env.local / .env are the designated (gitignored) secret stores -> excluded.
set -euo pipefail
pat='(gsk_[A-Za-z0-9]{20,}|nvapi-[A-Za-z0-9_-]{20,}|sk-or-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)'
if grep -RInE --exclude-dir={node_modules,.git,.next} --exclude='.env*' "$pat" . ; then
  echo "Possible secret found. Remove and rotate it." >&2; exit 1
fi
echo "scan-secrets: clean"
