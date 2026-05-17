#!/usr/bin/env bash
# Copy compiled ZK artifacts (keys + zkir) to frontend/public/contracts/
# Run after `compact` to make artifacts available as static assets.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTRACTS_DIR="$(dirname "$SCRIPT_DIR")"
MANAGED_DIR="$CONTRACTS_DIR/src/managed"
DEST_DIR="$CONTRACTS_DIR/../frontend/public/contracts"

copy_contract() {
  local name="$1"
  local src="$MANAGED_DIR/$name"

  if [ ! -d "$src" ]; then
    echo "ERROR: $src not found — run 'npm run compact' first" >&2
    exit 1
  fi

  local dest="$DEST_DIR/$name"
  mkdir -p "$dest/keys" "$dest/zkir"

  cp "$src/keys/"* "$dest/keys/"
  cp "$src/zkir/"* "$dest/zkir/"

  echo "  -> frontend/public/contracts/$name/"
}

echo "Copying ZK artifacts to frontend/public/contracts/..."
copy_contract accreditation
copy_contract founder_majority
echo "Done."
