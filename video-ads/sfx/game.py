"""Game-specific generators + the shared dark-fantasy music bed. Same conventions as synth.py."""

import math
import random

from .synth import SR, bandnoise, whoosh, riser, impact, chime, pop, blip, click
from . import dsp

# D minor, everything tonal stays in key
D2, F2, A2 = 73.42, 87.31, 110.0
D3, E3, F3, G3, A3, Bb3, C4 = 146.83, 164.81, 174.61, 196.0, 220.0, 233.08, 261.63
D4, F4, A4, D5, F5, A5, D6 = 293.66, 349.23, 440.0, 587.33, 698.46, 880.0, 1174.66


def boom(f0=95, f1=42, dur=0.6, click_amt=0.5):
    """War drum / taiko: pitch-dropping sine body with a skin slap."""
    n = int(dur * SR)
    out, ph = [], 0.0
    for k in range(n):
        tt = k / SR
        f = f1 + (f0 - f1) * math.exp(-tt / 0.045)
        ph += 2 * math.pi * f / SR
        s = math.sin(ph) * math.exp(-tt / 0.22)
        s += random.uniform(-1, 1) * math.exp(-tt / 0.008) * click_amt
        out.append(math.tanh(1.8 * s))
    return out


def shatter(base=2600, parts=7, dur=0.7):
    """Gem breaking: glassy inharmonic partials plus a bright crack."""
    n = int(dur * SR)
    out = [0.0] * n
    for j in range(parts):
        f = base * (0.7 + random.random() * 1.6)
        d0 = random.uniform(0, 0.03)
        tau = random.uniform(0.06, 0.22)
        ph = random.random() * 6.28
        i0 = int(d0 * SR)
        for k in range(i0, n):
            tt = (k - i0) / SR
            out[k] += math.sin(ph + 2 * math.pi * f * tt) * math.exp(-tt / tau) / parts * 1.6
    crack = bandnoise(int(0.08 * SR), lambda k: 5200, q=0.5)
    for k, v in enumerate(crack):
        out[k] += v * math.exp(-k / (0.012 * SR)) * 1.4
    return out


def clang(f=420, dur=1.6):
    """Steel ring: a blade drawn, armour struck. Inharmonic partials."""
    n = int(dur * SR)
    ratios = [(1.0, 1.0, 0.9), (2.76, 0.6, 0.5), (5.40, 0.4, 0.3), (8.93, 0.25, 0.18), (13.3, 0.15, 0.1)]
    out = []
    for k in range(n):
        tt = k / SR
        s = sum(a * math.sin(2 * math.pi * f * r * tt) * math.exp(-tt / tau) for r, a, tau in ratios)
        s += random.uniform(-1, 1) * math.exp(-tt / 0.004) * 0.6
        out.append(s * 0.5)
    return out


def crackle(dur=0.6):
    """Lightning: dense random spikes through a bright band."""
    n = int(dur * SR)
    noise = bandnoise(n, lambda k: 3000, q=0.4)
    out = []
    gate = 0.0
    for k in range(n):
        if random.random() < 0.004:
            gate = 1.0
        gate *= 0.9985
        out.append(noise[k] * (0.35 + gate) * math.exp(-k / (0.25 * SR)) * 2.2)
    return out


def stone(dur=0.35):
    """Stone block cracking apart: low gritty burst."""
    n = int(dur * SR)
    noise = bandnoise(n, lambda k: 900 * math.exp(-k / (0.1 * SR)) + 250, q=0.6)
    return [noise[k] * math.exp(-k / (0.07 * SR)) * 2.5 + math.sin(2 * math.pi * 70 * k / SR) * math.exp(-k / (0.05 * SR)) * 0.6 for k in range(n)]


def heartbeat():
    """Two low thumps, lub-dub."""
    a = boom(70, 40, 0.3, 0.0)
    b = boom(64, 38, 0.3, 0.0)
    out = [0.0] * int(0.6 * SR)
    for k, v in enumerate(a): out[k] += v
    for k, v in enumerate(b):
        i = k + int(0.19 * SR)
        if i < len(out): out[i] += v * 0.7
    return out


def fire(dur=1.0):
    """Flame roar sweeping through: noise band rising then falling."""
    n = int(dur * SR)
    noise = bandnoise(n, lambda k: 400 + 2600 * math.sin(math.pi * k / n), q=0.5)
    low = bandnoise(n, lambda k: 160, q=0.7)
    return [(noise[k] * 1.2 + low[k] * 1.5) * math.sin(math.pi * k / n) ** 0.7 for k in range(n)]


def music(mix, dur, bpm=120, drums_until=None, stop=None, hit=None, intensity=None):
    """Dark-fantasy bed: low drone, staccato string ostinato in D minor, war-drum pulse.

    stop: time the bed cuts for the end-card hit; hit: the end-card impact time.
    intensity(t) -> 0..1 scales the drums.
    """
    beat = 60 / bpm
    stop = stop or dur
    # drone: two detuned saws through a low-pass, swelling in
    n = int(dur * SR)
    drone = dsp.summed(dsp.summed(dsp.saw(D2 * 0.5, n), dsp.saw(D2 * 0.5 * 1.004, n)), dsp.scaled(dsp.saw(A2 * 0.5, n), 0.5))
    drone = dsp.biquad(drone, dsp.lp(240, 0.9))
    for k in range(n):
        tt = k / SR
        env = min(1, tt / 0.6) * (1 if tt < stop else max(0.25, 1 - (tt - stop) / 0.5))
        drone[k] *= 0.20 * env
    mix.put(0, drone, 1.0)
    # ostinato: 8th notes, staccato saw, two-bar pattern
    pat = [D3, D3, A3, D3, F3, D3, A3, D3, Bb3, D3, A3, D3, G3, D3, F3, E3]
    note_len = beat / 2
    k = 0
    tt = 0.0
    while tt < stop - 0.05:
        f = pat[k % len(pat)]
        m = int(0.22 * SR)
        s = dsp.summed(dsp.summed(dsp.saw(f, m), dsp.saw(f * 1.006, m)), dsp.scaled(dsp.saw(f / 2, m), 0.4))
        s = dsp.biquad(s, dsp.lp(1500 + 900 * (k % 4 == 0), 1.1))
        env = [min(1, j / 200) * math.exp(-j / (0.07 * SR)) for j in range(m)]
        acc = 1.0 if k % 4 == 0 else 0.7
        mix.put(tt, [a * b * acc for a, b in zip(s, env)], 0.10, pan=-0.35 if k % 2 else 0.35)
        k += 1
        tt += note_len
    # drums: boom on each beat, toms on the off-8ths in busy bars
    tt, i = 0.0, 0
    until = drums_until or stop
    while tt < until - 0.05:
        g = intensity(tt) if intensity else 1.0
        if g > 0.02:
            mix.put(tt, boom(100 if i % 4 == 0 else 85, 44, 0.5), 0.34 * g * (1.0 if i % 2 == 0 else 0.75))
            if i % 4 == 3:
                mix.put(tt + beat / 2, boom(150, 90, 0.18, 0.7), 0.16 * g, pan=0.3)
                mix.put(tt + beat * 0.75, boom(170, 100, 0.16, 0.7), 0.13 * g, pan=-0.3)
        tt += beat
        i += 1
    if hit is not None:
        mix.put(hit - 1.2, riser(1.2, 200, 4200), 0.16)
        mix.put(hit, impact(1.6), 0.42)
        mix.put(hit, boom(120, 38, 1.2, 0.8), 0.4)
        ch = chime([D4, F4, A4, D5], 3.0, 1.1)
        mix.put(hit + 0.05, ch, 0.13)
        # warm tail pad so the end card isn't silent
        from .synth import pad
        l, r = pad(dur - hit, [(0, [D3, F3, A3, D4])], volume=lambda x: 0.05 * min(1, x / 0.3))
        mix.put_stereo(hit, l, r)
