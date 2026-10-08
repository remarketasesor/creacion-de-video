// Plan para el estilo de referencia (ver estilo.md). Tiempos en segundos del video limpio.
import type {Word} from '../types';

export type Block = {from: number; to: number; big: number}; // índices de palabras (inclusive)

export type Scene =
  | {kind: 'profile'; start: number; end: number; chip: string; handle: string; value: number; label: string}
  | {kind: 'progress'; start: number; end: number; chip: string; value: number; total: number; label: string}
  | {kind: 'button'; start: number; end: number; chip: string; button: string; pressAt: number; caption: string}
  | {kind: 'bars'; start: number; end: number; chip: string; bars: {label: string; value: number; highlight?: boolean}[]; highlightAt: number}
  | {kind: 'checklist'; start: number; end: number; chip: string; title: string; items: {text: string; ok: boolean; at: number}[]}
  | {kind: 'question'; start: number; end: number; chip: string; question: string; options: string[]};

export type Sfx = {at: number; src: string; volume?: number};

export type RefPlan = {
  video: string;
  durationSec: number;
  blocks: Block[];
  scenes: Scene[];
  cardIntroAt?: number; // la toma a cámara nace dentro de una tarjeta
  sfx: Sfx[];
  videoFilter?: string;
  mirror?: boolean; // la cámara frontal graba en espejo: true lo corrige
};

export type RefProps = {plan: RefPlan; words: Word[]};
