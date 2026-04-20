#!/usr/bin/env bash
# Regenerate the Kondukt CLI demo assets.
#
# For each named scenario under scripts/scenarios/<name>.sh this script
# produces three files:
#
#   assets/<name>.gif          — committed, embedded in the README
#   assets/local/<name>.cast   — local only (gitignored)
#   assets/local/<name>.mp4    — local only (gitignored)
#
# Usage:
#   scripts/record-demo.sh                  # record every scenario
#   scripts/record-demo.sh demo scaffold    # record a subset
#   scripts/record-demo.sh --upload demo    # also upload cast to asciinema.org
#
# Requires Homebrew; asciinema, agg, and ffmpeg are installed on demand.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

ASSETS_DIR="$REPO_ROOT/assets"
LOCAL_DIR="$ASSETS_DIR/local"
SCENARIOS_DIR="$SCRIPT_DIR/scenarios"

UPLOAD=0
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --upload) UPLOAD=1 ;;
    -h|--help)
      sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    --*)
      echo "Unknown flag: $arg" >&2; exit 2 ;;
    *)
      ARGS+=("$arg") ;;
  esac
done

log() { printf '\n\033[1;36m==>\033[0m %s\n' "$*"; }

# Resolve which scenarios to record.
SCENARIOS=()
if (( ${#ARGS[@]} )); then
  SCENARIOS=("${ARGS[@]}")
else
  for f in "$SCENARIOS_DIR"/*.sh; do
    name="$(basename "$f" .sh)"
    [[ "$name" == _* ]] && continue
    SCENARIOS+=("$name")
  done
fi

for name in "${SCENARIOS[@]}"; do
  if [[ ! -f "$SCENARIOS_DIR/$name.sh" ]]; then
    echo "error: unknown scenario '$name' (looked for $SCENARIOS_DIR/$name.sh)" >&2
    exit 1
  fi
done

# 1. Dependency check & install.
log "Checking dependencies"
MISSING=()
for dep in asciinema agg ffmpeg; do
  command -v "$dep" >/dev/null 2>&1 || MISSING+=("$dep")
done

if (( ${#MISSING[@]} )); then
  if ! command -v brew >/dev/null 2>&1; then
    echo "error: Homebrew not found and these tools are missing: ${MISSING[*]}" >&2
    exit 1
  fi
  log "Installing via Homebrew: ${MISSING[*]}"
  brew install "${MISSING[@]}"
fi

# 2. Build the CLI once, up front.
log "Building CLI (pnpm build)"
pnpm build

mkdir -p "$ASSETS_DIR" "$LOCAL_DIR"

render_gif() {
  local cast="$1" gif="$2" font_size="$3" fps_cap="${4:-}"
  local -a extra=()
  [[ -n "$fps_cap" ]] && extra+=(--fps-cap "$fps_cap")
  agg \
    --font-family "JetBrains Mono,Fira Code,Menlo,monospace" \
    --font-size "$font_size" \
    --theme monokai \
    --speed 1.2 \
    ${extra[@]+"${extra[@]}"} \
    "$cast" "$gif"
}

file_bytes() { stat -f%z "$1" 2>/dev/null || stat -c%s "$1"; }

human_size() {
  awk -v b="$(file_bytes "$1")" 'BEGIN {
    split("B KB MB GB", u); s=b; i=1;
    while (s >= 1024 && i < 4) { s/=1024; i++ }
    printf "%.2f %s", s, u[i]
  }'
}

over_5mb() { awk -v b="$(file_bytes "$1")" 'BEGIN { exit !(b > 5*1024*1024) }'; }

cast_duration() {
  awk 'NR>1 && /^\[/ {
    gsub(/^\[/, ""); split($0, a, ","); sum += a[1] + 0
  } END { printf "%.1f", sum }' "$1"
}

record_one() {
  local name="$1"
  local scenario="$SCENARIOS_DIR/$name.sh"
  local cast="$LOCAL_DIR/$name.cast"
  local gif="$ASSETS_DIR/$name.gif"
  local mp4="$LOCAL_DIR/$name.mp4"

  log "Scenario: $name"
  rm -f "$cast" "$gif" "$mp4"

  asciinema rec \
    --overwrite \
    --window-size 100x28 \
    --idle-time-limit 2 \
    --command "bash '$scenario'" \
    "$cast"

  render_gif "$cast" "$gif" 18
  if over_5mb "$gif"; then
    log "  GIF over 5 MB — re-rendering with font-size 16 and fps-cap 10"
    render_gif "$cast" "$gif" 16 10
  fi
  if over_5mb "$gif"; then
    echo "  warning: $(basename "$gif") still over 5 MB after fallback render." >&2
  fi

  ffmpeg -y -i "$gif" \
    -movflags faststart -pix_fmt yuv420p \
    -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
    "$mp4" \
    -loglevel error

  printf '  cast: %s  (%s)\n' "$cast" "$(human_size "$cast")"
  printf '  gif:  %s  (%s)\n' "$gif"  "$(human_size "$gif")"
  printf '  mp4:  %s  (%s)\n' "$mp4"  "$(human_size "$mp4")"
  printf '  duration: %ss\n' "$(cast_duration "$cast")"

  if (( UPLOAD )); then
    log "  Uploading $name cast"
    asciinema upload "$cast"
  fi
}

for name in "${SCENARIOS[@]}"; do
  record_one "$name"
done

log "Done"
printf '  Committed GIFs live in %s\n' "$ASSETS_DIR/"
printf '  Local-only cast/mp4 in  %s\n' "$LOCAL_DIR/"
