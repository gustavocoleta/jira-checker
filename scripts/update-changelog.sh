#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

CHANGELOG="$ROOT_DIR/CHANGELOG.md"

usage() {
  echo "Usage: $0 <new-version>"
  exit 1
}

[[ $# -ne 1 ]] && usage

NEW_VERSION="$1"
DATE=$(date +%Y-%m-%d)
LAST_TAG=$(git -C "$ROOT_DIR" describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -n "$LAST_TAG" ]; then
  COMMITS=$(git -C "$ROOT_DIR" log "${LAST_TAG}..HEAD" --pretty=format:'- %s (%h)' --no-merges)
else
  COMMITS=$(git -C "$ROOT_DIR" log --pretty=format:'- %s (%h)' --no-merges)
fi
[ -z "$COMMITS" ] && COMMITS="- No notable changes"

LINE=$(grep -n '^## \[' "$CHANGELOG" | head -1 | cut -d: -f1)
if [ -z "$LINE" ]; then
  LINE=$(($(wc -l < "$CHANGELOG") + 1))
fi

head -n $((LINE - 1)) "$CHANGELOG" > "$CHANGELOG.new"
{
  echo "## [$NEW_VERSION] - $DATE"
  echo ""
  echo "$COMMITS"
  echo ""
} >> "$CHANGELOG.new"
tail -n +"$LINE" "$CHANGELOG" >> "$CHANGELOG.new"
mv "$CHANGELOG.new" "$CHANGELOG"

echo "CHANGELOG.md updated for $NEW_VERSION"
