// Formato de los archivos que el pipeline genera y que Claude edita.
// Todos los tiempos están en segundos del video ya limpio (public/input/clean.mp4).

export type Word = {text: string; start: number; end: number};

export type Brand = {
  name: string;
  font: 'Montserrat' | 'Anton' | 'Poppins' | 'BebasNeue';
  primary: string; // color de fondo de los gráficos
  accent: string; // color de la palabra resaltada
  text: string; // color del texto de subtítulos
  stroke: string; // contorno del texto
  handle?: string; // @usuario que aparece al cierre
};

type Timed = {start: number; end: number};

export type Graphic = Timed &
  (
    | {type: 'keyword'; text: string; emoji?: string; position?: 'center' | 'top'}
    | {type: 'stat'; value: number; prefix?: string; suffix?: string; label: string}
    | {type: 'list'; title: string; items: string[]}
    | {type: 'emoji'; emoji: string; x?: number; y?: number}
    | {type: 'broll'; src: string; label?: string}
    | {type: 'cta'; text: string; sub?: string}
    | {type: 'vs'; left: string; right: string}
  );

export type Plan = {
  brand: string;
  video: string; // ruta dentro de public/
  durationSec: number;
  hook?: Timed & {text: string; emoji?: string};
  highlightWords?: string[]; // palabras que siempre van en color de acento
  zooms?: (Timed & {scale?: number; x?: number; y?: number})[];
  graphics?: Graphic[];
  music?: {src: string; volume?: number};
  sfx?: boolean; // agrega whoosh/pop automáticos en cada gráfico y zoom
  progressBar?: boolean;
};
