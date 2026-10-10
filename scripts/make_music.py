#!/usr/bin/env python3
"""Genera una melodía de fondo suave y libre de derechos (acordes + arpegio) y efectos sutiles extra.
Uso: python3 scripts/make_music.py <segundos>  -> public/music/fondo-suave.wav y public/sfx/{chime,tick,bubble,rise}.wav
"""
import sys, wave
from pathlib import Path
import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent

def write(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    x = np.clip(x, -1, 1)
    st = np.stack([x, x], 1) if x.ndim == 1 else x
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())

def note(f, dur, kind='sine', attack=0.02, release=0.3):
    t = np.arange(int(dur * SR)) / SR
    if kind == 'pad':
        x = sum(np.sin(2*np.pi*f*m*t + p) * a for m, a, p in [(1, 1, 0), (2, .25, .3), (1.003, .6, 1.1), (0.997, .6, 2)])
    elif kind == 'pluck':
        x = (np.sin(2*np.pi*f*t) + .3*np.sin(2*np.pi*2*f*t)) * np.exp(-t*5)
    else:
        x = np.sin(2*np.pi*f*t)
    env = np.minimum(1, t/attack) * np.minimum(1, (dur - t)/release).clip(0, 1)
    return x * env

def hz(n):  # midi -> hz
    return 440 * 2 ** ((n - 69) / 12)

def music(seconds):
    bpm = 84; beat = 60 / bpm; bar = beat * 4
    prog = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]]  # Cmaj7 Am7 Fmaj7 G7sus
    n = int(seconds * SR) + SR
    out = np.zeros(n); arp = np.zeros(n); bass = np.zeros(n)
    k = 0; t0 = 0.0
    while t0 < seconds + bar:
        ch = prog[k % 4]
        i0 = int(t0 * SR)
        for m in ch:
            x = note(hz(m), bar + 0.4, 'pad', attack=0.6, release=0.8) * 0.06
            out[i0:i0+len(x)] += x[:max(0, n-i0)]
        b = note(hz(ch[0] - 24), bar, 'sine', attack=0.05, release=0.4) * 0.10
        bass[i0:i0+len(b)] += b[:max(0, n-i0)]
        pattern = [ch[0]+12, ch[2]+12, ch[1]+12, ch[3]+12, ch[2]+12, ch[1]+12, ch[3]+12, ch[2]+12]
        for j, m in enumerate(pattern):
            ij = int((t0 + j * beat / 2) * SR)
            x = note(hz(m), beat * 1.5, 'pluck', attack=0.005, release=0.2) * 0.045
            arp[ij:ij+len(x)] += x[:max(0, n-ij)]
        k += 1; t0 += bar
    # eco suave en el arpegio
    d = int(beat * 0.75 * SR); echo = np.zeros_like(arp); echo[d:] = arp[:-d] * 0.35
    mix = out + bass + arp + echo
    # suavizar (paso bajo de un polo)
    y = np.zeros_like(mix); a = 0.25
    for i in range(1, len(mix)): y[i] = y[i-1] + a * (mix[i] - y[i-1])
    y = y[:int(seconds * SR)]
    fade = int(2.5 * SR); y[:fade] *= np.linspace(0, 1, fade); y[-fade:] *= np.linspace(1, 0, fade)
    return y / (np.abs(y).max() + 1e-9) * 0.5

def sfx():
    t = lambda d: np.arange(int(d * SR)) / SR
    c = t(1.2); chime = (np.sin(2*np.pi*1318.5*c) + .6*np.sin(2*np.pi*1975.5*c) + .3*np.sin(2*np.pi*2637*c)) * np.exp(-c*4.5) * 0.35
    k = t(0.03); tick = np.random.default_rng(1).uniform(-1, 1, len(k)) * np.exp(-k*250) * 0.4
    b = t(0.16); bubble = np.sin(2*np.pi*(300 + 900*b)*b) * np.exp(-b*22) * 0.45
    r = t(0.9); rise = np.sin(2*np.pi*(220*r + 300*r**2)) * np.sin(np.pi*r/0.9)**2 * 0.18
    for name, x in [('chime', chime), ('tick', tick), ('bubble', bubble), ('rise', rise)]:
        write(ROOT / f'public/sfx/{name}.wav', x)

if __name__ == '__main__':
    secs = float(sys.argv[1]) if len(sys.argv) > 1 else 150
    write(ROOT / 'public/music/fondo-suave.wav', music(secs))
    sfx()
    print('ok')
