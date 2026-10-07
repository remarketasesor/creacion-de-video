import React from 'react';
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Captions} from './components/Captions';
import {GraphicView} from './components/Graphics';
import {fontFor} from './fonts';
import type {Brand, Plan, Word} from './types';

export type ViralProps = {plan: Plan; words: Word[]; brand: Brand};

const sec = (s: number, fps: number) => Math.round(s * fps);

// Zoom "punch-in": entra rápido, sale suave. Fuera de los zooms el video respira con un zoom lento.
const useCameraScale = (plan: Plan) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  let scale = interpolate(frame, [0, durationInFrames], [1, 1.06]);
  let origin = '50% 40%';
  for (const z of plan.zooms ?? []) {
    const start = sec(z.start, fps);
    const end = sec(z.end, fps);
    if (frame < start || frame > end + 8) continue;
    const zin = spring({frame: frame - start, fps, config: {damping: 14, stiffness: 260}});
    const zout = spring({frame: frame - end, fps, config: {damping: 20}});
    scale *= 1 + ((z.scale ?? 1.25) - 1) * (zin - zout);
    origin = `${z.x ?? 50}% ${z.y ?? 38}%`;
  }
  return {scale, origin};
};

const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{background: '#fff', opacity: interpolate(frame, [0, 4], [0.55, 0], {extrapolateRight: 'clamp'})}} />;
};

const Hook: React.FC<{text: string; emoji?: string; brand: Brand; fontFamily: string; durationInFrames: number}> = ({text, emoji, brand, fontFamily, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 10, stiffness: 160}});
  const exit = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 170}}>
      <div
        style={{
          background: '#fff',
          color: '#000',
          fontFamily,
          fontWeight: 900,
          fontSize: 78,
          lineHeight: 1.08,
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: '26px 40px',
          borderRadius: 22,
          maxWidth: 960,
          boxShadow: `0 0 0 8px ${brand.accent}, 0 24px 60px rgba(0,0,0,0.5)`,
          transform: `translateY(${(1 - enter) * -400}px) rotate(${(1 - enter) * -8}deg)`,
          opacity: exit,
        }}
      >
        {emoji ? `${emoji} ` : ''}
        {text}
      </div>
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC<{color: string}> = ({color}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 0, left: 0, height: 14, width: `${(frame / durationInFrames) * 100}%`, background: color}} />
    </AbsoluteFill>
  );
};

export const ViralVideo: React.FC<ViralProps> = ({plan, words, brand}) => {
  const {fps} = useVideoConfig();
  const fontFamily = fontFor(brand.font);
  const {scale, origin} = useCameraScale(plan);
  const graphics = plan.graphics ?? [];
  const ctaRanges = graphics.filter((g) => g.type === 'cta');

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: origin}}>
        <OffthreadVideo src={staticFile(plan.video)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>

      {/* viñeta para que el texto resalte */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />

      {graphics.map((g, i) => {
        const from = sec(g.start, fps);
        const dur = Math.max(sec(g.end - g.start, fps), 10);
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <GraphicView g={g} brand={brand} fontFamily={fontFamily} durationInFrames={dur} />
          </Sequence>
        );
      })}

      {plan.hook ? (
        <Sequence from={sec(plan.hook.start, fps)} durationInFrames={sec(plan.hook.end - plan.hook.start, fps)}>
          <Hook {...plan.hook} brand={brand} fontFamily={fontFamily} durationInFrames={sec(plan.hook.end - plan.hook.start, fps)} />
        </Sequence>
      ) : null}

      <Captions words={words} brand={brand} fontFamily={fontFamily} highlight={plan.highlightWords ?? []} hiddenRanges={ctaRanges} />

      {/* destellos de transición al entrar cada zoom */}
      {(plan.zooms ?? []).map((z, i) => (
        <Sequence key={`f${i}`} from={sec(z.start, fps)} durationInFrames={5}>
          <Flash />
        </Sequence>
      ))}

      {plan.progressBar !== false ? <ProgressBar color={brand.accent} /> : null}

      {plan.music ? <Audio src={staticFile(plan.music.src)} volume={plan.music.volume ?? 0.12} loop /> : null}

      {plan.sfx !== false
        ? [
            ...graphics.map((g, i) => (
              <Sequence key={`s${i}`} from={sec(g.start, fps)} durationInFrames={20}>
                <Audio src={staticFile(g.type === 'emoji' || g.type === 'stat' ? 'sfx/pop.wav' : 'sfx/whoosh.wav')} volume={0.5} />
              </Sequence>
            )),
            ...(plan.zooms ?? []).map((z, i) => (
              <Sequence key={`z${i}`} from={sec(z.start, fps)} durationInFrames={20}>
                <Audio src={staticFile('sfx/whoosh.wav')} volume={0.35} />
              </Sequence>
            )),
          ]
        : null}
    </AbsoluteFill>
  );
};
