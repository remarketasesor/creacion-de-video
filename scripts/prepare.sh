#!/usr/bin/env bash
# Paso 1: limpia el video crudo.
#   - une varios clips en el orden indicado
#   - quita silencios y pausas largas (auto-editor)
#   - lo deja en vertical 1080x1920 a 30 fps (recorta al centro si viene horizontal)
#   - normaliza el volumen de la voz
# Uso: [MARGIN=0.15s] [THRESH=0.04] scripts/prepare.sh clip1.mp4 [clip2.mp4 ...]
set -euo pipefail
MARGIN="${MARGIN:-0.15s}"
THRESH="${THRESH:-0.04}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
OUT="$ROOT/public/input/clean.mp4"
VF="scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1"

echo "→ Normalizando ${#} clip(s) a 1080x1920 / 30 fps"
i=0
for f in "$@"; do
  ffmpeg -y -loglevel error -i "$f" -vf "$VF" -ar 48000 -ac 2 -c:v libx264 -preset fast -crf 16 -pix_fmt yuv420p -c:a aac -b:a 256k "$TMP/p$i.mp4"
  echo "file '$TMP/p$i.mp4'" >> "$TMP/list.txt"
  i=$((i + 1))
done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$TMP/list.txt" -c copy "$TMP/joined.mp4"

echo "→ Quitando silencios ($MARGIN, umbral $THRESH)"
auto-editor "$TMP/joined.mp4" --margin "$MARGIN" --edit "audio:threshold=$THRESH" --no-open --progress none -o "$TMP/cut.mp4"

echo "→ Audio normalizado"
ffmpeg -y -loglevel error -i "$TMP/cut.mp4" -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
ORIG=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/joined.mp4")
printf '{"durationSec": %s, "originalSec": %s}\n' "$DUR" "$ORIG" > "$ROOT/public/input/meta.json"
rm -rf "$TMP"
echo "✓ $OUT  (${ORIG}s → ${DUR}s)"
