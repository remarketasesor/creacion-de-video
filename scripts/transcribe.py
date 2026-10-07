#!/usr/bin/env python3
"""Paso 2: transcribe public/input/clean.mp4 con marcas de tiempo por palabra.

Genera:
  public/captions.json  -> [{"text","start","end"}] (lo usan los subtítulos)
  public/input/transcript.txt -> texto con tiempos por frase, para que Claude arme el plan

Uso: python3 scripts/transcribe.py [modelo=large-v3] [idioma=es] ["vocabulario, nombres propios"]
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel


def load_audio(path):
    # Decodificamos con ffmpeg (evita incompatibilidades de versión de PyAV).
    raw = subprocess.run(
        ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


ROOT = Path(__file__).resolve().parent.parent
model_name = sys.argv[1] if len(sys.argv) > 1 else "large-v3"
lang = sys.argv[2] if len(sys.argv) > 2 else "es"
# Ayuda a escribir bien marcas y nombres (p. ej. "Claude" en vez de "Cloth").
prompt = sys.argv[3] if len(sys.argv) > 3 else "Claude, inteligencia artificial."

model = WhisperModel(model_name, device="cpu", compute_type="int8")
segments, _ = model.transcribe(
    load_audio(ROOT / "public/input/clean.mp4"),
    language=lang,
    word_timestamps=True,
    vad_filter=True,
    beam_size=5,
    initial_prompt=prompt,
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
