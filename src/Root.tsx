import React from 'react';
import {Composition, staticFile} from 'remotion';
import {ViralVideo, type ViralProps} from './ViralVideo';
import {EstiloRef} from './estilo/EstiloRef';
import type {RefProps} from './estilo/types';
import type {Brand, Plan, Word} from './types';

const FPS = 30;

// Lee el plan de edición (public/plan.json), la transcripción y la marca del cliente.
// render.mjs pasa estas mismas props directamente; Studio las carga de public/.
const load = async (): Promise<ViralProps> => {
  const plan: Plan = await fetch(staticFile('plan.json')).then((r) => r.json());
  const words: Word[] = await fetch(staticFile('captions.json')).then((r) => r.json());
  const brand: Brand = await fetch(staticFile(`brands/${plan.brand}.json`)).then((r) => r.json());
  return {plan, words, brand};
};

export const Root: React.FC = () => (
  <>
  <Composition
    id="EstiloRef"
    component={EstiloRef}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={FPS * 30}
    defaultProps={{} as RefProps}
    calculateMetadata={async ({props}) => {
      const p: RefProps = props.plan
        ? props
        : {plan: await fetch(staticFile('plan-ref.json')).then((r) => r.json()), words: await fetch(staticFile('captions.json')).then((r) => r.json())};
      return {props: p, durationInFrames: Math.ceil(p.plan.durationSec * FPS)};
    }}
  />
  <Composition
    id="ViralVideo"
    component={ViralVideo}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={FPS * 30}
    defaultProps={{} as ViralProps}
    calculateMetadata={async ({props}) => {
      const p = props.plan ? props : await load();
      return {props: p, durationInFrames: Math.ceil(p.plan.durationSec * FPS)};
    }}
  />
  </>
);
