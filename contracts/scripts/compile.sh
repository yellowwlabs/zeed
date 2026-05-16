#!/usr/bin/env bash
# Compile Compact contracts using the `compact` CLI.
#
# Install compact CLI:
#   https://docs.midnight.network/develop/tutorial/1-setup
#   (download the binary for your OS and add it to PATH)
#
# Usage: ./scripts/compile.sh [contract_name]
#   contract_name: accreditation | founder_majority (omit to compile all)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTRACTS_DIR="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$CONTRACTS_DIR/src"
MANAGED_DIR="$SRC_DIR/managed"

compile_contract() {
  local name="$1"
  local src="$SRC_DIR/$name.compact"
  local out="$MANAGED_DIR/$name"

  if [ ! -f "$src" ]; then
    echo "ERROR: $src not found" >&2
    exit 1
  fi

  mkdir -p "$out"

  echo "Compiling $name.compact..."
  compact compile "$src" "$out"
  echo "  -> src/managed/$name/"
}

if ! command -v compact >/dev/null 2>&1; then
  echo "ERROR: 'compact' CLI not found on PATH." >&2
  echo "Install it from: https://docs.midnight.network/develop/tutorial/1-setup" >&2
  exit 1
fi

if [ "${1:-}" != "" ]; then
  compile_contract "$1"
else
  compile_contract accreditation
  compile_contract founder_majority
fi

echo ""
echo "Done. Compiled artifacts in contracts/src/managed/"
