import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Brand, Word} from '../types';

// Subtítulos estilo "Hormozi": 1–3 palabras por pantalla, la palabra que se
// está diciendo salta y cambia de color. Las palabras clave van siempre en acento.

const MAX_WORDS = 3;
const MAX_CHARS = 18;
const MAX_GAP = 0.6; // si hay una pausa mayor, empieza un grupo nuevo

const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

const groupWords = (words: Word[]) => {
  const groups: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    const prev = cur[cur.length - 1];
    const chars = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
    const endsSentence = prev && /[.!?,;:]$/.test(prev.text);
    if (cur.length && (cur.length >= MAX_WORDS || chars > MAX_CHARS || w.start - prev.end > MAX_GAP || endsSentence)) {
      groups.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) groups.push(cur);
  return groups;
};

export const Captions: React.FC<{words: Word[]; brand: Brand; fontFamily: string; highlight: string[]; hiddenRanges: {start: number; end: number}[]}> = ({
  words,
  brand,
  fontFamily,
  highlight,
  hiddenRanges,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const groups = React.useMemo(() => groupWords(words), [words]);
  const hl = React.useMemo(() => new Set(highlight.map(clean)), [highlight]);

  if (hiddenRanges.some((r) => t >= r.start && t < r.end)) return null;

  const idx = groups.findIndex((g, i) => {
    const next = groups[i + 1];
    const end = next ? Math.min(next[0].start, g[g.length - 1].end + 0.5) : g[g.length - 1].end + 0.5;
    return t >= g[0].start && t < end;
  });
  if (idx === -1) return null;
  const group = groups[idx];
  const groupStart = Math.round(group[0].start * fps);
  const enter = spring({frame: frame - groupStart, fps, config: {damping: 12, stiffness: 220}});

  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', top: '64%'}}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '6px 40px',
          maxWidth: 940,
          transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])})`,
          opacity: enter,
        }}
      >
        {group.map((w, i) => {
          const active = t >= w.start && t < (group[i + 1]?.start ?? Infinity);
          const isKey = hl.has(clean(w.text));
          const pop = spring({frame: frame - Math.round(w.start * fps), fps, config: {damping: 10, stiffness: 300}, durationInFrames: 8});
          const scale = active ? interpolate(pop, [0, 1], [1, 1.12]) : 1;
          return (
            <span
              key={i}
              style={{
                fontFamily,
                fontWeight: 900,
                fontSize: isKey ? 112 : 96,
                lineHeight: 1.05,
                textTransform: 'uppercase',
                color: active || isKey ? brand.accent : brand.text,
                WebkitTextStroke: `14px ${brand.stroke}`,
                paintOrder: 'stroke fill',
                textShadow: '0 8px 24px rgba(0,0,0,0.55)',
                transform: `scale(${scale}) rotate(${isKey && active ? -3 : 0}deg)`,
                display: 'inline-block',
              }}
            >
              {w.text.replace(/[.,;:]$/, '')}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
