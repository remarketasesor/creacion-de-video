#!/usr/bin/env python3
"""Paso 2: transcribe public/input/clean.mp4 con marcas de tiempo por palabra.

Genera:
  public/captions.json  -> [{"text","start","end"}] (lo usan los subtítulos)
  public/input/transcript.txt -> texto con tiempos por frase, para que Claude arme el plan

Uso: python3 scripts/transcribe.py [modelo=large-v3] [idioma=es]
"""
import json
import sys
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
model_name = sys.argv[1] if len(sys.argv) > 1 else "large-v3"
lang = sys.argv[2] if len(sys.argv) > 2 else "es"

model = WhisperModel(model_name, device="cpu", compute_type="int8")
segments, _ = model.transcribe(
    str(ROOT / "public/input/clean.mp4"),
    language=lang,
    word_timestamps=True,
    vad_filter=True,
    beam_size=5,
)

words, lines = [], []
for seg in segments:
    lines.append(f"[{seg.start:6.2f} - {seg.end:6.2f}] {seg.text.strip()}")
    for w in seg.words or []:
        text = w.word.strip()
        if text:
            words.append({"text": text, "start": round(w.start, 3), "end": round(w.end, 3)})

(ROOT / "public/captions.json").write_text(json.dumps(words, ensure_ascii=False, indent=1))
(ROOT / "public/input/transcript.txt").write_text("\n".join(lines) + "\n")
print("\n".join(lines))
print(f"✓ {len(words)} palabras")
