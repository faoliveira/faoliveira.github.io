#!/usr/bin/env bash
set -euo pipefail

MAX_LINES=400
STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|svelte|astro)$' || true)

FAILED=0
for file in $STAGED; do
  # Ignora layouts (tendem a ser maiores por natureza)
  case "$file" in
    src/layouts/*) continue ;;
  esac

  lines=$(wc -l < "$file")
  if [ "$lines" -gt "$MAX_LINES" ]; then
    echo "❌ $file tem $lines linhas (máx: $MAX_LINES). Refatore antes de commitar."
    FAILED=1
  fi
done

if [ "$FAILED" -eq 1 ]; then
  exit 1
fi
