// Paso 4: renderiza a out/<nombre>.mp4
// Uso: node scripts/render.mjs [nombre] [composición=ViralVideo] [plan=plan.json]
//   estilo de referencia: node scripts/render.mjs g1-01 EstiloRef plan-ref.json
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const [name = 'video', id = 'ViralVideo', planFile = id === 'EstiloRef' ? 'plan-ref.json' : 'plan.json'] = process.argv.slice(2);
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, 'public', p), 'utf8'));

const plan = read(planFile);
const words = read('captions.json');
const inputProps = id === 'EstiloRef' ? {plan, words} : {plan, words, brand: read(`brands/${plan.brand}.json`)};

// En la nube usamos el Chromium preinstalado en vez de descargar uno.
const pw = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const browserExecutable = process.env.REMOTION_CHROME ?? (fs.existsSync(pw) ? pw : null);

const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const composition = await selectComposition({serveUrl, id, inputProps, browserExecutable});
const outputLocation = path.join(root, 'out', `${name}.mp4`);
let last = -1;
await renderMedia({
  serveUrl,
  composition,
  inputProps,
  codec: 'h264',
  crf: 18,
  outputLocation,
  browserExecutable,
  onProgress: ({progress}) => {
    const p = Math.floor(progress * 10);
    if (p !== last) console.log(`  ${p * 10}%`), (last = p);
  },
});
console.log(`✓ ${outputLocation}`);
