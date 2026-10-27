# ep53-compound BGM v3: 120 BPM, 1 bar = 2.0 s = 60 frames @30fps, 82 s total (41 bars). Pure synthesis.
# Hook landing: bar 2 (4.0 s). Anchor word: bar 10 (20.0 s). Person insert (hard cut, sparse): bars 14-15 (28-32 s).
# Table: bar 16 (32 s). 3D wave chart: bars 22-23 (44-48 s). History (soft): bars 24-29.
# Riser bars 30-31, hard breath 63.3-64.0 s, CLIMAX downbeat bar 32 = 64.0 s (frame 1920). Outro bars 36-40.
# Usage: python3 ep53-compound.py out_raw.wav   (then loudnorm to ~-13 LUFS with ffmpeg)
import numpy as np, wave, sys
SR = 44100; BPM = 120; BEAT = 60 / BPM; BAR = 4 * BEAT; NBARS = 41; DUR = NBARS * BAR
N = int(DUR * SR); out = np.zeros((N, 2))
rng = np.random.default_rng(53)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def env(n, a, d):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def add(sig, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N: return
    s = sig[:N - i] * g; out[i:i + len(s), 0] += s * (1 - pan); out[i:i + len(s), 1] += s * (1 + pan)
def kick(g=1):
    n = int(0.5 * SR); t = np.arange(n) / SR; f = 42 + 120 * np.exp(-t * 32); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t * 7) + 0.15 * np.exp(-t * 300) * rng.standard_normal(n)) * g
def hat(d=0.05):
    n = int(0.2 * SR); x = np.diff(rng.standard_normal(n), prepend=0); return x * env(n, 0.001, d) * 0.22
def snare():
    n = int(0.35 * SR); t = np.arange(n) / SR
    return rng.standard_normal(n) * np.exp(-t * 16) * 0.45 + np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25) * 0.4
def pad(midis, dur, g=0.12):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in midis:
        for det in (-0.07, 0, 0.07):
            s += np.sin(2 * np.pi * mtof(m + det) * t) + 0.25 * np.sin(2 * np.pi * 2 * mtof(m + det) * t)
    a = np.minimum(1, t / 0.7) * np.minimum(1, np.maximum(0, dur - t) / 0.7); return s * a * g / len(midis) / 3
def bell(m, d=1.8, g=0.25):
    n = int(d * SR); t = np.arange(n) / SR; f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)) * np.exp(-t * 2.2) * g
def pluck(m, d=0.45, g=0.12):
    n = int(d * SR); t = np.arange(n) / SR; f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 9) * g
def bass(m, d, g=0.33):
    n = int(d * SR); t = np.arange(n) / SR; return np.tanh(2 * np.sin(2 * np.pi * mtof(m) * t)) * env(n, 0.005, d * 0.6) * g
def riser(d, g=0.3):
    n = int(d * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    x = (x + np.diff(x, prepend=0) * t / d) * (t / d) ** 2; return x * g
def boom(g=1.0):
    n = int(3 * SR); t = np.arange(n) / SR; f = 30 + 85 * np.exp(-t * 8)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2) * g
def crash():
    n = int(3 * SR); t = np.arange(n) / SR; x = rng.standard_normal(n); return np.diff(x, prepend=0) * np.exp(-t * 1.5) * 0.33

# D minor-ish: Dm Bb F C
CH = [[62, 65, 69], [58, 62, 65], [53, 57, 60], [60, 64, 67]]
ROOT = [38, 34, 41, 36]
ARP = [[74, 77, 81, 77], [70, 74, 77, 74], [69, 72, 77, 72], [72, 76, 79, 76]]
CLIMAX_BAR = 32
for bar in range(NBARS):
    t0 = bar * BAR; c = CH[bar % 4]; r = ROOT[bar % 4]; ar = ARP[bar % 4]
    if bar < 2:  # intro 0-4 s
        add(pad(c, BAR + 0.7, 0.08), t0)
        for k in range(4): add(pluck(ar[k], 0.6, 0.05), t0 + k * BEAT, pan=0.3 * (-1) ** k)
        if bar == 1: add(riser(BAR, 0.14), t0)
        continue
    if bar >= 36:  # outro: calm, sparse
        if bar == NBARS - 1:
            add(pad([50, 62, 65, 69], 2.0, 0.1), t0); add(bell(86, 2.0, 0.18), t0); continue
        add(pad(c, BAR + 0.7, 0.1), t0); add(bell(c[-1] + 12, 1.6, 0.1), t0)
        add(kick(0.45), t0); add(bass(r, BAR * 0.9, 0.18), t0)
        for k in range(4): add(pluck(ar[k], 0.6, 0.06), t0 + k * BEAT, pan=0.3 * (-1) ** k)
        continue
    soft = 24 <= bar <= 29            # history beat
    person = bar in (14, 15)          # real-person insert: drums drop out, pad + plucks only
    full = (10 <= bar <= 23 and not person) or (CLIMAX_BAR <= bar <= 35)
    if person:
        add(pad(c, BAR + 0.7, 0.11), t0); add(bass(r, BAR * 0.9, 0.2), t0)
        for k in range(4): add(pluck(ar[k], 0.6, 0.07), t0 + k * BEAT, pan=0.3 * (-1) ** k)
        if bar == 14: add(boom(0.35), t0); add(bell(81, 2.4, 0.26), t0)
        continue
    add(pad(c, BAR + 0.7, 0.1 if not bar >= CLIMAX_BAR else 0.13), t0)
    add(kick(1.0 if bar != CLIMAX_BAR else 1.25), t0)
    add(bass(r, BEAT * 1.8), t0); add(bass(r, BEAT * 1.8, 0.24), t0 + 2 * BEAT)
    if full: add(kick(0.7), t0 + 2 * BEAT)
    for k in range(8):
        tt = t0 + k * BEAT / 2
        if bar == CLIMAX_BAR - 1 and tt >= 63.3: continue
        add(pluck(ar[k % 4] + (12 if k % 2 else 0), 0.35, 0.07 if soft else 0.05), tt, pan=0.25 * (-1) ** k)
        if not soft: add(hat(0.03 if k % 2 else 0.06), tt, 0.55 if full else 0.32, pan=0.3 * (-1) ** k)
    if full:
        add(snare(), t0 + BEAT, 0.38)
        if not (bar == CLIMAX_BAR - 1): add(snare(), t0 + 3 * BEAT, 0.38)
    if bar == 2: add(bell(81, 2.0, 0.3), t0); add(crash(), t0, 0.5)      # hook landing 4 s
    if bar == 10: add(boom(0.55), t0); add(crash(), t0, 0.45); add(bell(86, 2.2, 0.25), t0)  # LÃI KÉP 20 s
    if bar == 16: add(crash(), t0, 0.3); add(kick(0.8), t0)               # table 32 s
    if bar == 22: add(crash(), t0, 0.28); add(bell(86, 2.0, 0.2), t0)     # 3D wave chart 44 s
    if bar == 24: add(bell(74, 2.5, 0.25), t0)                             # history 48 s
    if bar in (30, 31): add(riser(BAR, 0.12 + 0.08 * (bar - 30)), t0)
    if bar == CLIMAX_BAR:
        add(boom(1.0), t0); add(crash(), t0, 0.9); add(pad([50, 62, 65, 69, 74], 4, 0.2), t0); add(bell(86, 2.5, 0.35), t0)
# breath: hard duck 63.3-64.0 s (just before the climax downbeat)
a = int(63.3 * SR); b = int(64.0 * SR); g = np.linspace(1, 0, int(0.12 * SR))
out[a:a + len(g)] *= g[:, None]; out[a + len(g):b] *= 0
fl = int(2.5 * SR); out[-fl:] *= np.linspace(1, 0, fl)[:, None]
out = np.tanh(out * 1.2); out /= np.max(np.abs(out)) * 1.12
pcm = (out * 32767).astype('<i2')
w = wave.open(sys.argv[1], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', DUR)
