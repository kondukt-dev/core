# Shared helpers for demo scenarios. Sourced by each scenario under
# scripts/scenarios/, never executed directly.

set -euo pipefail

_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$_LIB_DIR/../.." && pwd)"

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

clear_screen() { printf '\033[2J\033[H'; }
