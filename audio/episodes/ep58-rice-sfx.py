# ep58-rice SFX bus (= ep57-monty-sfx.py + 'grain' and 'hitHuge'): every event in src/episodes/ep58-rice/sfx58.ts (dumped to JSON).
# Punchier than ep54 (user feedback 2026-10-20): real whooshes on transitions, layered hits/booms on reveals, crisp ticks on digits,
# a long riser into the climax. The bus is ducked ~3.5 dB under speech (voice_env) so the voice stays clear.
# Usage: python3 ep58-rice-sfx.py sfx.json voice_env.npy out.wav
import json, sys, wave, numpy as np
from scipy.signal import butter, sosfilt
J = json.load(open(sys.argv[1])); SR = 48000
N = int(J['frames'] / 30 * SR) + SR
out = np.zeros((N, 2))
rng = np.random.default_rng(5801)
def T(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, fc, o=2): return sosfilt(butter(o, fc, 'highpass', fs=SR, output='sos'), x)
def lp(x, fc, o=2): return sosfilt(butter(o, fc, 'lowpass', fs=SR, output='sos'), x)
def put(sig, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if sig.ndim == 1: sig = np.stack([sig * (1 - pan), sig * (1 + pan)], 1)
    s = sig[:max(0, N - i)] * g; out[i:i + len(s)] += s
def sweep_noise(d, f0, f1, q=0.5):
    # time-varying band-pass: crossfade 24 short filtered blocks
    n = int(d * SR); x = rng.standard_normal(n); y = np.zeros(n); B = 24
    for b in range(B):
        fc = f0 * (f1 / f0) ** (b / (B - 1)); lo, hi = fc * (1 - q / 2), min(fc * (1 + q / 2), SR / 2 - 100)
        w = np.clip(1 - np.abs(np.arange(n) / n * (B - 1) - b), 0, 1)
        y += bp(x, max(30, lo), hi) * w
    return y
def whoosh(d=0.8, strong=1.0):
    t = T(d); n = len(t); env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * np.exp(-((t / d - 0.62) ** 2) * 3)
    y = sweep_noise(d, 300, 4200, 0.9) * env * 1.6
    y += np.sin(2 * np.pi * np.cumsum(70 + 90 * (t / d)) / SR) * env * 0.35  # low body
    pan = np.linspace(-0.7, 0.7, n)
    return np.stack([y * (1 - pan), y * (1 + pan)], 1) * strong
def boom(d=2.2, f0=120, f1=32, g=1.0):
    t = T(d); f = f1 + (f0 - f1) * np.exp(-t * 9)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) * g
def click(fc=2600, d=0.03, g=1.0):
    t = T(d); return (np.sin(2 * np.pi * fc * t) * np.exp(-t * 180) + 0.5 * hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 400)) * g
def bell(fr, d=1.6, g=0.5):
    t = T(d); return (np.sin(2 * np.pi * fr * t) + 0.35 * np.sin(2 * np.pi * fr * 2.76 * t) * np.exp(-t * 5) + 0.2 * np.sin(2 * np.pi * fr * 5.4 * t) * np.exp(-t * 9)) * np.exp(-t * 2.4) * g
def crash(d=3.0, g=0.5):
    t = T(d); return hp(rng.standard_normal(len(t)), 2500) * (np.exp(-t * 1.5) * 0.8 + np.exp(-t * 18) * 0.6) * g
def transient(g=1.0):
    t = T(0.12); return hp(rng.standard_normal(len(t)), 900) * np.exp(-t * 60) * g
def hit(big=True):
    s = boom(2.6 if big else 1.6, 140 if big else 160, 30 if big else 40, 1.0 if big else 0.7)
    s = s + np.pad(transient(0.9 if big else 0.6), (0, len(s) - int(0.12 * SR)))
    th = boom(0.5, 260, 120, 0.5); s[:len(th)] += th
    b = bell(880, 2.4, 0.22) + bell(1318.5, 2.4, 0.14) if big else bell(1318.5, 1.6, 0.16)
    s[:len(b)] += b
    if big: c = crash(2.4, 0.35); s[:len(c)] += c
    return s
def shimmer(d=1.2, g=0.4):
    n = int(d * SR); y = np.zeros(n + SR)
    for k in range(int(d * 14)):
        t0 = rng.random() * d; fr = 2000 + rng.random() * 4000
        b = bell(fr, 0.5, 0.06); i = int(t0 * SR); y[i:i + len(b)] += b * np.sin(np.pi * t0 / d)
    return y * g / 0.4
def zip_(d=0.5):
    t = T(max(0.12, d)); return sweep_noise(len(t) / SR, 900, 3200, 0.6) * np.sin(np.pi * t / t[-1]) * 0.9
def roll(d=3.0):
    t = T(d); x = lp(rng.standard_normal(len(t)), 220) * 3.0
    env = np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.5) * (0.75 + 0.25 * np.sin(2 * np.pi * 5.5 * t))
    return x * env * 0.7 + boom(d, 60, 45, 0.15) * env
def swell(d=1.2):
    t = T(d); env = np.sin(np.pi * t / d) ** 2
    return sum(np.sin(2 * np.pi * fr * t) for fr in (220, 277.2, 329.6, 440)) * env * 0.12
def riser(d):
    t = T(d); u = t / d
    y = sweep_noise(d, 400, 6000, 0.7) * u ** 2.2 * 1.5
    y += np.sin(2 * np.pi * np.cumsum(110 * 2 ** (u * 3.2)) / SR) * u ** 2 * 0.25
    cut = int((d - 0.32) * SR); y[cut:] *= np.linspace(1, 0, len(y) - cut) ** 6  # short breath before the downbeat
    return y
def climax():
    s = boom(3.6, 150, 26, 1.25)
    tr = transient(1.1); s[:len(tr)] += tr
    c = crash(3.4, 0.55); s[:len(c)] += c
    for fr, g in ((440, 0.2), (659.3, 0.16), (880, 0.14), (1318.5, 0.1)):
        b = bell(fr, 3.4, g); s[:len(b)] += b
    return s
def grain():
    # rice grains landing on glass: 3-5 tiny glassy clicks within ~70 ms
    s = np.zeros(int(0.35 * SR))
    for k in range(3 + int(rng.random() * 3)):
        i = int((k * 0.018 + rng.random() * 0.012) * SR); c = click(3800 + rng.random() * 1800, 0.03, 0.5) + bell(4200 + rng.random() * 1500, 0.03, 0.15)[:int(0.03 * SR)]
        s[i:i + len(c)] += c * (1 - 0.15 * k)
    b = bell(2637, 0.3, 0.12); s[:len(b)] += b
    return s
def hitHuge():
    s = hit(True); sub = boom(3.2, 90, 24, 0.9); s = np.pad(s, (0, max(0, len(sub) - len(s)))); s[:len(sub)] += sub
    return s
def bellEnd():
    s = bell(659.3, 4, 0.22); s2 = bell(987.8, 4, 0.14); s[:len(s2)] += s2; return s
for e in J['sfx']:
    t = e['f'] / 30; g = e['g']; k = e['k']; d = e.get('d') or 1.0
    if k == 'whoosh': put(whoosh(d), t, g)
    elif k == 'whooshS': put(whoosh(d, 0.6), t, g)
    elif k == 'boomS': put(boom(1.6, 100, 38, 0.6), t, g)
    elif k == 'hitBig': put(hit(True), t, g)
    elif k == 'hitMed': put(hit(False), t, g)
    elif k == 'tick': put(click(2600, 0.03, 0.55), t, g, pan=(rng.random() - 0.5) * 0.4)
    elif k == 'tickHi': put(click(3400, 0.035, 0.7) + np.pad(bell(1760, 0.035, 0.0), (0, 0))[:int(0.035 * SR)], t, g)
    elif k == 'ding': put(bell(1568, 1.3, 0.35), t, g)
    elif k == 'pluck': put(bell(880, 0.7, 0.3) * np.exp(-T(0.7) * 3), t, g)
    elif k == 'shimmer': put(shimmer(d), t, g)
    elif k == 'zip': put(zip_(d), t, g)
    elif k == 'roll': put(roll(d), t, g)
    elif k == 'swell': put(swell(d), t, g)
    elif k == 'riser': put(riser(d), t, g)
    elif k == 'climax': put(climax(), t, g)
    elif k == 'bellEnd': put(bellEnd(), t, g)
    elif k == 'grain': put(grain(), t, g, pan=(rng.random() - 0.5) * 0.3)
    elif k == 'hitHuge': put(hitHuge(), t, g)
    else: raise SystemExit('unknown sfx ' + k)
# duck ~3.5 dB under speech (attack 30 ms, release 300 ms)
e = np.load(sys.argv[2]); gg = np.ones(len(e)); lvl = 0.0
for i, x in enumerate(e):
    tgt = 1.0 if x > 0.01 else 0.0
    lvl += (tgt - lvl) * (0.3 if tgt > lvl else 0.035)
    gg[i] = 1 - 0.33 * lvl
out *= np.interp(np.arange(N), np.arange(len(gg)) * 480, gg)[:, None]
out = out[:int(J['frames'] / 30 * SR)]
out /= max(1e-6, np.max(np.abs(out))) / 0.95
w = wave.open(sys.argv[3], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((out * 32767).astype(np.int16).tobytes()); w.close()
print('sfx events', len(J['sfx']))
