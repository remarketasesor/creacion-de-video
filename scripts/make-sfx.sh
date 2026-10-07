#!/usr/bin/env bash
# Genera efectos de sonido básicos (sin descargas). Reemplázalos por tus propios .wav si quieres.
set -euo pipefail
D="$(cd "$(dirname "$0")/.." && pwd)/public/sfx"
mkdir -p "$D"
# whoosh: ruido rosa filtrado con barrido de volumen
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=color=pink:duration=0.45:amplitude=0.9" \
  -af "highpass=f=400,lowpass=f=5000,afade=t=in:d=0.18,afade=t=out:st=0.2:d=0.25,volume=1.6" -ar 48000 "$D/whoosh.wav"
# pop: tono corto que cae de tono
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='sin(2*PI*(900-1400*t)*t)*exp(-28*t)':s=48000:d=0.18" "$D/pop.wav"
echo "✓ sfx en $D"
