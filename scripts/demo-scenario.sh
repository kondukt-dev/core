#!/usr/bin/env bash
# Runs inside asciinema rec. Types the demo commands character-by-character
# and executes them against the local Kondukt build.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

kondukt() { node "$REPO_ROOT/dist/cli/index.js" "$@"; }

type_and_run() {
  local cmd="$1"
  printf '$ '
  local i
  for (( i=0; i<${#cmd}; i++ )); do
    printf '%s' "${cmd:$i:1}"
    sleep 0.04
  done
  printf '\n'
  eval "$cmd"
}

printf '\033[2J\033[H'
sleep 1

type_and_run 'kondukt test "npx -y @modelcontextprotocol/server-everything"'
sleep 2

type_and_run 'kondukt validate "npx -y @modelcontextprotocol/server-everything"'
sleep 3
