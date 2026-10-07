# Edición de videos verticales virales

Pipeline: video crudo → limpieza → transcripción → **plan de edición (lo escribe Claude)** → render con Remotion.

## Comandos

```bash
npm install && pip install faster-whisper auto-editor   # una vez
scripts/make-sfx.sh                                      # una vez: genera whoosh/pop
scripts/prepare.sh entrada/video.mp4                     # 1. quita silencios, 1080x1920, 30fps
python3 scripts/transcribe.py                            # 2. public/captions.json + public/input/transcript.txt
#                                                          3. Claude escribe public/plan.json
node scripts/render.mjs nombre                           # 4. out/nombre.mp4
```

Revisar un render: extraer cuadros con `ffmpeg -ss <seg> -i out/x.mp4 -frames:v 1 cuadro.png` y mirarlos.

## Cómo escribir `public/plan.json`

Formato en `src/types.ts`. Ejemplo en `ejemplos/plan-ejemplo.json`. Tiempos en segundos de
`public/input/clean.mp4`; `durationSec` sale de `public/input/meta.json`. Marcas en `public/brands/<id>.json`.

Reglas de ritmo viral:
- **Gancho (0–3 s):** `hook` con la promesa o la frase más fuerte, máx. 6 palabras. Zoom en el primer segundo.
- **Algo cambia cada 2–4 s:** alternar zoom, gráfico, emoji o b-roll. Nunca más de 4 s sin estímulo visual.
- **Zooms** (`scale` 1.15–1.35) sobre frases de énfasis; no encadenar dos seguidos.
- **keyword:** 1–4 palabras, la idea central de la frase, en el momento exacto en que se dice.
- **stat:** cada vez que se menciona un número, porcentaje o precio.
- **list:** cuando se enumeran pasos o beneficios; `end` cuando se termina de decir el último.
- **emoji:** refuerzo emocional (máx. 1 cada 5 s), alternar `x` izquierda/derecha.
- **highlightWords:** 5–15 palabras de valor (dinero, resultado, dolor, beneficio).
- **cta** en los últimos 2–3 s (seguir, comentar una palabra, guardar).
- Los gráficos no se enciman entre sí, salvo `emoji` sobre otro gráfico.
- Respetar las restricciones de cada cliente (p. ej. salud: nada de promesas de cura ni antes/después).
