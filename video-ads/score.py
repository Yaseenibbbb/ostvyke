"""Cue sheets for the three ads. Times come from out/adN/cues.json, written by the renderer
from the same timeline the picture uses, so sound cannot drift from picture.

    python3 score.py 1|2|3   -> out/adN/mix.wav (-14 LUFS)
"""
import json
import sys

from sfx.mix import Mix
from sfx.synth import whoosh, pop, blip, click, riser, chime
from sfx import game as G
from sfx.game import D4, F4, A4, D5, F5, A5, D6

ad = sys.argv[1]
cues = json.load(open(f"out/ad{ad}/cues.json"))
T = cues["T"]
DUR = T["dur"]
mix = Mix(DUR, seed=int(ad) * 7)
scale = [D5, F5, A5, D6, D6 * 1.19]


def gem_events(evs, gain=0.22):
    for e in evs:
        p = min(len(scale) - 1, e["depth"])
        mix.put(e["t"], G.shatter(2200 + 400 * e["depth"], 6 + e["n"]), gain * min(1.6, 0.8 + e["n"] * 0.1), pan=0.0)
        mix.put(e["t"] + 0.02, blip(scale[p], 0.4, 0.14), 0.12)


if ad == "1":
    G.music(mix, DUR, stop=T["end"] - 0.15, hit=T["end"],
            intensity=lambda t: 0.0 if T["atk"] + 0.1 < t < T["atk"] + 0.6 else (0.55 if t < 1.9 else 1.0))
    for s in cues["swaps"]:
        mix.put(s - 0.02, whoosh(0.22, 900, 2600, 0.5), 0.10)
    gem_events(cues["events"])
    for h in cues["hits"]:
        mix.put(h["t"], G.boom(140, 70, 0.3, 0.6), 0.22)
    mix.put(T["atk"] - 0.25, G.heartbeat(), 0.35)
    mix.put(T["atk"] + 0.05, whoosh(0.35, 3000, 600, 0.3), 0.30)
    mix.put(T["atk"] + 0.12, G.boom(80, 34, 0.9, 0.9), 0.42)
    mix.put(T["atk"] + 0.1, G.clang(330, 1.0), 0.12)
    mix.put(T["spell"], pop(300, 900, 0.2), 0.22)
    mix.put(T["spell"] + 0.02, chime([D5, A5], 1.0, 0.4), 0.08)
    mix.put(T["boltT"] - 0.5, riser(0.5, 400, 6000), 0.12)
    mix.put(T["boltT"], G.crackle(0.7), 0.32)
    mix.put(T["boltT"] + 0.06, G.boom(110, 36, 1.0, 1.0), 0.45)
    kill = cues["hits"][-1]["t"]
    mix.put(kill, G.boom(130, 36, 1.0, 1.0), 0.40)
    mix.put(kill, G.clang(520, 1.4), 0.14)
    mix.put(kill + 0.05, chime([D4, A4, D5], 1.4, 0.5), 0.10)

elif ad == "2":
    G.music(mix, DUR, stop=T["end"] - 0.15, hit=T["end"],
            intensity=lambda t: 0.0 if t < T["sweep"] else 1.0)
    for i in range(3):
        mix.put(0.05 + i * 0.62, G.heartbeat(), 0.42 - i * 0.04)
    mix.put(T["cards"], whoosh(0.4, 500, 2400, 0.6), 0.2)
    mix.put(T["cards"] + 0.25, click(1400), 0.1, pan=-0.4)
    mix.put(T["cards"] + 0.3, click(1600), 0.1, pan=0.4)
    mix.put(T["flip"], whoosh(0.25, 1500, 4000, 0.5), 0.14)
    mix.put(T["flip"] + 0.16, chime([D5, F5, A5], 1.6, 0.6), 0.14)
    mix.put(T["slam"], G.boom(110, 40, 0.8, 0.9), 0.40)
    mix.put(T["sweep"] - 0.5, riser(0.5, 300, 5000), 0.12)
    mix.put(T["sweep"], G.fire(1.1), 0.30)
    for i, b in enumerate(sorted(cues["breaks"])):
        mix.put(b, G.stone(), 0.12, pan=-0.5 + (i % 4) * 0.33)
    mix.put(T["swap"] - 0.02, whoosh(0.22, 900, 2600, 0.5), 0.10)
    gem_events(cues["events"])
    for h in cues["hits"]:
        mix.put(h["t"], G.boom(140, 70, 0.3, 0.6), 0.22)
    for i in range(3):
        mix.put(T["hand"] + 0.12 + i * 0.16, pop(400 + i * 120, 1200 + i * 200, 0.18), 0.18, pan=-0.6 + i * 0.6)
        mix.put(T["hand"] + 0.14 + i * 0.16, blip([D5, F5, A5][i], 0.4, 0.15), 0.08, pan=-0.6 + i * 0.6)

else:
    G.music(mix, DUR, stop=T["end"] - 0.15, hit=T["end"],
            intensity=lambda t: 0.35 if t < T["b1"] - 0.1 else 1.0)
    mix.put(0.0, riser(1.9, 120, 2500), 0.12)
    mix.put(0.12, G.clang(610, 1.8), 0.13)
    mix.put(0.15, G.boom(90, 34, 1.0, 0.7), 0.34)
    for k in ["b1", "b2", "b3"]:
        mix.put(T[k] - 0.2, whoosh(0.3, 600, 3000, 0.7), 0.20)
        mix.put(T[k] + 0.1, G.boom(115, 38, 0.9, 1.0), 0.42)
        mix.put(T[k] + 0.1, G.clang(380 if k != "b2" else 300, 1.2), 0.12)
    for i in range(3):
        mix.put(T["lineup"] - 0.1 + i * 0.1, pop(350 + i * 100, 1100, 0.18), 0.16, pan=-0.6 + i * 0.6)
    gem_events(cues["events"])
    mix.put(T["crypt"] - 0.15, whoosh(0.4, 400, 2000, 0.6), 0.18)
    mix.put(T["crypt"] + 0.1, chime([D4, F4, A4], 1.8, 0.7), 0.12)

print(mix.master(-14.0))
mix.write(f"out/ad{ad}/mix.wav")
print("wrote", f"out/ad{ad}/mix.wav")
