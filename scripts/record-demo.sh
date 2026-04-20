#!/usr/bin/env bash
# Regenerate assets/demo.{cast,gif,mp4} from scratch.
# One-command, idempotent. Requires Homebrew.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

ASSETS_DIR="$REPO_ROOT/assets"
CAST="$ASSETS_DIR/demo.cast"
GIF="$ASSETS_DIR/demo.gif"
MP4="$ASSETS_DIR/demo.mp4"

UPLOAD=0
for arg in "$@"; do
  case "$arg" in
    --upload) UPLOAD=1 ;;
    -h|--help)
      cat <<EOF
Usage: scripts/record-demo.sh [--upload]

Regenerates assets/demo.cast, demo.gif, demo.mp4 from scratch.
Requires Homebrew; asciinema, agg, and ffmpeg are installed on demand.

  --upload   After recording, run \`asciinema upload assets/demo.cast\`
             and print the public URL.
EOF
      exit 0 ;;
    *)
      echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

log() { printf '\n\033[1;36m==>\033[0m %s\n' "$*"; }

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

log "Wiping previous assets"
mkdir -p "$ASSETS_DIR"
rm -f "$CAST" "$GIF" "$MP4"

log "Building CLI (pnpm build)"
pnpm build

log "Recording cast"
asciinema rec \
  --overwrite \
  --window-size 100x28 \
  --idle-time-limit 2 \
  --command "bash '$SCRIPT_DIR/demo-scenario.sh'" \
  "$CAST"

render_gif() {
  local font_size="$1"
  local fps_cap="${2:-}"
  local -a extra=()
  [[ -n "$fps_cap" ]] && extra+=(--fps-cap "$fps_cap")
  agg \
    --font-family "JetBrains Mono,Fira Code,Menlo,monospace" \
    --font-size "$font_size" \
    --theme monokai \
    --speed 1.2 \
    ${extra[@]+"${extra[@]}"} \
    "$CAST" "$GIF"
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

log "Rendering GIF (agg)"
render_gif 18

if over_5mb "$GIF"; then
  log "GIF over 5 MB — re-rendering with font-size 16 and fps-cap 10"
  render_gif 16 10
fi

if over_5mb "$GIF"; then
  echo "warning: GIF still over 5 MB after fallback render. Consider reducing cols/rows in the recorder." >&2
fi

log "Rendering MP4 (ffmpeg)"
ffmpeg -y -i "$GIF" \
  -movflags faststart -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  "$MP4" \
  -loglevel error

duration="$(awk 'NR>1 && /^\[/ { gsub(/^\[/, ""); split($0, a, ","); sum += a[1] + 0 } END { printf "%.1f", sum }' "$CAST")"

log "Done"
printf '  cast: %s  (%s)\n' "$CAST" "$(human_size "$CAST")"
printf '  gif:  %s  (%s)\n' "$GIF"  "$(human_size "$GIF")"
printf '  mp4:  %s  (%s)\n' "$MP4"  "$(human_size "$MP4")"
printf '  duration: %ss\n' "${duration:-?}"
printf '\nREADME snippet:\n'
printf '  ![Kondukt demo](./assets/demo.gif)\n'

if (( UPLOAD )); then
  log "Uploading cast to asciinema.org"
  asciinema upload "$CAST"
fi
