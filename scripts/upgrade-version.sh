#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

METADATA="$ROOT_DIR/metadata.json"
PACKAGE="$ROOT_DIR/package.json"

usage() {
  echo "Usage: $0 -major | -minor | -patch"
  exit 1
}

[[ $# -ne 1 ]] && usage

BUMP="$1"
[[ "$BUMP" != "-major" && "$BUMP" != "-minor" && "$BUMP" != "-patch" ]] && usage

# Read current version from metadata.json (source of truth)
CURRENT=$(grep '"version"' "$METADATA" | sed 's/.*"version": *"\([^"]*\)".*/\1/')

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

case "$BUMP" in
  -major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  -minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  -patch) PATCH=$((PATCH + 1)) ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

# Update metadata.json
sed -i "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW_VERSION\"/" "$METADATA"

# Update package.json
sed -i "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE"

echo "$CURRENT → $NEW_VERSION"
