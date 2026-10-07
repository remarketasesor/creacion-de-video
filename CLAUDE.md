# Edición de videos verticales virales

Pipeline: video crudo → limpieza → transcripción → **plan de edición (lo escribe Claude)** → render con Remotion.

## Comandos

```bash
npm install && pip install faster-whisper auto-editor   # una vez
scripts/make-sfx.sh                                      # una vez: genera whoosh/pop
scripts/prepare.sh entrada/a.mp4 entrada/b.mp4           # 1. une clips en orden, quita silencios, 1080x1920, 30fps
python3 scripts/transcribe.py large-v3 es "Claude, nombres propios"  # 2. captions.json + transcript.txt
#                                                          3. Claude escribe public/plan.json
node scripts/render.mjs nombre                           # 4. out/nombre.mp4
```

Revisar un render: extraer cuadros con `ffmpeg -ss <seg> -i out/x.mp4 -frames:v 1 cuadro.png` y mirarlos.

## Cómo escribir `public/plan.json`

Formato en `src/types.ts`. Ejemplos en `ejemplos/` (`plan-piloto-claude.json` es un video real). Tiempos en segundos de
`public/input/clean.mp4`; `durationSec` sale de `public/input/meta.json`. Marcas en `public/brands/<id>.json`.

Reglas de ritmo viral:
- **Gancho (0–3 s):** `hook` con la promesa o la frase más fuerte, máx. 6 palabras. Zoom en el primer segundo.
- **Algo cambia cada 2–4 s:** alternar zoom, gráfico, emoji o b-roll. Nunca más de 4 s sin estímulo visual.
- **Zooms** (`scale` 1.15–1.35) sobre frases de énfasis; no encadenar dos seguidos.
- **keyword:** 1–4 palabras, la idea central de la frase, en el momento exacto en que se dice.
- **stat:** cada vez que se menciona un número, porcentaje o precio.
- **list:** cuando se enumeran pasos o beneficios; `end` cuando se termina de decir el último.
- **vs:** enfrentamientos o dilemas ("IA vs editores", "real vs fake"), 1–2 palabras por lado.
- **emoji:** refuerzo emocional (máx. 1 cada 5 s), alternar `x` izquierda/derecha.
- **highlightWords:** 5–15 palabras de valor (dinero, resultado, dolor, beneficio).
- **cta** en los últimos 2–3 s (seguir, comentar una palabra, guardar).
- Los gráficos no se enciman entre sí, salvo `emoji` sobre otro gráfico.
- Respetar las restricciones de cada cliente (p. ej. salud: nada de promesas de cura ni antes/después).

## Notas del entorno en la nube

- Google Drive: `gdown` sirve para listar la carpeta, pero descarga los archivos con
  `curl -L "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"`
  (`*.googleusercontent.com` no está permitido).
- Si el orden de los clips importa, el gancho suele ser la toma más corta y polémica: ponla primero.

## Cuenta personal de Luis (@luisinanaya)

- Estrategia (nicho, pilares, metas, reglas): `estrategia/plan-monetizacion-resumen.md`.
- Guiones y calendario oct–dic 2026: `estrategia/guiones-oct-dic-2026.md`. Cada guion tiene un ID (G1-01, R-01…);
  las tomas llegan a Drive como `crudos/AAAA-MM-DD/<ID>.mp4` y sus "Notas de edición" se traducen a `public/plan.json`.
- Reglas al escribir o editar para su cuenta: nada de datos identificables de clientes, nada de presentarse como
  experto COFEPRIS, cifras no verificadas van entre [corchetes], los videos que venden REMARKET IA llevan "Tu marca",
  y nunca "editado 100% por IA / ningún humano".
- Para @remarketmx no se resube el mismo archivo: se repostea o se hace una versión distinta.
