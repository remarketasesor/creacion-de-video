import {loadFont} from '@remotion/fonts';
import {continueRender, delayRender, staticFile} from 'remotion';
import type {Brand} from './types';

// Las tipografías viven en public/fonts para que el render no dependa de internet.
const files: Record<Brand['font'], string[]> = {
  Montserrat: ['800', '900'],
  Poppins: ['800', '900'],
  Anton: ['400'],
  BebasNeue: ['400'],
};

const loaded = new Set<Brand['font']>();

export const fontFor = (font: Brand['font']) => {
  if (!loaded.has(font)) {
    loaded.add(font);
    const handle = delayRender(`Cargando ${font}`);
    Promise.all(files[font].map((weight) => loadFont({family: font, url: staticFile(`fonts/${font}-${weight}.woff2`), weight})))
      .then(() => continueRender(handle))
      .catch((err) => {
        console.error(err);
        continueRender(handle);
      });
  }
  return `${font}, "Noto Color Emoji", sans-serif`;
};
