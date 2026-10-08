import {loadFont} from '@remotion/fonts';
import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Word} from '../types';
import type {RefPlan, RefProps, Scene} from './types';

// Valores de estilo.md
const C = {bg: '#FBFAFD', blue: '#0052FA', ink: '#1F2430', black: '#111111', soft: '#D2DFFD'};
const SANS = 'Urbanist, "Noto Color Emoji", sans-serif';
const MONO = '"JetBrains Mono", monospace';

// @remotion/fonts ya retrasa el render hasta que la fuente carga
for (const w of ['600', '800', '900']) loadFont({family: 'Urbanist', url: staticFile(`fonts/Urbanist-${w}.woff2`), weight: w});
for (const w of ['500', '700']) loadFont({family: 'JetBrains Mono', url: staticFile(`fonts/JetBrainsMono-${w}.woff2`), weight: w});

const BLUR_IN = 6; // fotogramas (0.2 s)

// desenfoque 8px→0 + opacidad 0→1
const blurIn = (frame: number, start: number, dur = BLUR_IN) => {
  const p = interpolate(frame, [start, start + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return {opacity: p, filter: `blur(${(1 - p) * 8}px)`, p};
};

const sceneAt = (plan: RefPlan, t: number) => plan.scenes.find((s) => t >= s.start && t < s.end);

// ---------- Subtítulos: línea chica + palabra grande ----------
const Captions: React.FC<{plan: RefPlan; words: Word[]}> = ({plan, words}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const blocks = plan.blocks;
  const idx = blocks.findIndex((b, i) => {
    const start = words[b.from].start;
    const end = i + 1 < blocks.length ? words[blocks[i + 1].from].start : words[b.to].end + 0.4;
    return t >= start && t < end;
  });
  if (idx < 0) return null;
  const b = blocks[idx];
  const endT = idx + 1 < blocks.length ? words[blocks[idx + 1].from].start : words[b.to].end + 0.4;
  const onG = !!sceneAt(plan, t);
  const out = interpolate(frame, [endT * fps - 5, endT * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const color = onG ? C.ink : '#FFFFFF';
  const bigColor = onG ? C.blue : '#FFFFFF';
  const shadow = onG ? 'none' : '0 4px 24px rgba(0,0,0,.35)';
  const w = (i: number) => {
    const s = blurIn(frame, Math.round(words[i].start * fps));
    return <span key={i} style={{opacity: s.opacity, filter: s.filter, display: 'inline-block', marginRight: 14}}>{words[i].text.replace(/[,.]$/, '')}</span>;
  };
  const range = (a: number, z: number) => Array.from({length: Math.max(0, z - a + 1)}, (_, k) => a + k);
  const bigS = blurIn(frame, Math.round(words[b.big].start * fps));
  const top = onG ? 1000 : 150;
  return (
    <AbsoluteFill style={{alignItems: 'center', opacity: out, filter: `blur(${(1 - out) * 6}px)`}}>
      <div style={{position: 'absolute', top, width: 980, textAlign: 'center', fontFamily: SANS, textShadow: shadow}}>
        <div style={{fontSize: 52, fontWeight: 600, color, minHeight: 64, lineHeight: 1.2}}>{range(b.from, b.big - 1).map(w)}</div>
        <div style={{fontSize: 124, fontWeight: 900, letterSpacing: '-0.02em', color: bigColor, lineHeight: 1.05, opacity: bigS.opacity, filter: bigS.filter}}>
          {words[b.big].text.replace(/[,.]$/, '')}
        </div>
        <div style={{fontSize: 44, fontWeight: 600, color, minHeight: 50, lineHeight: 1.2}}>{range(b.big + 1, b.to).map(w)}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Piezas de interfaz ----------
const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(60% 40% at 100% 0%, ${C.soft} 0%, rgba(210,223,253,0) 100%), radial-gradient(55% 35% at 0% 100%, #DEE6FA 0%, rgba(222,230,250,0) 100%), ${C.bg}`,
    }}
  />
);

const Chip: React.FC<{text: string; delay?: number}> = ({text, delay = 0}) => {
  const frame = useCurrentFrame();
  const s = blurIn(frame, delay, 9);
  return (
    <div style={{opacity: s.opacity, filter: s.filter, transform: `translateY(${(1 - s.p) * 30}px)`, background: C.black, color: '#fff', fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 1, padding: '12px 26px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 12}}>
      <span style={{width: 12, height: 12, borderRadius: 6, background: C.blue}} />
      {text.toUpperCase()}
    </div>
  );
};

const Card: React.FC<{children: React.ReactNode; delay?: number; width?: number; style?: React.CSSProperties}> = ({children, delay = 4, width = 760, style}) => {
  const frame = useCurrentFrame();
  const s = blurIn(frame, delay, 9);
  return (
    <div style={{opacity: s.opacity, filter: s.filter, transform: `translateY(${(1 - s.p) * 40}px)`, width, background: '#fff', borderRadius: 28, boxShadow: '0 20px 60px rgba(30,60,140,.12)', padding: 40, ...style}}>
      {children}
    </div>
  );
};

const Stage: React.FC<{chip: string; children: React.ReactNode}> = ({chip, children}) => (
  <AbsoluteFill>
    <Background />
    <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
      <Chip text={chip} />
      {children}
    </div>
  </AbsoluteFill>
);

const count = (frame: number, from: number, dur: number, to: number) =>
  Math.round(interpolate(frame, [from, from + dur], [0, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));

const SceneView: React.FC<{s: Scene}> = ({s}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rel = (abs: number) => Math.round((abs - s.start) * fps);
  switch (s.kind) {
    case 'profile':
      return (
        <Stage chip={s.chip}>
          <Card>
            <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
              <div style={{width: 110, height: 110, borderRadius: 55, background: `linear-gradient(135deg, ${C.blue}, #7AA2FF)`}} />
              <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, color: C.ink}}>{s.handle}</div>
            </div>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 170, color: C.blue, lineHeight: 1, marginTop: 30}}>{count(frame, 6, 30, s.value)}</div>
            <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 44, color: C.ink}}>{s.label}</div>
          </Card>
        </Stage>
      );
    case 'progress': {
      const pct = interpolate(frame, [8, 38], [0, s.value / s.total], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
      return (
        <Stage chip={s.chip}>
          <Card>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 16, fontFamily: SANS}}>
              <span style={{fontWeight: 900, fontSize: 150, color: C.blue, lineHeight: 1}}>{count(frame, 8, 30, s.value)}</span>
              <span style={{fontWeight: 800, fontSize: 56, color: C.ink}}>de {s.total}</span>
            </div>
            <div style={{height: 36, borderRadius: 18, background: '#EEF2FB', marginTop: 30, overflow: 'hidden'}}>
              <div style={{height: '100%', width: `${pct * 100}%`, background: C.blue, borderRadius: 18}} />
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 16, fontFamily: SANS, fontSize: 40, fontWeight: 600, color: C.ink}}>
              <span>{s.label}</span>
              <span style={{fontWeight: 800, color: C.blue}}>{Math.round(pct * 100)} %</span>
            </div>
          </Card>
        </Stage>
      );
    }
    case 'button': {
      const press = rel(s.pressAt);
      const k = interpolate(frame, [press - 3, press, press + 6], [1, 0.9, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      const pressed = frame >= press;
      const ring = interpolate(frame, [press, press + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      return (
        <Stage chip={s.chip}>
          <Card width={560} style={{padding: 28}}>
            <div style={{height: 470, borderRadius: 20, background: 'linear-gradient(180deg,#1b2233,#0f1420)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 30}}>
              <div style={{position: 'relative'}}>
                <div style={{position: 'absolute', inset: -10, borderRadius: 999, border: `4px solid ${C.blue}`, opacity: pressed ? 1 - ring : 0, transform: `scale(${1 + ring * 0.25})`}} />
                <div style={{transform: `scale(${k})`, background: pressed ? C.blue : '#FE2C55', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 44, padding: '20px 56px', borderRadius: 999}}>
                  {pressed ? '✓ ' : '🔥 '}
                  {s.button}
                </div>
              </div>
            </div>
            <div style={{fontFamily: MONO, fontSize: 26, color: '#6b7280', marginTop: 18, textAlign: 'center'}}>{s.caption}</div>
          </Card>
        </Stage>
      );
    }
    case 'bars': {
      const hl = rel(s.highlightAt);
      return (
        <Stage chip={s.chip}>
          <Card>
            {s.bars.map((b, i) => {
              const grow = interpolate(frame, [8 + i * 4, 30 + i * 4], [0, b.value / 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
              const on = b.highlight && frame >= hl;
              const dim = s.bars.some((x) => x.highlight) && frame >= hl && !b.highlight;
              return (
                <div key={i} style={{marginBottom: 26, opacity: dim ? 0.35 : 1}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontSize: 40, fontWeight: on ? 900 : 600, color: on ? C.blue : C.ink}}>
                    <span>{b.label}</span>
                    <span>{b.value.toFixed(1)} %</span>
                  </div>
                  <div style={{height: 26, borderRadius: 13, background: '#EEF2FB', marginTop: 8}}>
                    <div style={{height: '100%', width: `${Math.max(grow * 100, b.value > 0 ? 1.5 : 0)}%`, background: on ? C.blue : '#9DB4F0', borderRadius: 13}} />
                  </div>
                </div>
              );
            })}
          </Card>
        </Stage>
      );
    }
    case 'checklist':
      return (
        <Stage chip={s.chip}>
          <Card>
            <div style={{fontFamily: MONO, fontSize: 30, fontWeight: 700, color: C.ink, marginBottom: 22}}>{s.title}</div>
            {s.items.map((it, i) => {
              const at = rel(it.at);
              const done = frame >= at;
              const app = blurIn(frame, 8 + i * 5, 9);
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, margin: '18px 0', opacity: app.opacity, filter: app.filter}}>
                  <div style={{width: 54, height: 54, borderRadius: 12, border: `4px solid ${done ? (it.ok ? C.blue : '#9CA3AF') : '#CBD5E1'}`, background: done && it.ok ? C.blue : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, transform: `scale(${done ? interpolate(frame, [at, at + 4, at + 8], [0.8, 1.1, 1], {extrapolateRight: 'clamp'}) : 1})`}}>
                    {done ? (it.ok ? '✓' : <span style={{color: '#9CA3AF'}}>✕</span>) : ''}
                  </div>
                  <span style={{fontFamily: SANS, fontSize: 56, fontWeight: 800, color: done && !it.ok ? '#9CA3AF' : C.ink, textDecoration: done && !it.ok ? 'line-through' : 'none'}}>{it.text}</span>
                </div>
              );
            })}
          </Card>
        </Stage>
      );
    case 'question':
      return (
        <Stage chip={s.chip}>
          <Card>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, color: C.ink, lineHeight: 1.1, textAlign: 'center'}}>{s.question}</div>
            <div style={{display: 'flex', gap: 20, justifyContent: 'center', marginTop: 34}}>
              {s.options.map((o, i) => {
                const a = blurIn(frame, 14 + i * 5, 9);
                return (
                  <div key={i} style={{opacity: a.opacity, filter: a.filter, fontFamily: SANS, fontWeight: 800, fontSize: 46, padding: '16px 54px', borderRadius: 999, background: i === 0 ? C.blue : '#EEF2FB', color: i === 0 ? '#fff' : C.ink}}>
                    {o}
                  </div>
                );
              })}
            </div>
          </Card>
        </Stage>
      );
  }
};

// ---------- Toma a cámara con zoom lento 100→106 % por toma ----------
const ARoll: React.FC<{plan: RefPlan}> = ({plan}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  // límites de la toma A actual
  const edges = [0, ...plan.scenes.flatMap((s) => [s.start, s.end]), durationInFrames / fps].sort((a, b) => a - b);
  let a = 0;
  let z = durationInFrames / fps;
  for (let i = 0; i < edges.length - 1; i++) if (t >= edges[i] && t < edges[i + 1]) [a, z] = [edges[i], edges[i + 1]];
  const scale = interpolate(t, [a, z], [1, 1.06], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // la primera toma nace dentro de una tarjeta
  let card = 1;
  if (plan.cardIntroAt !== undefined) card = interpolate(frame, [plan.cardIntroAt * fps, plan.cardIntroAt * fps + 9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const inset = (1 - card) * 0.11;
  return (
    <AbsoluteFill>
      {card < 1 ? <Background /> : null}
      <AbsoluteFill style={{clipPath: `inset(${inset * 100 * 1.3}% ${inset * 100}% round ${(1 - card) * 40}px)`, overflow: 'hidden'}}>
        <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: '50% 40%'}}>
          <OffthreadVideo src={staticFile(plan.video)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: plan.videoFilter, transform: plan.mirror ? 'scaleX(-1)' : undefined}} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const EstiloRef: React.FC<RefProps> = ({plan, words}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ARoll plan={plan} />
      {plan.scenes.map((s, i) => {
        const from = Math.round(s.start * fps);
        const dur = Math.round((s.end - s.start) * fps);
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <SceneFade dur={dur}>
              <SceneView s={s} />
            </SceneFade>
          </Sequence>
        );
      })}
      <Captions plan={plan} words={words} />
      {plan.sfx.map((x, i) => (
        <Sequence key={`s${i}`} from={Math.round(x.at * fps)} durationInFrames={30}>
          <Audio src={staticFile(x.src)} volume={x.volume ?? 0.3} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// G entra con corte seco y sale con fundido + desenfoque de 4 fotogramas
const SceneFade: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [dur - 4, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: o, filter: `blur(${(1 - o) * 10}px)`}}>{children}</AbsoluteFill>;
};
