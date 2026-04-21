#!/usr/bin/env bash
# Reproducible beta zip: build MV3 extension then archive apps/extension/dist/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pnpm --filter @safesnack/extension build

DIST="$ROOT/apps/extension/dist"
if [[ ! -f "$DIST/manifest.json" ]]; then
  echo "error: missing $DIST/manifest.json — build failed?" >&2
  exit 1
fi

OUT="$ROOT/safesnack-beta-v0.1.0.zip"
rm -f "$OUT"
(cd "$DIST" && zip -rq "$OUT" .)
echo "Created $OUT"
