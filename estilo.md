# estilo.md: estilo de edición de referencia

Fuente: video de referencia (46.8 s, 576x1024, 30 fps; 42.3 s de contenido y 4.5 s de cierre de la app).
Medido con ffmpeg: 2 fotogramas por segundo, detección de cambios de plano (umbral 0.3), audio y transcripción con Whisper.
Medidas convertidas a nuestro lienzo de 1080x1920 (factor ×1.875).
Lo que no se puede medir directo va marcado con [SUPOSICIÓN].

## 1. Ritmo y estructura
- Habla: **4.75 palabras/s**. Pausas máximas entre palabras de **0.20 s**: los silencios se recortan a ≤ 0.2 s.
- Se alternan **toma a cámara (A)** y **pantalla de gráfico a pantalla completa (G)**, unos 19 bloques en 42 s.
  - **Duración media del bloque: 2.2 s** (rango 0.5–4.5 s).
  - Reparto: G ≈ 55 % del tiempo, A ≈ 45 %.
- Secuencia medida (s):
  - 0–2.5 G
  - 2.5–3 A enmarcada dentro de una tarjeta
  - 3–5.5 A
  - 5.5–7 G
  - 7–8.5 A
  - 8.5–10.5 G
  - 10.5–12.5 A
  - 12.5–19.5 G (en varias pantallas)
  - 20–23.5 G
  - 23.5–24 A
  - 24–27 G
  - 27–29.5 A
  - 29.5–32 G
  - 32–34.5 A
  - 34.5–37.5 G
  - 37.5–39 A
  - 39–42 G
  - 42–42.5 A ("De nada.")
- **Gancho, 0–3 s:** empieza directamente en G con la frase dicha. El primer A llega en el segundo 2.5, dentro de una tarjeta que crece (transición "tarjeta → pantalla completa").
- **Cierre:** frase corta de 2 palabras a cámara ("De nada."), sin llamado a seguir.

## 2. Subtítulos
- **Estructura de bloque:** una línea de contexto pequeña y, debajo, la **palabra clave en grande**.
  - A veces lleva una tercera línea pequeña debajo ("de la carrera de", "con IA").
- **Palabras por bloque:** 2–5 en la línea pequeña y **1** en la grande.
  - Cambia de bloque cada 0.6–1.2 s.
  - Las palabras aparecen **una a una**, al ritmo de la voz.
- **Tamaños (1080x1920):**
  - Línea pequeña: ~52 px, peso 600.
  - Palabra grande: ~120 px, peso 800–900, interletrado −2 %.
- **Fuente:** sans geométrica con "a" de un solo piso [SUPOSICIÓN: tipo Urbanist/Google Sans; usamos **Urbanist**].
- **Color:**
  - Sobre gráfico (fondo claro): pequeña **#1F2430** y grande **#0052FA**.
  - Sobre toma a cámara: ambas **#FFFFFF**, con sombra suave (0 4px 24px rgba(0,0,0,.35)) y sin contorno.
- **Posición:**
  - En A: línea pequeña al **8.5 %** de la altura (y≈163 px) y palabra grande al **12.5–17 %** (y≈240–326 px), arriba sobre la frente.
  - En G: debajo del gráfico, al **51–56 %** de la altura.
  - Siempre centrado horizontalmente.
- **Animación:**
  - Entrada por palabra: **desenfoque 8 px → 0 + opacidad 0 → 1 en ~6 fotogramas (0.2 s)**.
  - Salida: desenfoque y desvanecido en ~0.2 s.
  - Sin escalado ni rebote.
- **Palabra destacada:** el sustantivo o verbo clave de la frase ("editado", "primero", "creador", "referencia", "pegar", "textos", "branding", "replicar"). Va en la línea grande. **No hay** resaltado de "palabra activa" estilo karaoke.

## 3. Textos y gráficos en pantalla (G)
- **Fondo de G:** blanco lila **#FBFAFD** con degradado azul suave en las esquinas (#D2DFFD → #DEE6FA), radial y difuso.
- **Tarjetas de interfaz** (mockups de UI): fondo #FFFFFF, radio ~28 px, sombra amplia y suave (0 20px 60px rgba(30,60,140,.12)). Ocupan ~55–65 % del ancho y están centradas en el 20–50 % superior.
- **Etiqueta tipo "chip"** sobre la tarjeta: fondo #111111, texto blanco en monoespaciada, MAYÚSCULAS, ~26 px ("VÍDEO 1 · EDITADO CON IA"), radio total.
- **Elementos usados:**
  - teléfono con capturas de pantalla;
  - checklist con casillas azules (#0052FA) que se marcan una a una;
  - línea de tiempo de fotogramas (tira de película);
  - muestras de color y tipografía ("Aa");
  - terminal oscura con comando escrito letra a letra;
  - diagrama de nodos (archivo → 3 videos) con líneas punteadas;
  - nombre de archivo en monoespaciada ("referencia.mp4").
- **Animación de G:**
  - los elementos entran con desenfoque y opacidad, deslizando 20–40 px hacia arriba, en 0.3 s, escalonados cada ~0.15 s;
  - las casillas se marcan al ritmo de la palabra dicha;
  - la terminal se escribe letra a letra (~25 caracteres/s).
- Marca de agua de la plataforma a la derecha: no se replica.

## 4. B-roll
- No hay b-roll de stock. Todo el apoyo visual son **mockups de interfaz** (capturas de apps, prompt, terminal) dentro de tarjetas.
- [SUPOSICIÓN] Las capturas son reales del proceso. Para nuestros videos usaremos capturas reales que dé Luis o mockups generados.

## 5. Transiciones
- **A ↔ G:** corte seco más desenfoque de entrada de los elementos de G (~0.2 s). No hay barridos ni destellos blancos.
- **Tarjeta → pantalla completa:** la toma A aparece dentro de una tarjeta redondeada (~80 % de ancho) y luego pasa a pantalla completa en ~0.3 s (seg. 2.5–3).
- **G → G:** los elementos se reemplazan con un fundido con desenfoque; el fondo se mantiene.

## 6. Zooms
- En A: zoom lento continuo del **100 % al ~106 %** por toma [SUPOSICIÓN: se infiere del encuadre que cambia de una toma a otra].
- Sin "punch-in" bruscos.
- Encuadre: rostro en el **35–55 %** de la altura, para dejar libre el 8–17 % superior para el subtítulo.

## 7. Color
- Toma A: natural, cálida y ligeramente desaturada. Sin LUT evidente [SUPOSICIÓN: contraste +5 %].
- Paleta G: blanco #FBFAFD, azul #0052FA, negro #111111, gris texto #1F2430, azul suave #D2DFFD.

## 8. Sonido
- Loudness integrada: **−15.4 LUFS**.
- **Música de fondo continua:** en las pausas el nivel queda en **−17 a −22 dB RMS**, y sigue durante el cierre (−18 dB) [SUPOSICIÓN: lo-fi o electrónica suave, sin voz]. Con la voz, la música va ~15–20 dB por debajo.
- [SUPOSICIÓN] Efectos sutiles (clic o "pop" suave) cuando se marcan casillas y entran tarjetas. No se distinguen whooshes fuertes.

## 9. Diferencias con nuestro estilo anterior (lo que cambia)
| Antes (piloto) | Ahora (referencia) |
|---|---|
| Subtítulos abajo (64 %), mayúsculas, contorno negro y "palabra activa" amarilla | Arriba (8–17 %) en A y bajo el gráfico en G; minúsculas; sin contorno; una palabra grande azul o blanca |
| Gráficos superpuestos sobre la cara | Gráficos a **pantalla completa** alternando con la cara (~55 %) |
| Zoom "punch" con destello blanco | Zoom lento continuo, cortes secos con desenfoque |
| Whoosh y pop fuertes, sin música | Música de fondo suave continua y efectos sutiles |

## 10. Correcciones aprendidas (se agregan cuando Luis aprueba un cambio)
- (vacío)
