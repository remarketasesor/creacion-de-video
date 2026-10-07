#!/usr/bin/env bash
# Paso 1: limpia el video crudo.
#   - quita silencios y pausas largas (auto-editor)
#   - lo deja en vertical 1080x1920 a 30 fps (recorta al centro si viene horizontal)
#   - normaliza el volumen de la voz
# Uso: scripts/prepare.sh entrada/mi-video.mp4 [margen_silencio=0.15s] [umbral=0.04]
set -euo pipefail
IN="$1"
MARGIN="${2:-0.15s}"
THRESH="${3:-0.04}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
OUT="$ROOT/public/input/clean.mp4"

echo "→ Quitando silencios ($MARGIN, umbral $THRESH)"
auto-editor "$IN" --margin "$MARGIN" --edit "audio:threshold=$THRESH" --no-open --progress none -o "$TMP/cut.mp4"

echo "→ Formato vertical 1080x1920, 30 fps, audio normalizado"
ffmpeg -y -loglevel error -i "$TMP/cut.mp4" \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1" \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
ORIG=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
printf '{"durationSec": %s, "originalSec": %s}\n' "$DUR" "$ORIG" > "$ROOT/public/input/meta.json"
rm -rf "$TMP"
echo "✓ $OUT  (${ORIG}s → ${DUR}s)"
