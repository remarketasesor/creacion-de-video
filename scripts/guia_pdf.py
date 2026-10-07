#!/usr/bin/env python3
"""Genera la guía en PDF (HTML -> Chromium) a partir de estrategia/guiones-oct-dic-2026.md.

Uso: python3 scripts/guia_pdf.py /tmp/guia.html estrategia/guia-contenido-oct-dic-2026.pdf
"""
import html
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "estrategia/guiones-oct-dic-2026.md"
OUT_HTML = Path(sys.argv[1])
OUT_PDF = Path(sys.argv[2])
FONTS = ROOT / "public/fonts"

md = SRC.read_text()


def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\[([^\]]+)\]", r'<span class="hole">[\1]</span>', s)
    return s


def block(text):
    """Mini markdown: párrafos, listas con '- ', bloques ```."""
    out, para, lst, code = [], [], [], None
    def flush():
        nonlocal para, lst
        if para:
            out.append("<p>" + inline(" ".join(para)) + "</p>")
            para = []
        if lst:
            out.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in lst) + "</ul>")
            lst = []
    for raw in text.split("\n"):
        line = raw.strip()
        if line.startswith("```"):
            if code is None:
                flush(); code = []
            else:
                out.append('<pre class="prompt">' + html.escape("\n".join(code)) + "</pre>"); code = None
            continue
        if code is not None:
            code.append(raw.strip()); continue
        if not line:
            flush(); continue
        if line.startswith("- "):
            if para: flush()
            lst.append(line[2:]); continue
        if lst:
            lst[-1] += " " + line; continue
        para.append(line)
    flush()
    return "\n".join(out)


# ---------- guiones ----------
LABELS = ["Publicar", "Gancho (primer segundo)", "Guion (lo que dices)", "Cómo grabarlo", "Notas de edición",
          "Texto de publicación", "CTA / palabra clave", "Datos reales a llenar", "Cuidado"]
scripts = {}
for b in re.split(r"(?m)^(?=### \[)", md):
    m = re.match(r"### \[([A-Z0-9-]+)\] (.*)", b)
    if not m:
        continue
    sid, title = m.group(1), m.group(2).strip()
    fields, cur = {}, None
    for line in b.split("\n")[1:]:
        fm = re.match(r"- \*\*(.+?):\*\*\s?(.*)", line)
        if fm and any(fm.group(1).startswith(l.split(" (")[0]) for l in LABELS) and not line.startswith("  "):
            cur = fm.group(1); fields[cur] = fm.group(2) + "\n"
        elif cur:
            fields[cur] += line + "\n"
    meta = {}
    for part in fields.get("Publicar", "").split("·"):
        mm = re.match(r"\s*(?:\*\*)?([^:*]+?)(?::\*\*|:)\s*(.*)", part.strip())
        if mm:
            meta[mm.group(1).strip()] = mm.group(2).strip()
    first = fields.get("Publicar", "").split("·")[0].strip()
    meta["Publicar"] = re.sub(r"\s*\(hora CDMX\)", "", first).replace(" 2026", "")
    scripts[sid] = dict(id=sid, title=title, meta=meta, f=fields)
assert len(scripts) == 33, len(scripts)

# Orden por sesión, tal como está en el md
sessions = []
for sm in re.finditer(r"(?m)^## (Sesión .*|Rápidos .*)$", md):
    start = sm.end()
    nxt = re.search(r"(?m)^## ", md[start:])
    chunk = md[start: start + (nxt.start() if nxt else len(md))]
    note = re.search(r"(?m)^> (.*)$", chunk)
    ids = re.findall(r"(?m)^### \[([A-Z0-9-]+)\]", chunk)
    sessions.append((sm.group(1), note.group(1) if note else "", ids))

# Calendario (tabla del md)
cal_rows = []
cal = md[md.find("## Calendario"): md.find("## Sesiones de grabación")]
for line in cal.split("\n"):
    if line.startswith("| ") and not line.startswith("| Fecha") and not line.startswith("|---"):
        c = [x.strip() for x in line.strip("|").split("|")]
        cal_rows.append(c)

PILAR = {"P1": ("Números Reales", "p1"), "P2": ("Hazlo con IA", "p2"), "P3": ("La neta", "p3"), "P4": ("Papá CEO", "p4")}


def pill(p):
    k = p[:2]
    name, cls = PILAR.get(k, (p, "p0"))
    return f'<span class="pill {cls}">{k} · {name}</span>'


def strip_count(x):
    x = re.sub(r"\*?\(\s*≈?\s*\d+[^()]*palabras[^()]*\)\*?", "", x)
    return x


def script_card(s):
    f, m = s["f"], s["meta"]
    g = f.get("Gancho (primer segundo)", "").strip().strip('"“”')
    yesno = lambda v: "sí" if v.lower().startswith("s") else "no"
    tm = m.get("Tu marca", "no")
    rp = m.get("Repost en @remarketmx", "no")
    chips = [f'<span class="chip">📅 {inline(m.get("Publicar",""))}</span>',
             f'<span class="chip">⏱ {inline(m.get("Duración","").split(" (")[0])}</span>',
             pill(m.get("Pilar", "")),
             f'<span class="chip">🎥 {inline(m.get("Grabación","").split(",")[0].split(" (")[0])}</span>']
    if yesno(tm) == "sí":
        chips.append('<span class="chip warn">Etiqueta “Tu marca”</span>')
    if yesno(rp) == "sí":
        chips.append('<span class="chip ok">Repost en @remarketmx</span>')
    datos = f.get("Datos reales a llenar", "").strip()
    cuidado = f.get("Cuidado", "").strip()
    parts = [f'<section class="script"><div class="shead"><span class="sid">{s["id"]}</span><h3>{inline(s["title"])}</h3></div>',
             '<div class="chips">' + "".join(chips) + "</div>",
             f'<div class="hook"><div class="lbl">Gancho · lo primero que dices</div><div class="htxt">“{inline(g)}”</div></div>',
             '<div class="lbl">Guion · lo que dices</div><div class="guion">' + block(strip_count(f.get("Guion (lo que dices)", ""))) + "</div>",
             '<div class="two"><div class="box"><div class="lbl">🎬 Cómo grabarlo</div>' + block(f.get("Cómo grabarlo", "")) + "</div>",
             '<div class="box"><div class="lbl">📲 Texto para publicar</div>' + block(f.get("Texto de publicación", "")) +
             '<div class="lbl" style="margin-top:8px">💬 Cierre / palabra clave</div>' + block(f.get("CTA / palabra clave", "")) + "</div></div>"]
    if datos and not datos.lower().startswith("ninguno"):
        parts.append('<div class="fill"><div class="lbl">✏️ Llena antes de grabar</div>' + block(datos) + "</div>")
    if cuidado:
        parts.append('<div class="careful"><div class="lbl">⚠️ Cuidado</div>' + block(cuidado) + "</div>")
    parts.append("</section>")
    return "\n".join(parts)


# ---------- páginas de guía ----------
cal_html = "".join(
    f"<tr><td>{inline(r[0])}</td><td><b>{r[1]}</b></td><td>{inline(r[2])}</td><td>{pill(r[3]) if r[3].startswith('P') else r[3]}</td><td>{inline(r[4])}</td><td>{inline(r[5])}</td></tr>"
    for r in cal_rows)

ses_html = "".join(
    f"<tr><td><b>{inline(n.split(' (')[0].replace('Sesión ', ''))}</b></td><td>{inline(n[n.find('(')+1:-1]) if '(' in n else ''}</td><td>{len(ids)}</td><td>{', '.join(ids)}</td></tr>"
    for n, _, ids in sessions)

guide = f"""
<section class="cover">
  <div class="kicker">@luisinanaya · octubre – diciembre 2026</div>
  <h1>Tu guía de contenido</h1>
  <p class="sub">Qué grabar, cuándo publicarlo y cómo convertirlo en clientes. En palabras sencillas.</p>
  <div class="coverbox">
    <div><b>33</b><span>guiones listos</span></div>
    <div><b>13</b><span>semanas</span></div>
    <div><b>6</b><span>sesiones de grabación</span></div>
  </div>
  <p class="who">Preparada para Luis Anaya · REMARKET IA</p>
  <div class="howto"><b>Cómo usar esta guía:</b> las páginas 2 a 9 son el plan (léelas una vez).
  Después, cada guion trae todo lo que necesitas para grabarlo: el gancho, el texto, cómo grabarlo y qué publicar.</div>
</section>

<section class="page">
  <h2><span class="num">1</span> El plan en una página</h2>
  <div class="big7">
    <div><b>1</b><p><b>Hoy tu cuenta es casi toda pagada.</b> 518 de tus 567 seguidores vinieron de Promote y casi no ven tus videos.</p></div>
    <div><b>2</b><p><b>Deja de pagar por seguidores y likes.</b> Promote no es malo, pero pagar por seguidores no te acerca a ganar dinero.</p></div>
    <div><b>3</b><p><b>Tu tema:</b> marketing con IA para consultorios y negocios de servicios en México. Es lo que ya haces y casi nadie lo cuenta.</p></div>
    <div><b>4</b><p><b>El dinero viene de clientes para tu agencia</b>, no de lo que TikTok paga por vistas (eso está a más de un año).</p></div>
    <div><b>5</b><p><b>Graba en bloque una vez por semana.</b> Claude edita. Tú revisas, apruebas y publicas.</p></div>
    <div><b>6</b><p><b>Con el bebé, mínimo 2 videos por semana.</b> Esta semana grabas 12 para tener reserva.</p></div>
    <div><b>7</b><p><b>Metas honestas a 90 días:</b> +100 a +250 seguidores reales, 2 a 8 contactos interesados y 0 a 1 cliente nuevo por el contenido.</p></div>
  </div>
</section>

<section class="page">
  <h2><span class="num">2</span> Dónde estás hoy</h2>
  <div class="stats">
    <div class="stat"><b>567</b><span>seguidores</span></div>
    <div class="stat red"><b>518</b><span>vinieron de Promote (≈ 91 %)</span></div>
    <div class="stat"><b>≈ MX$1</b><span>costó cada seguidor pagado</span></div>
    <div class="stat red"><b>0.5 %</b><span>de tus vistas viene de quienes te siguen</span></div>
  </div>
  <h4>Qué significa</h4>
  <ul class="clean">
    <li>Tus videos con más vistas (domingo, realidad virtual, anuncios de ChatGPT) fueron casi todos <b>pagados</b>. No nos dicen qué le gusta a la gente.</li>
    <li>El video del <b>parto</b> parece ser tu mejor video sin pago. Confírmalo en Promote → Pedidos (14 y 15 de septiembre).</li>
    <li>Sin pagar, hoy tienes entre <b>90 y 490 vistas al día</b>. Ese es tu punto de partida real.</li>
    <li>La tarjeta “Est. rewards $0.00” <b>no</b> quiere decir que ya cobres: el programa pide 10,000 seguidores.</li>
  </ul>
  <div class="callout"><b>La idea central:</b> no tienes un problema de algoritmo. Te falta un tema claro, constancia y un camino para cobrar que no dependa de los seguidores.</div>
</section>

<section class="page">
  <h2><span class="num">3</span> Tu tema y tus 4 tipos de video</h2>
  <p class="lead"><b>Marketing con IA para consultorios y negocios de servicios en México</b>, contado por un dueño de agencia que acaba de ser papá. Sin filtros.</p>
  <div class="pillars">
    <div class="pc p1"><h4>P1 · Números Reales</h4><p>Experimentos y cifras reales: lo que pagaste en Promote, lo que cuesta un mensaje…</p><small>“Mi cuenta tiene 567 seguidores. 518 los pagué.”</small></div>
    <div class="pc p2"><h4>P2 · Hazlo con IA</h4><p>Prompts y trucos para un consultorio o negocio: WhatsApp, pacientes que faltan, enero…</p><small>“Así contestaría WhatsApp un consultorio a las 11 de la noche.”</small></div>
    <div class="pc p3"><h4>P3 · La neta</h4><p>Opinión y mitos sobre IA y marketing.</p><small>“¿La IA me va a dejar sin clientes? Te digo la neta.”</small></div>
    <div class="pc p4"><h4>P4 · Modo Papá CEO</h4><p>Serie semanal: la agencia y tu vida de papá. Siempre con una lección de negocio.</p><small>“Mi bebé nace este mes y tengo una agencia con 15 clientes.”</small></div>
  </div>
  <div class="callout"><b>Regla para hablar de varios temas:</b> cualquier tema entra si termina en algo que le sirva a un dueño de consultorio o negocio. Si no, no se graba.</div>
</section>

<section class="page">
  <h2><span class="num">4</span> Cómo vas a ganar dinero</h2>
  <div class="ladder">
    <div class="step s1"><b>1. Clientes nuevos para REMARKET IA</b><p>Los que lleguen por tus videos, cotizados a precio de mercado. Es lo que más deja.</p></div>
    <div class="step s2"><b>2. Ahorrar tiempo en lo que ya entregas</b><p>Editar con Claude te regresa horas: más margen y más tiempo con tu bebé.</p></div>
    <div class="step s3"><b>3. Afiliados de herramientas</b><p>Desde 1,000–5,000 seguidores, solo de herramientas que de verdad uses.</p></div>
    <div class="step s4"><b>4. Pago de TikTok por vistas</b><p>Desde 10,000 seguidores. Paga poco. No cuentes con él en 2026–2027.</p></div>
  </div>
  <table class="t">
    <tr><th>Seguidores</th><th>Lo que paga la cuenta al mes</th><th>Lo que puede traer en clientes</th></tr>
    <tr><td>0 – 1,000 (hoy)</td><td>MX$0</td><td>2–8 contactos y 0–1 cliente en 90 días</td></tr>
    <tr><td>1,000 – 10,000</td><td>MX$0 – 1,500</td><td>1–2 clientes por trimestre</td></tr>
    <tr><td>10,000 – 50,000</td><td>MX$1,000 – 10,000</td><td>Más contactos y cobrar más caro</td></tr>
  </table>
  <div class="callout"><b>Un solo cliente de MX$3,500 al mes</b> vale lo que TikTok pagaría por millones de vistas.</div>
</section>

<section class="page">
  <h2><span class="num">5</span> Qué hacer esta semana</h2>
  <ul class="check">
    <li>Pausa en Promote las campañas de <b>seguidores</b> y de <b>likes</b>.</li>
    <li>Revisa que tu cuenta sea <b>personal</b>, no de empresa (Configuración → Cuenta).</li>
    <li>Cambia tu bio a: <b>“Marketing con IA para consultorios y negocios de servicios. Papá CEO. DM: IA”</b></li>
    <li>Llena los <span class="hole">[datos]</span> de los primeros guiones (G1).</li>
    <li><b>Graba la sesión G1</b> (~2 h, 12 videos) en el orden de la página de sesiones.</li>
    <li>Sube las tomas a Drive como <code>crudos/AAAA-MM-DD/G1-03.mp4</code> y avísale a Claude.</li>
    <li>Publica el piloto “IA vs editores” (jueves 8 oct, 19:30).</li>
    <li>Configura WhatsApp Business con etiquetas: Nuevo, Diagnóstico, Propuesta, Cliente, Frío.</li>
    <li>Pídele a Claude el <b>guion de WhatsApp para recepción</b> (es lo que entregas cuando alguien escribe WHATSAPP).</li>
  </ul>
  <h4>Tu semana normal (≈ 2.5–3 h)</h4>
  <div class="flow">
    <div>📝<b>Elige</b><span>3–4 guiones</span></div><div>🎥<b>Graba</b><span>45–60 min</span></div><div>☁️<b>Sube</b><span>a Drive</span></div>
    <div>🤖<b>Claude edita</b><span>te entrega video y texto</span></div><div>✅<b>Revisa</b><span>15 min</span></div><div>📅<b>Programa</b><span>TikTok + Instagram</span></div>
  </div>
</section>

<section class="page">
  <h2><span class="num">6</span> Calendario de publicación</h2>
  <p class="small">Supuesto: tu bebé nace alrededor del 19–25 de octubre. Si nace antes o después, solo se recorren los episodios de Papá CEO.</p>
  <table class="t cal"><tr><th>Fecha</th><th>ID</th><th>Video</th><th>Tipo</th><th>Duración</th><th>Palabra clave</th></tr>{cal_html}</table>
</section>

<section class="page">
  <h2><span class="num">7</span> Sesiones de grabación</h2>
  <table class="t"><tr><th>Sesión</th><th>Cuándo</th><th>Videos</th><th>Guiones (en orden)</th></tr>{ses_html}</table>
  <h4>Tips para grabar rápido</h4>
  <ul class="clean">
    <li>Di el <b>gancho dos veces</b>: una mirando a la cámara y otra con el objeto en la mano.</li>
    <li>Nada de “hola, ¿qué tal?”. Empieza directo con el gancho.</li>
    <li>Cambia de playera o de lugar entre algunos videos para que no parezcan del mismo día.</li>
    <li>Si un video lleva pantalla (prompts, WhatsApp, Drive), grábala aparte en vertical.</li>
    <li>El editor quita los silencios: no te preocupes por las pausas.</li>
  </ul>
  <h2 style="margin-top:22px"><span class="num">8</span> Palabras clave por mensaje</h2>
  <table class="t">
    <tr><th>Si te escriben…</th><th>Les mandas…</th></tr>
    <tr><td><b>WHATSAPP</b></td><td>El guion de WhatsApp para la recepción de su consultorio o negocio.</td></tr>
    <tr><td><b>REELS</b></td><td>La prueba del servicio de edición con IA (antes de que tu bebé cumpla un mes, agenda el arranque para diciembre).</td></tr>
    <tr><td><b>ENERO</b></td><td>La plantilla para planear enero con IA (desde diciembre).</td></tr>
  </table>
  <div class="dm"><b>Respuesta por mensaje:</b> “¡Qué onda, [nombre]! Gracias por escribir. Para mandarte lo que sí te sirve: 1) ¿Qué negocio tienes? 2) ¿En qué ciudad? 3) ¿Hoy inviertes en anuncios? (no / menos de $3,000 / más de $3,000 al mes). Aquí va el guion: [link]. Si quieres, lo vemos 20 min por WhatsApp.”</div>
  <p class="small">Pregunta siempre: <b>“¿Con qué video me encontraste?”</b> Así sabes qué contenido trae clientes.</p>
</section>

<section class="page">
  <h2><span class="num">9</span> Reglas de oro</h2>
  <div class="rules">
    <div class="yes"><h4>✅ Sí</h4><ul>
      <li>Empieza con un número, un objeto o una situación concreta.</li>
      <li>Cierra con una pregunta concreta o una palabra clave.</li>
      <li>Usa solo cifras reales. Si no tienes el dato, no lo digas.</li>
      <li>Pon la etiqueta “Tu marca” en los videos que venden la agencia.</li>
      <li>Para @remarketmx: repostea, no vuelvas a subir el mismo archivo.</li>
      <li>Contesta los comentarios en la primera hora.</li>
    </ul></div>
    <div class="no"><h4>🚫 No</h4><ul>
      <li>Nombres, logos, chats, precios o casos que identifiquen a un cliente.</li>
      <li>Presentarte como experto en COFEPRIS. Habla solo de las reglas de Meta.</li>
      <li>Promesas de cura, antes y después ni testimonios de pacientes.</li>
      <li>La cara, el nombre o el hospital de tu bebé.</li>
      <li>“Este video no lo editó ningún humano” ni cuánto te cuesta editar.</li>
      <li>Pedir likes, comprar seguidores o cambiarte a cuenta de empresa.</li>
    </ul></div>
  </div>
  <h4>Metas a 90 días (al 5 de enero)</h4>
  <table class="t">
    <tr><th>Qué medir</th><th>Hoy</th><th>Meta</th></tr>
    <tr><td>Videos publicados por semana</td><td>Irregular</td><td>2 (con bebé) → 3–4</td></tr>
    <tr><td>Gasto en Promote para seguidores</td><td>MX$300–500/mes</td><td>MX$0</td></tr>
    <tr><td>Seguidores reales nuevos</td><td>~50 en total</td><td>+100 a +250</td></tr>
    <tr><td>Visitas al perfil / vistas</td><td>0.44 %</td><td>1.2 %</td></tr>
    <tr><td>Contactos interesados (giro + ciudad)</td><td>0</td><td>2–8</td></tr>
    <tr><td>Clientes nuevos por el contenido</td><td>—</td><td>0–1</td></tr>
  </table>
  <p class="small">El 7 de noviembre revisa qué tipo de video (P1–P4) tuvo mejor retención y más visitas al perfil, y dale más espacio.</p>
</section>
"""

scripts_html = ""
for name, note, ids in sessions:
    scripts_html += f'<section class="divider"><div class="kicker">Guiones</div><h2>{inline(name)}</h2>' + \
        (f"<p>{inline(note)}</p>" if note else "") + \
        '<ol class="idx">' + "".join(f"<li><b>{i}</b> {inline(scripts[i]['title'])}</li>" for i in ids) + "</ol></section>"
    for i in ids:
        scripts_html += script_card(scripts[i])

css = f"""
@font-face {{ font-family: 'Montserrat'; font-weight: 800; src: url('file://{FONTS}/Montserrat-800.woff2'); }}
@font-face {{ font-family: 'Montserrat'; font-weight: 900; src: url('file://{FONTS}/Montserrat-900.woff2'); }}
@page {{ size: Letter; margin: 16mm 15mm 16mm 15mm;
  @bottom-right {{ content: counter(page); font: 9pt Inter, sans-serif; color: #6b7280; }}
  @bottom-left {{ content: "Guía de contenido · @luisinanaya · oct–dic 2026"; font: 8pt Inter, sans-serif; color: #9ca3af; }} }}
@page :first {{ @bottom-right {{ content: none; }} @bottom-left {{ content: none; }} }}
:root {{ --ink:#111827; --muted:#6b7280; --line:#e5e7eb; --acc:#FFD60A; --soft:#FFF8D6; }}
* {{ box-sizing: border-box; }}
body {{ font-family: Inter, 'Noto Color Emoji', sans-serif; color: var(--ink); font-size: 10.5pt; line-height: 1.45; margin: 0; }}
h1,h2,h3,h4 {{ font-family: Montserrat, Inter, sans-serif; font-weight: 900; margin: 0 0 8px; line-height: 1.15; }}
h2 {{ font-size: 19pt; margin-bottom: 12px; }}
h4 {{ font-size: 11.5pt; margin: 14px 0 6px; }}
.num {{ display:inline-block; background: var(--acc); color: var(--ink); border-radius: 8px; padding: 0 9px; margin-right: 6px; }}
.page {{ break-before: page; font-size: 12pt; line-height: 1.5; }}
.page h4 {{ font-size: 13pt; margin-top: 18px; }}
.page .clean li, .page .check li {{ margin: 8px 0; }}
.page .stat b {{ font-size: 24pt; }} .page .stat span {{ font-size: 10pt; }}
.page .callout {{ font-size: 12pt; padding: 14px 16px; }}
.page .pc {{ padding: 14px; }} .page .pc small {{ font-size: 10.5pt; }}
.page .step {{ padding: 12px 14px; }}
.page table.t {{ font-size: 10.5pt; }} .page table.t td, .page table.t th {{ padding: 7px 8px; }}
.page .rules li {{ margin: 7px 0; }}
.small {{ color: var(--muted); font-size: 9pt; }}
.lead {{ font-size: 12pt; }}
code {{ background:#f3f4f6; padding: 1px 4px; border-radius: 4px; font-size: 9pt; }}
.hole {{ background: #FEF3C7; color: #111827; border-radius: 3px; padding: 0 2px; font-weight: 600; }}
.cover {{ height: 247mm; display:flex; flex-direction:column; justify-content:center; background: #111827; color:#fff;
  margin: -16mm -15mm 0; padding: 0 22mm; }}
.cover .kicker {{ color: var(--acc); font-weight: 700; letter-spacing: .5px; font-size: 12pt; }}
.cover h1 {{ font-size: 46pt; color:#fff; margin-top: 10px; }}
.cover .sub {{ font-size: 15pt; color:#e5e7eb; max-width: 150mm; }}
.coverbox {{ display:flex; gap: 10px; margin: 30px 0 34px; }}
.coverbox div {{ background: var(--acc); color: var(--ink); border-radius: 14px; padding: 14px 18px; flex: 1; font-weight: 600; }}
.coverbox b {{ font: 900 30pt Montserrat; display:block; }}
.cover .who {{ color: #fff; font-weight: 700; margin: 0 0 10px; }}
.cover .howto {{ color: var(--ink); background: var(--soft); border-radius: 12px; padding: 14px 16px; font-size: 11pt; }}
.big7 div {{ display:flex; gap: 14px; align-items:flex-start; border-bottom: 1px solid var(--line); padding: 16px 0; }}
.big7 div > b {{ font: 900 24pt Montserrat; color: var(--ink); background: var(--acc); border-radius: 12px; min-width: 48px; text-align:center; padding: 2px 0; }}
.big7 p {{ margin: 6px 0 0; font-size: 13.5pt; line-height: 1.4; }}
.stats {{ display:grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 8px; }}
.stat {{ border: 2px solid var(--line); border-radius: 12px; padding: 10px; }}
.stat b {{ font: 900 20pt Montserrat; display:block; }}
.stat span {{ font-size: 9pt; color: var(--muted); }}
.stat.red {{ border-color: #fca5a5; background: #fef2f2; }}
.clean li, .check li {{ margin: 5px 0; }}
.check {{ list-style: none; padding-left: 0; }}
.check li::before {{ content: "☐  "; font-size: 13pt; }}
.callout {{ background: var(--soft); border-left: 6px solid var(--acc); border-radius: 8px; padding: 10px 12px; margin-top: 14px; }}
.pillars {{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }}
.pc {{ border-radius: 12px; padding: 12px; border: 2px solid var(--line); }}
.pc p {{ margin: 4px 0; }} .pc small {{ color: var(--muted); font-style: italic; }}
.p1 {{ background:#EEF2FF; border-color:#c7d2fe; }} .p2 {{ background:#ECFDF5; border-color:#a7f3d0; }}
.p3 {{ background:#FFF7ED; border-color:#fed7aa; }} .p4 {{ background:#FDF2F8; border-color:#fbcfe8; }}
.ladder {{ display:grid; gap: 6px; margin-bottom: 12px; }}
.step {{ border-radius: 10px; padding: 9px 12px; background:#f9fafb; border-left: 6px solid var(--acc); }}
.step p {{ margin: 2px 0 0; color: #374151; }}
.step.s1 {{ background: var(--soft); }} .step.s4 {{ border-left-color:#d1d5db; }}
table.t {{ width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 6px 0; }}
.t th {{ background: var(--ink); color: #fff; text-align: left; padding: 6px 7px; font-weight: 700; }}
.t td {{ border-bottom: 1px solid var(--line); padding: 5px 7px; vertical-align: top; }}
.t tr:nth-child(even) td {{ background: #fafafa; }}
.page .cal td {{ font-size: 8.6pt; padding: 3.5px 6px; line-height: 1.35; }}
.cal td:nth-child(2), .cal td:nth-child(1) {{ white-space: nowrap; }}
.cal tr {{ break-inside: avoid; }}
.pill {{ display:inline-block; border-radius: 999px; padding: 1px 8px; font-size: 8pt; font-weight: 700; white-space: nowrap; }}
.flow {{ display:grid; grid-template-columns: repeat(6,1fr); gap: 6px; text-align:center; }}
.flow div {{ background:#f9fafb; border-radius: 10px; padding: 8px 4px; font-size: 16pt; }}
.flow b {{ display:block; font-size: 9.5pt; }} .flow span {{ display:block; font-size: 8pt; color: var(--muted); }}
.dm {{ background:#ECFDF5; border-radius: 10px; padding: 10px 12px; margin-top: 8px; }}
.rules {{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }}
.rules > div {{ border-radius: 12px; padding: 10px 12px; }}
.yes {{ background:#ECFDF5; }} .no {{ background:#FEF2F2; }}
.rules li {{ margin: 4px 0; }}
.divider {{ break-before: page; background: var(--ink); color: #fff; border-radius: 16px; padding: 18px 20px; margin-bottom: 14px; }}
.divider h2 {{ color: #fff; }} .divider .kicker {{ color: var(--acc); font-weight: 700; }}
.divider p {{ color: #e5e7eb; }} .idx {{ columns: 2; color:#e5e7eb; font-size: 9.5pt; padding-left: 18px; }}
.idx b {{ color: var(--acc); }}
.script {{ border: 2px solid var(--line); border-radius: 14px; padding: 12px 14px; margin: 0 0 14px; }}
.script + .script {{ break-before: page; }}
.divider + .script {{ break-before: auto; }}
.shead {{ display:flex; align-items:center; gap: 10px; }}
.sid {{ background: var(--acc); font: 900 12pt Montserrat; padding: 3px 9px; border-radius: 8px; white-space: nowrap; }}
.shead h3 {{ font-size: 14pt; margin: 0; }}
.chips {{ margin: 8px 0; display:flex; flex-wrap: wrap; gap: 5px; }}
.chip {{ background:#f3f4f6; border-radius: 999px; padding: 2px 9px; font-size: 8.5pt; }}
.chip.warn {{ background:#FEF3C7; font-weight: 700; }} .chip.ok {{ background:#DCFCE7; }}
.lbl {{ font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: .4px; color: var(--muted); margin: 8px 0 3px; }}
.hook {{ background: var(--ink); color:#fff; border-radius: 10px; padding: 9px 12px; break-inside: avoid; }}
.hook .lbl {{ color: var(--acc); margin-top: 0; }}
.htxt {{ font: 800 13pt Montserrat; line-height: 1.25; }}
.guion {{ font-size: 11.5pt; line-height: 1.5; border-left: 4px solid var(--acc); padding-left: 10px; }}
.guion p {{ margin: 0 0 7px; }}
.two {{ display:grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }}
.box {{ background:#f9fafb; border-radius: 10px; padding: 4px 10px 8px; font-size: 9pt; }}
.box p {{ margin: 3px 0; }}
.fill {{ background: #FEF3C7; border-radius: 10px; padding: 4px 10px 8px; margin-top: 8px; font-size: 9pt; break-inside: avoid; }}
.careful {{ background: #FEF2F2; border-radius: 10px; padding: 4px 10px 8px; margin-top: 8px; font-size: 9pt; }}
.fill p, .careful p {{ margin: 3px 0; }}
pre.prompt {{ white-space: pre-wrap; background:#111827; color:#f9fafb; border-radius: 8px; padding: 8px 10px; font-size: 8.5pt; font-family: 'DejaVu Sans Mono', monospace; }}
ul {{ padding-left: 18px; margin: 4px 0; }}
"""

doc = f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Guía de contenido · @luisinanaya · oct–dic 2026</title>
<style>{css}</style></head><body>{guide}{scripts_html}</body></html>"""
OUT_HTML.write_text(doc)

chrome = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
subprocess.run([chrome, "--headless", "--no-sandbox", "--disable-gpu", "--allow-file-access-from-files",
                "--no-pdf-header-footer", f"--print-to-pdf={OUT_PDF}", "--virtual-time-budget=10000", f"file://{OUT_HTML}"],
               check=True, capture_output=True)
print("ok", OUT_PDF)
