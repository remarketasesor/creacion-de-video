import React from 'react';
import {AbsoluteFill, Easing, interpolate, OffthreadVideo, Img, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Brand, Graphic} from '../types';

// Cada gráfico se monta dentro de un <Sequence>, así que frame 0 = inicio del gráfico.

type P<T extends Graphic['type']> = Extract<Graphic, {type: T}> & {brand: Brand; fontFamily: string; durationInFrames: number};

const useInOut = (durationInFrames: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 11, stiffness: 180}});
  const exit = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {frame, fps, enter, exit};
};

const pill = (brand: Brand): React.CSSProperties => ({
  background: brand.primary,
  borderRadius: 28,
  padding: '26px 44px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
  border: `6px solid ${brand.accent}`,
});

const Keyword: React.FC<P<'keyword'>> = ({text, emoji, position = 'top', brand, fontFamily, durationInFrames}) => {
  const {frame, enter, exit} = useInOut(durationInFrames);
  const shake = frame < 8 ? Math.sin(frame * 3) * (8 - frame) * 1.5 : 0;
  return (
    <AbsoluteFill style={{justifyContent: position === 'center' ? 'center' : 'flex-start', alignItems: 'center', paddingTop: position === 'top' ? 260 : 0}}>
      <div
        style={{
          ...pill(brand),
          transform: `translateX(${shake}px) scale(${interpolate(enter, [0, 1], [2.2, 1])}) rotate(-3deg)`,
          opacity: Math.min(enter * 1.5, 1) * exit,
          fontFamily,
          fontWeight: 900,
          fontSize: 92,
          color: '#fff',
          textTransform: 'uppercase',
          textAlign: 'center',
          maxWidth: 940,
          lineHeight: 1.05,
        }}
      >
        {emoji ? <span style={{marginRight: 18}}>{emoji}</span> : null}
        {text}
      </div>
    </AbsoluteFill>
  );
};

const Stat: React.FC<P<'stat'>> = ({value, prefix = '', suffix = '', label, brand, fontFamily, durationInFrames}) => {
  const {frame, fps, enter, exit} = useInOut(durationInFrames);
  const count = interpolate(frame, [0, Math.min(fps * 1.2, durationInFrames - 6)], [0, value], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const decimals = Number.isInteger(value) ? 0 : 1;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 220}}>
      <div style={{...pill(brand), textAlign: 'center', transform: `scale(${enter}) translateY(${(1 - enter) * -200}px)`, opacity: exit}}>
        <div style={{fontFamily, fontWeight: 900, fontSize: 190, color: brand.accent, lineHeight: 1}}>
          {prefix}
          {count.toLocaleString('es-MX', {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}
          {suffix}
        </div>
        <div style={{fontFamily, fontWeight: 800, fontSize: 54, color: '#fff', textTransform: 'uppercase', marginTop: 8}}>{label}</div>
      </div>
    </AbsoluteFill>
  );
};

const List: React.FC<P<'list'>> = ({title, items, brand, fontFamily, durationInFrames}) => {
  const {frame, fps, enter, exit} = useInOut(durationInFrames);
  const step = Math.max(6, Math.floor((durationInFrames - fps) / Math.max(items.length, 1)));
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 200, opacity: exit}}>
      <div style={{...pill(brand), width: 900, transform: `translateY(${(1 - enter) * -300}px)`}}>
        <div style={{fontFamily, fontWeight: 900, fontSize: 70, color: brand.accent, textTransform: 'uppercase', marginBottom: 18}}>{title}</div>
        {items.map((item, i) => {
          const s = spring({frame: frame - 8 - i * step, fps, config: {damping: 12}});
          return (
            <div
              key={i}
              style={{
                fontFamily,
                fontWeight: 800,
                fontSize: 60,
                color: '#fff',
                margin: '12px 0',
                transform: `translateX(${(1 - s) * -120}px)`,
                opacity: s,
                display: 'flex',
                gap: 18,
              }}
            >
              <span style={{color: brand.accent}}>✓</span>
              {item}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Emoji: React.FC<P<'emoji'>> = ({emoji, x = 78, y = 30, durationInFrames}) => {
  const {frame, enter, exit} = useInOut(durationInFrames);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          fontSize: 200,
          transform: `translate(-50%,-50%) scale(${enter}) rotate(${Math.sin(frame / 5) * 10}deg)`,
          opacity: exit,
          filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.5))',
        }}
      >
        {emoji}
      </div>
    </AbsoluteFill>
  );
};

// B-roll: imagen o video que tapa la mitad superior (el subtítulo sigue visible abajo).
const BRoll: React.FC<P<'broll'>> = ({src, label, brand, fontFamily, durationInFrames}) => {
  const {frame, enter, exit} = useInOut(durationInFrames);
  const isVideo = /\.(mp4|mov|webm)$/i.test(src);
  const zoom = interpolate(frame, [0, durationInFrames], [1.05, 1.18]);
  const style: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`};
  return (
    <AbsoluteFill style={{opacity: exit}}>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: '58%', overflow: 'hidden', clipPath: `inset(0 0 ${(1 - enter) * 100}% 0)`, borderBottom: `10px solid ${brand.accent}`}}>
        {isVideo ? <OffthreadVideo src={staticFile(src)} muted style={style} /> : <Img src={staticFile(src)} style={style} />}
        {label ? (
          <div style={{position: 'absolute', bottom: 40, left: 40, ...pill(brand), padding: '14px 28px', fontFamily, fontWeight: 900, fontSize: 48, color: '#fff', textTransform: 'uppercase'}}>{label}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const Cta: React.FC<P<'cta'>> = ({text, sub, brand, fontFamily, durationInFrames}) => {
  const {frame, enter, exit} = useInOut(durationInFrames);
  const pulse = 1 + Math.sin(frame / 4) * 0.03;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 300, opacity: exit}}>
      <div style={{...pill(brand), background: brand.accent, borderColor: '#fff', textAlign: 'center', transform: `scale(${enter * pulse})`, maxWidth: 940}}>
        <div style={{fontFamily, fontWeight: 900, fontSize: 84, color: brand.primary, textTransform: 'uppercase', lineHeight: 1.05}}>{text}</div>
        {sub ? <div style={{fontFamily, fontWeight: 900, fontSize: 60, color: brand.primary, marginTop: 10}}>{sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// Enfrentamiento: dos etiquetas entran desde los lados y un "VS" golpea en medio.
const Vs: React.FC<P<'vs'>> = ({left, right, brand, fontFamily, durationInFrames}) => {
  const {frame, fps, exit} = useInOut(durationInFrames);
  const l = spring({frame, fps, config: {damping: 13, stiffness: 200}});
  const r = spring({frame: frame - 4, fps, config: {damping: 13, stiffness: 200}});
  const v = spring({frame: frame - 9, fps, config: {damping: 8, stiffness: 260}});
  const shake = frame >= 9 && frame < 17 ? Math.sin(frame * 3) * (17 - frame) * 1.5 : 0;
  const side: React.CSSProperties = {...pill(brand), fontFamily, fontWeight: 900, fontSize: 68, color: '#fff', textTransform: 'uppercase', padding: '24px 34px', whiteSpace: 'nowrap', textAlign: 'center'};
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 200, opacity: exit}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 0, transform: `translateX(${shake}px)`}}>
        <div style={{...side, transform: `translateX(${(1 - l) * -700}px) rotate(-4deg)`}}>{left}</div>
        <div
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize: 110,
            color: brand.accent,
            WebkitTextStroke: `12px ${brand.stroke}`,
            paintOrder: 'stroke fill',
            margin: '0 -24px',
            zIndex: 2,
            transform: `scale(${interpolate(v, [0, 1], [3, 1])})`,
            opacity: Math.min(v * 2, 1),
          }}
        >
          VS
        </div>
        <div style={{...side, background: brand.accent, color: brand.primary, transform: `translateX(${(1 - r) * 700}px) rotate(4deg)`}}>{right}</div>
      </div>
    </AbsoluteFill>
  );
};

export const GraphicView: React.FC<{g: Graphic; brand: Brand; fontFamily: string; durationInFrames: number}> = ({g, ...rest}) => {
  switch (g.type) {
    case 'keyword':
      return <Keyword {...g} {...rest} />;
    case 'stat':
      return <Stat {...g} {...rest} />;
    case 'list':
      return <List {...g} {...rest} />;
    case 'emoji':
      return <Emoji {...g} {...rest} />;
    case 'broll':
      return <BRoll {...g} {...rest} />;
    case 'cta':
      return <Cta {...g} {...rest} />;
    case 'vs':
      return <Vs {...g} {...rest} />;
  }
};
