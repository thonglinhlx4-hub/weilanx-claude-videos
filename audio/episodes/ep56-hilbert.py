# ep56-hilbert BGM: adapted from ep55-pi.py / ep54-hamso.py (same original numpy synthesis, 130 BPM, A minor), new section map.
# Scene hits / whooshes / riser hits are NOT here any more: they live on the separate SFX bus (ep56-hilbert-sfx.py).
# Section map (bars) follows src/episodes/ep56-hilbert/script.vi.json: hook 0-14 | one 15-23 | bus 24-43 | cantor 44-55 | twist 56-70 (build 67-70) | CLIMAX 71 | end/outro 72+
# Usage: python3 ep56-hilbert.py raw.wav voice_env.npy script.vi.json  (voice_env = RMS per 10 ms; used for ducking)
import numpy as np, wave, sys
import json
SR = 48000; BPM = 130; BEAT = 60 / BPM; BAR = 4 * BEAT
DUR = json.load(open(sys.argv[3]))['frames'] / 30; NBARS = int(np.ceil(DUR / BAR)) + 1
N = int(DUR * SR); out = np.zeros((N, 2))
rng = np.random.default_rng(56)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def env(n, a, d):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def add(sig, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i < 0: return
    s = sig[:N - i] * g; out[i:i + len(s), 0] += s * (1 - pan); out[i:i + len(s), 1] += s * (1 + pan)
def kick(g=1):
    n = int(0.45 * SR); t = np.arange(n) / SR; f = 45 + 110 * np.exp(-t * 30)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) + 0.12 * np.exp(-t * 300) * rng.standard_normal(n)) * g
def hat(d=0.04):
    n = int(0.15 * SR); x = np.diff(rng.standard_normal(n), prepend=0); return x * env(n, 0.001, d) * 0.16
def clap():
    n = int(0.3 * SR); t = np.arange(n) / SR
    return rng.standard_normal(n) * (np.exp(-t * 18) + 0.6 * np.exp(-((t - 0.012) % 0.011) * 400) * (t < 0.035)) * 0.3
def pad(midis, dur, g=0.12, bright=0.2):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in midis:
        for det in (-0.08, 0, 0.06):
            s += np.sin(2 * np.pi * mtof(m + det) * t) + bright * np.sin(2 * np.pi * 2 * mtof(m + det) * t)
    a = np.minimum(1, t / 0.8) * np.minimum(1, np.maximum(0, dur - t) / 0.8); return s * a * g / len(midis) / 3
def bell(m, d=2.0, g=0.22):
    n = int(d * SR); t = np.arange(n) / SR; f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 4)) * np.exp(-t * 2) * g
def pluck(m, d=0.4, g=0.1):
    n = int(d * SR); t = np.arange(n) / SR; f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.1 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 10) * g
def bass(m, d, g=0.3):
    n = int(d * SR); t = np.arange(n) / SR; return np.tanh(1.8 * np.sin(2 * np.pi * mtof(m) * t)) * env(n, 0.006, d * 0.55) * g
def riser(d, g=0.3):
    n = int(d * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    x = np.diff(x, prepend=0) * (t / d) ** 2.2; return x * g
def boom(g=1.0):
    n = int(3.5 * SR); t = np.arange(n) / SR; f = 28 + 90 * np.exp(-t * 7)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.1) * g
def crash():
    n = int(3.5 * SR); t = np.arange(n) / SR; x = rng.standard_normal(n); return np.diff(x, prepend=0) * np.exp(-t * 1.3) * 0.28
def swoosh(d=0.6, g=0.2):
    n = int(d * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    from numpy.fft import rfft, irfft
    return x * np.sin(np.pi * t / d) ** 2 * g

# A minor colour, original progression: Am - F - C - Em  /  climax: F - G - Am - C
CH = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [52, 55, 59]]
ROOT = [33, 29, 36, 28]
ARP = [[69, 72, 76, 72, 81, 76], [65, 69, 72, 69, 77, 72], [67, 72, 76, 72, 79, 76], [64, 67, 71, 67, 76, 71]]
CHC = [[53, 57, 60, 65], [55, 59, 62, 67], [57, 60, 64, 69], [55, 60, 64, 67]]
ROOTC = [29, 31, 33, 36]
CLIMAX = int(round(json.load(open(sys.argv[3]))['scenes']['climax'] / 30 / BAR))
# ep56 map: intro 0-1 | soft hook 2-14 | groove one/bus 15-43 (soft 24-25) | sparse cantor 44-49 | groove 50-55 | soft twist 56-66 | build 67-70 | CLIMAX | outro
def section(bar):
    if bar < 2: return 'intro'
    if bar < 15: return 'soft'
    if 24 <= bar < 26: return 'soft'
    if 44 <= bar < 50: return 'sparse'
    if 56 <= bar < CLIMAX - 4: return 'soft'
    if CLIMAX - 4 <= bar < CLIMAX: return 'build'
    if bar == CLIMAX: return 'climax'
    if bar > CLIMAX: return 'outro'
    return 'groove'
for bar in range(NBARS):
    t0 = bar * BAR; k = bar % 4; c = CH[k]; r = ROOT[k]; ar = ARP[k]; s = section(bar)
    if s == 'intro':
        add(pad(c, BAR + 0.8, 0.07), t0)
        for j in range(8): add(pluck(ar[j % 6] + 12 * (j % 2), 0.5, 0.035), t0 + j * BEAT / 2, pan=0.4 * (-1) ** j)
        continue
    if s == 'sparse':
        add(pad(c, BAR + 0.8, 0.06, 0.1), t0)
        add(bell(ar[0] + 12, 1.6, 0.08), t0, pan=-0.3); add(bell(ar[2] + 12, 1.6, 0.06), t0 + 2 * BEAT, pan=0.3)
        add(bass(r, BAR * 0.9, 0.12), t0)
        continue
    if s == 'climax' or s == 'outro':
        cc = CHC[(bar - CLIMAX) % 4]; rr = ROOTC[(bar - CLIMAX) % 4]
        fade = 1.0 if s == 'climax' else max(0.0, 1 - (bar - CLIMAX - 1) / 9.0)
        add(pad(cc, BAR + 1.0, 0.13 * fade, 0.35), t0)
        add(bass(rr, BAR * 0.95, 0.3 * fade), t0)
        for j in range(16): add(pluck(cc[j % 4] + 24, 0.35, 0.05 * fade), t0 + j * BEAT / 4, pan=0.5 * np.sin(j))
        if s == 'climax':
            for b in range(4): add(kick(0.9), t0 + b * BEAT)
        else:
            add(bell(cc[-1] + 12, 3, 0.12 * fade), t0)
        continue
    # groove / soft / build
    pg = 0.09 if s != 'soft' else 0.07
    add(pad(c, BAR + 0.8, pg), t0)
    add(bass(r, BEAT * 1.6, 0.26), t0); add(bass(r, BEAT * 0.8, 0.18), t0 + 2.5 * BEAT); add(bass(r + 12, BEAT * 0.8, 0.12), t0 + 3 * BEAT)
    for j in range(8):
        add(pluck(ar[j % 6], 0.4, 0.06), t0 + j * BEAT / 2, pan=0.35 * (-1) ** j)
    if s == 'soft':
        add(kick(0.5), t0)
        for b in range(4): add(hat(0.025), t0 + b * BEAT + BEAT / 2, 0.6, 0.2)
        continue
    for b in range(4):
        add(kick(0.75 if b in (0, 2) else 0.5), t0 + b * BEAT)
        add(hat(), t0 + b * BEAT + BEAT / 2, 1, 0.25)
    add(clap(), t0 + BEAT); add(clap(), t0 + 3 * BEAT)
    if s == 'build':
        prog_b = (bar - (CLIMAX - 4)) / 4
        for j in range(8): add(hat(0.02), t0 + j * BEAT / 2, 0.6 + prog_b, -0.25)
# pre-climax: riser over bars 75-76, hard breath (silence) last ~0.7 s, 3-frame freeze covered by silence
tc = CLIMAX * BAR
add(riser(2 * BAR - 0.7, 0.15), tc - 2 * BAR)
i0 = int((tc - 0.70) * SR); i1 = int(tc * SR)
ramp = np.linspace(1, 0, int(0.06 * SR))
out[i0:i0 + len(ramp)] *= ramp[:, None]; out[i0 + len(ramp):i1] = 0
add(bell(81, 3.5, 0.2), tc)
# ending tail fade
tail = int(3.0 * SR); out[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 1.5
# ducking under voice (volume automation, 10 ms resolution, attack 40 ms / release 350 ms)
if len(sys.argv) > 2:
    e = np.load(sys.argv[2]); g = np.ones(len(e)); lvl = 0.0
    for i, x in enumerate(e):
        tgt = 1.0 if x > 0.01 else 0.0
        lvl += (tgt - lvl) * (0.25 if tgt > lvl else 0.03)
        g[i] = 1 - 0.55 * lvl
    gs = np.interp(np.arange(N), np.arange(len(g)) * 480, g)
    out *= gs[:, None]
out /= max(1e-6, np.max(np.abs(out))) / 0.9
w = wave.open(sys.argv[1], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((out * 32767).astype(np.int16).tobytes()); w.close()
print('bgm', DUR)
