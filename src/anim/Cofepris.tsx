import {loadFont} from '@remotion/fonts';
import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Guía animada "Cómo tramitar su aviso de publicidad COFEPRIS" (genérica para clientes de salud).
// Estilo de estilo.md (tarjetas, chips, entrada con desenfoque) con colores REMARKET: marfil y azul.
export const B = {ivory: '#F7F2E8', blue: '#1D3F8F', blue2: '#3A6FD8', soft: '#DCE5F5', ink: '#15203A', muted: '#6B7280', white: '#FFFFFF', red: '#B4413C'};
const SANS = 'Urbanist, "Noto Color Emoji", sans-serif';
const MONO = '"JetBrains Mono", monospace';
for (const w of ['600', '800', '900']) loadFont({family: 'Urbanist', url: staticFile(`fonts/Urbanist-${w}.woff2`), weight: w});
for (const w of ['500', '700']) loadFont({family: 'JetBrains Mono', url: staticFile(`fonts/JetBrainsMono-${w}.woff2`), weight: w});

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

const useIn = (delay: number, dur = 10) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [delay, delay + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return {opacity: p, filter: `blur(${(1 - p) * 8}px)`, transform: `translateY(${(1 - p) * 34}px)`} as React.CSSProperties;
};

const In: React.FC<{d?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({d = 0, children, style}) => (
  <div style={{...useIn(d), ...style}}>{children}</div>
);

const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(60% 38% at 100% 0%, ${B.soft} 0%, rgba(220,229,245,0) 100%), radial-gradient(55% 32% at 0% 100%, #E6EDF8 0%, rgba(230,237,248,0) 100%), ${B.ivory}`,
    }}
  />
);

const Chip: React.FC<{text: string; d?: number}> = ({text, d = 0}) => (
  <In d={d} style={{alignSelf: 'center'}}>
    <div style={{background: B.ink, color: B.white, fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 1, padding: '12px 26px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 12}}>
      <span style={{width: 12, height: 12, borderRadius: 6, background: B.blue2}} />
      {text.toUpperCase()}
    </div>
  </In>
);

const Card: React.FC<{d?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({d = 4, children, style}) => (
  <In d={d}>
    <div style={{width: 900, background: B.white, borderRadius: 32, boxShadow: '0 24px 70px rgba(29,63,143,.13)', padding: 48, ...style}}>{children}</div>
  </In>
);

const Title: React.FC<{small?: string; big: string; d?: number; size?: number}> = ({small, big, d = 0, size = 96}) => (
  <div style={{textAlign: 'center', fontFamily: SANS}}>
    {small ? <In d={d} style={{fontSize: 46, fontWeight: 600, color: B.ink}}>{small}</In> : null}
    <In d={d + 5} style={{fontSize: size, fontWeight: 900, letterSpacing: '-0.02em', color: B.blue, lineHeight: 1.02}}>{big}</In>
  </div>
);

// Contenido centrado en vertical y ampliado para llenar el 9:16 (top se ignora; queda por compatibilidad)
const Col: React.FC<{children: React.ReactNode; top?: number; gap?: number; zoom?: number}> = ({children, gap = 34, zoom = 1.15}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 60}}>
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap, zoom}}>{children}</div>
  </AbsoluteFill>
);

const Check: React.FC<{at: number; ok?: boolean}> = ({at, ok = true}) => {
  const f = useCurrentFrame();
  const done = f >= at;
  const k = done ? interpolate(f, [at, at + 4, at + 8], [0.7, 1.12, 1], {extrapolateRight: 'clamp'}) : 1;
  const color = ok ? B.blue : B.red;
  return (
    <div style={{flex: 'none', width: 58, height: 58, borderRadius: 14, border: `4px solid ${done ? color : '#CBD5E1'}`, background: done ? color : B.white, color: B.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, transform: `scale(${k})`}}>
      {done ? (ok ? '✓' : '✕') : ''}
    </div>
  );
};

// ---------- Escenas ----------
const Intro: React.FC = () => (
  <Col top={520} gap={40}>
    <Chip text="Guía REMARKET IA" />
    <Title small="Cómo tramitar su" big="aviso de publicidad" size={96} d={6} />
    <In d={16} style={{fontFamily: SANS, fontWeight: 900, fontSize: 92, color: B.ink, letterSpacing: '-0.02em'}}>COFEPRIS</In>
    <In d={26} style={{fontFamily: SANS, fontWeight: 600, fontSize: 40, color: B.muted, textAlign: 'center', maxWidth: 820, lineHeight: 1.3}}>
      Para médicos que anuncian su consulta en redes sociales, Google o página web
    </In>
  </Col>
);

const Fact: React.FC<{icon: string; title: string; text: string; d: number}> = ({icon, title, text, d}) => (
  <In d={d} style={{display: 'flex', gap: 26, alignItems: 'center', margin: '18px 0'}}>
    <div style={{flex: 'none', width: 86, height: 86, borderRadius: 22, background: B.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44}}>{icon}</div>
    <div style={{fontFamily: SANS}}>
      <div style={{fontWeight: 800, fontSize: 46, color: B.ink}}>{title}</div>
      <div style={{fontWeight: 600, fontSize: 34, color: B.muted}}>{text}</div>
    </div>
  </In>
);

const QueEs: React.FC = () => (
  <Col>
    <Chip text="Qué es" />
    <Title small="Es un aviso," big="no un permiso" d={4} />
    <In d={14} style={{fontFamily: SANS, fontWeight: 600, fontSize: 38, color: B.ink, textAlign: 'center', maxWidth: 860, lineHeight: 1.35}}>
      Informa a COFEPRIS que va a anunciar sus servicios. No espera aprobación: al firmarlo recibe un acuse.
    </In>
    <Card d={22}>
      <Fact d={28} icon="💻" title="100 % en línea" text="En la plataforma DIGIPRiS" />
      <Fact d={36} icon="🆓" title="Gratuito" text="No tiene costo" />
      <Fact d={44} icon="🔐" title="Con su e.firma" text="La firma electrónica del SAT" />
      <In d={54} style={{fontFamily: MONO, fontSize: 28, color: B.blue, marginTop: 18, textAlign: 'center'}}>Trámite COFEPRIS-02-002-A · modalidad A</In>
    </Card>
  </Col>
);

const REQS = [
  {t: 'e.firma vigente del SAT', d: 'Archivos .cer y .key y su contraseña (no sirve el sello de facturación)'},
  {t: 'Aviso de funcionamiento', d: 'Su consultorio dado de alta en DIGIPRiS (COFEPRIS-05-036)'},
  {t: 'Cédulas y título en PDF', d: 'Cédula profesional, de especialidad y título'},
  {t: 'Anuncio final', d: 'La pieza que se publicará, en PDF o JPG'},
  {t: 'Datos del anuncio', d: 'Servicio, medios donde aparecerá y fecha de inicio'},
];

const Requisitos: React.FC = () => (
  <Col top={200} zoom={1.08}>
    <Chip text="Antes de empezar" />
    <Title small="Tenga listo" big="5 requisitos" d={4} />
    <Card d={14} style={{padding: '36px 44px'}}>
      {REQS.map((r, i) => (
        <In key={i} d={20 + i * 12} style={{display: 'flex', gap: 26, alignItems: 'center', margin: '22px 0'}}>
          <Check at={34 + i * 12} />
          <div style={{fontFamily: SANS}}>
            <div style={{fontWeight: 800, fontSize: 44, color: B.ink}}>{r.t}</div>
            <div style={{fontWeight: 600, fontSize: 31, color: B.muted, lineHeight: 1.3}}>{r.d}</div>
          </div>
        </In>
      ))}
    </Card>
  </Col>
);

export const STEPS = [
  {t: 'Entre a DIGIPRiS', d: 'Regístrese como persona física con su e.firma, o inicie sesión si ya tiene cuenta.', ui: ['digipris.cofepris.gob.mx', 'Iniciar sesión con e.firma']},
  {t: 'Verifique su consultorio', d: 'Debe estar dado de alta. Si no aparece, primero presente el aviso de funcionamiento.', ui: ['Mis establecimientos', 'Consultorio · dado de alta ✓']},
  {t: 'Abra el trámite', d: 'En "Ver trámites" elija Publicidad y después Aviso de publicidad, modalidad A.', ui: ['Ver trámites › Publicidad', 'Aviso de publicidad · modalidad A']},
  {t: 'Seleccione su consultorio', d: 'Elija el establecimiento y el número de ingreso de su aviso de funcionamiento.', ui: ['Establecimiento', 'No. de ingreso del aviso de funcionamiento']},
  {t: 'Capture el anuncio', d: 'Servicio que anuncia, medios, tipo de servicio y fecha de inicio. Con aviso de funcionamiento, deje vacía la licencia sanitaria.', ui: ['Servicio anunciado', 'Medios · Fecha de inicio']},
  {t: 'Suba el anuncio y documentos', d: 'Cargue la pieza final y sus cédulas, revise la vista previa y acepte la protesta de decir verdad.', ui: ['anuncio-final.pdf', 'cedulas.pdf']},
  {t: 'Firme con su e.firma', d: 'Firme como titular del consultorio.', ui: ['Firma electrónica', '.cer  ·  .key  ·  contraseña']},
  {t: 'Descargue su acuse', d: 'Muestra el número de ingreso de su aviso. Guárdelo y compártalo con REMARKET.', ui: ['Acuse de recibo', 'No. de ingreso · descargar PDF']},
];

const Step: React.FC<{i: number; dur: number}> = ({i, dur}) => {
  const f = useCurrentFrame();
  const st = STEPS[i];
  const prog = interpolate(f, [0, dur], [i / STEPS.length, (i + 1) / STEPS.length], {extrapolateRight: 'clamp'});
  return (
    <Col top={200} gap={30} zoom={1.12}>
      <Chip text={`Paso ${i + 1} de ${STEPS.length}`} />
      <div style={{width: 900, height: 14, borderRadius: 7, background: '#E5E7EB', overflow: 'hidden'}}>
        <div style={{width: `${prog * 100}%`, height: '100%', background: B.blue, borderRadius: 7}} />
      </div>
      <In d={3} style={{fontFamily: SANS, fontWeight: 900, fontSize: 200, color: B.blue, lineHeight: 0.95}}>{i + 1}</In>
      <Title big={st.t} d={6} size={84} />
      <In d={14} style={{fontFamily: SANS, fontWeight: 600, fontSize: 40, color: B.ink, textAlign: 'center', maxWidth: 880, lineHeight: 1.35}}>{st.d}</In>
      <Card d={22} style={{padding: 0, overflow: 'hidden'}}>
        <div style={{background: '#EEF2F9', padding: '18px 26px', display: 'flex', gap: 10, alignItems: 'center'}}>
          {['#F87171', '#FBBF24', '#34D399'].map((c) => (
            <span key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />
          ))}
          <span style={{marginLeft: 16, fontFamily: MONO, fontSize: 24, color: B.muted}}>digipris.cofepris.gob.mx</span>
        </div>
        <div style={{padding: '30px 36px'}}>
          <In d={28} style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, color: B.blue}}>{st.ui[0]}</In>
          <In d={34} style={{marginTop: 16, background: B.soft, borderRadius: 14, padding: '20px 24px', fontFamily: SANS, fontWeight: 800, fontSize: 36, color: B.ink}}>{st.ui[1]}</In>
        </div>
      </Card>
    </Col>
  );
};

const Mini: React.FC<{icon: string; t: string; d: string; delay: number}> = ({icon, t, d, delay}) => (
  <Card d={delay} style={{padding: '30px 38px', display: 'flex', gap: 26, alignItems: 'center'}}>
    <div style={{flex: 'none', fontSize: 56}}>{icon}</div>
    <div style={{fontFamily: SANS}}>
      <div style={{fontWeight: 800, fontSize: 44, color: B.ink}}>{t}</div>
      <div style={{fontWeight: 600, fontSize: 32, color: B.muted, lineHeight: 1.3}}>{d}</div>
    </div>
  </Card>
);

const Cuando: React.FC = () => (
  <Col top={260}>
    <Chip text="Cuándo presentarlo" />
    <Title small="Antes de que" big="empiecen los anuncios" d={4} size={86} />
    <Mini delay={18} icon="🗓️" t="Antes de publicar" d="Dentro de los días previos al inicio de la difusión" />
    <Mini delay={30} icon="🔁" t="Servicio o mensaje nuevo" d="Conviene presentar un aviso nuevo. Mismo mensaje: basta el mismo aviso" />
    <Mini delay={42} icon="⏱️" t="Si recibe una prevención" d="Respóndala en el plazo indicado o el trámite se da por abandonado" />
  </Col>
);

const SI = ['Nombre completo del médico', 'Cédula profesional y de especialidad', 'Especialidad', 'Recomendado: número de su aviso'];
const NO = ['Promesas de resultados o "curación garantizada"', 'Fotos de antes y después', 'Testimonios sin respaldo', 'Superlativos o comparaciones ("el mejor")'];

const Contenido: React.FC = () => (
  <Col top={200} gap={28} zoom={1.0}>
    <Chip text="Qué deben llevar sus anuncios" />
    <Card d={8} style={{padding: '34px 42px'}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 52, color: B.blue, marginBottom: 6}}>Siempre visible</div>
      {SI.map((x, i) => (
        <In key={i} d={14 + i * 7} style={{display: 'flex', gap: 22, alignItems: 'center', margin: '16px 0'}}>
          <Check at={18 + i * 7} />
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 38, color: B.ink}}>{x}</span>
        </In>
      ))}
    </Card>
    <Card d={50} style={{padding: '34px 42px'}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 52, color: B.red, marginBottom: 6}}>Nunca</div>
      {NO.map((x, i) => (
        <In key={i} d={56 + i * 7} style={{display: 'flex', gap: 22, alignItems: 'center', margin: '16px 0'}}>
          <Check at={60 + i * 7} ok={false} />
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 38, color: B.ink}}>{x}</span>
        </In>
      ))}
    </Card>
  </Col>
);

const Acompanamos: React.FC = () => (
  <Col top={330}>
    <Chip text="Cómo lo acompañamos" />
    <Title small="Usted no lo hace" big="solo" d={4} size={130} />
    <Mini delay={18} icon="📄" t="Anuncio listo para subir" d="REMARKET le entrega la pieza final" />
    <Mini delay={28} icon="🎥" t="Videollamada de 20 min" d="Lo guiamos mientras hace el trámite" />
    <Mini delay={38} icon="🔐" t="Su e.firma es suya" d="Usted firma. Nunca la pedimos ni la guardamos" />
  </Col>
);

const Cierre: React.FC = () => (
  <Col top={640} gap={30} zoom={1.1}>
    <In d={0} style={{fontFamily: SANS, fontWeight: 900, fontSize: 120, color: B.blue, letterSpacing: '-0.03em'}}>
      RE<span style={{color: B.ink}}>MARKET</span>
      <span style={{fontSize: 60, color: B.blue2, marginLeft: 14}}>IA</span>
    </In>
    <In d={8} style={{fontFamily: SANS, fontWeight: 600, fontSize: 40, color: B.ink}}>Marketing para profesionales de la salud</In>
    <In d={16} style={{fontFamily: MONO, fontWeight: 700, fontSize: 34, color: B.blue, background: B.white, padding: '16px 30px', borderRadius: 999, boxShadow: '0 12px 40px rgba(29,63,143,.12)'}}>direccion@re-market.mx</In>
    <In d={26} style={{fontFamily: SANS, fontWeight: 600, fontSize: 26, color: B.muted, textAlign: 'center', maxWidth: 860, lineHeight: 1.4, marginTop: 120}}>
      Guía informativa con información pública disponible a octubre de 2026; no constituye asesoría legal. Las pantallas de DIGIPRiS pueden cambiar. Dudas oficiales: COFEPRIS 800 033 50 50.
    </In>
  </Col>
);

// ---------- Línea de tiempo ----------
type Item = {sec: number; el: (dur: number) => React.ReactNode; sfx?: {at: number; src: string; v?: number}[]};
const STEP_SEC = 5.2;
const clicksAt = (start: number, every: number, n: number) => Array.from({length: n}, (_, i) => ({at: start + i * every, src: 'sfx/click.wav', v: 0.35}));

export const TIMELINE: Item[] = [
  {sec: 4.8, el: () => <Intro />},
  {sec: 7, el: () => <QueEs />},
  {sec: 9.5, el: () => <Requisitos />, sfx: clicksAt(34, 12, 5)},
  ...STEPS.map((_, i) => ({sec: STEP_SEC, el: (dur: number) => <Step i={i} dur={dur} />, sfx: [{at: 3, src: 'sfx/softpop.wav', v: 0.3}]})),
  {sec: 7.5, el: () => <Cuando />},
  {sec: 8.5, el: () => <Contenido />, sfx: [...clicksAt(18, 7, 4), ...clicksAt(60, 7, 4)]},
  {sec: 6.5, el: () => <Acompanamos />},
  {sec: 6, el: () => <Cierre />},
];
export const COFEPRIS_DURATION = TIMELINE.reduce((a, x) => a + s(x.sec), 0);

const Fade: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [dur - 6, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: o, filter: `blur(${(1 - o) * 10}px)`}}>{children}</AbsoluteFill>;
};

export const Cofepris: React.FC = () => {
  const {fps} = useVideoConfig();
  let from = 0;
  return (
    <AbsoluteFill>
      <Background />
      {TIMELINE.map((it, i) => {
        const dur = Math.round(it.sec * fps);
        const start = from;
        from += dur;
        return (
          <Sequence key={i} from={start} durationInFrames={dur}>
            <Fade dur={dur}>{it.el(dur)}</Fade>
            <Audio src={staticFile('sfx/swish.wav')} volume={0.2} />
            {(it.sfx ?? []).map((x, k) => (
              <Sequence key={k} from={x.at} durationInFrames={20}>
                <Audio src={staticFile(x.src)} volume={x.v ?? 0.3} />
              </Sequence>
            ))}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
