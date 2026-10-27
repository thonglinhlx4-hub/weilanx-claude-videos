# ep57 placement: decode + trim each TTS line, place back to back (0.25 s gap + per-line beats), snap scene starts UP to
# 130 BPM bar lines, and land the climax bar downbeat on "hai" of "hai phần ba" (line 20) after a 0.6 s held silence that is
# cut into the line just before "hai". Writes script.vi.json + words.json (shifted) + voice.wav (48 kHz mono).
# usage: place.py script.src.json TTSDIR words_raw.json out.json words_out.json voice.wav
import json, subprocess, sys, numpy as np, wave
SRC, TTS, WIN, OUTJ, WOUT, OUTW = sys.argv[1:7]
S = json.load(open(SRC)); WR = json.load(open(WIN))
SR = 48000; FPS = 30; BAR = 4 * 60 / 130; BF = BAR * FPS
def load(i):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{TTS}/{i:02d}.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    idx = np.nonzero(np.abs(x) > 0.01)[0]
    return x[max(0, idx[0] - int(0.03 * SR)):min(len(x), idx[-1] + int(0.08 * SR))]
aud = [load(i) for i in range(len(S))]
WD = {int(k): [list(w) for w in v] for k, v in WR.items()}
# --- climax: hold 0.6 s silence right before 'hai' (2nd 'hai'? line 20 has only one 'hai') ---
CL = 20; HOLD = 0.6
wi = [k for k, (t, w) in enumerate(WD[CL]) if w == 'hai'][0]
f_hai = WD[CL][wi][0]; f_prev = WD[CL][wi - 1][0]
x = aud[CL]; fr = 0.01
e = np.array([np.sqrt(np.mean(x[int(j * fr * SR):int((j + 1) * fr * SR)] ** 2) + 1e-12) for j in range(int(len(x) / SR / fr))])
lo, hi = int((f_prev / FPS + 0.18) / fr), int((f_hai / FPS + 0.03) / fr)
cut_t = (lo + int(np.argmin(e[lo:hi]))) * fr
cs = int(cut_t * SR); fade = int(0.012 * SR)
a, b = x[:cs].copy(), x[cs:].copy()
a[-fade:] *= np.linspace(1, 0, fade); b[:fade] *= np.linspace(0, 1, fade)
aud[CL] = np.concatenate([a, np.zeros(int(HOLD * SR), np.float32), b])
HOLDF = round(HOLD * FPS)
for w in WD[CL]:
    if w[0] / FPS >= cut_t - 0.02: w[0] += HOLDF
CLIMAX_OFF = WD[CL][wi][0]   # 'hai' after the hold (frames from line start)
GAP = 0.25
PAUSE = {0: 0.45, 1: 0.35, 2: 0.3, 3: 0.6, 4: 0.2, 5: 0.25, 6: 0.25, 7: 0.5, 8: 0.15, 9: 0.35, 10: 0.2, 11: 0.5, 12: 0.1, 13: 0.3,
         14: 0.2, 15: 0.2, 16: 0.5, 17: 0.2, 18: 0.35, 19: 0.5, 20: 0.35, 21: 0.3}
snapf = lambda f: int(np.ceil(f / BF - 1e-6) * BF + 0.5)
t = 0.5; scenes = {'hook': 0}; lines = []; prev = 'hook'
for i, s in enumerate(S):
    sc = s[0]
    if sc != prev or i == CL:
        key = sc if sc != prev else 'climax'
        if key == 'climax':
            st = snapf(t * FPS + CLIMAX_OFF); scenes['climax'] = st; t = (st - CLIMAX_OFF) / FPS
        else:
            st = snapf((t + 0.0) * FPS); scenes[key] = st; t = st / FPS + 0.3
            if sc == 'end':  # end scene starts with line 20 = climax line: re-snap so the climax downbeat lands on a bar
                st2 = snapf(t * FPS + CLIMAX_OFF); scenes['climax'] = st2; t = (st2 - CLIMAX_OFF) / FPS
        prev = sc
    d = len(aud[i]) / SR
    f0 = round(t * FPS); f1 = f0 + round(d * FPS)
    lines.append(dict(i=i, scene=sc, vi=s[2] if len(s) > 2 else s[1], spoken=s[1], f0=f0, f1=f1, start=round(f0 / FPS, 3), end=round(f1 / FPS, 3)))
    t = f1 / FPS + GAP + PAUSE.get(i, 0)
frames = int(lines[-1]['f1'] + 3.6 * FPS)
out = dict(fps=FPS, bar=BAR, total=round(frames / FPS, 3), frames=frames, scenes=scenes, climax_line=CL, climax_hold=HOLD, cut_t=round(cut_t, 3), lines=lines)
json.dump(out, open(OUTJ, 'w'), ensure_ascii=False, indent=1)
json.dump({str(k): v for k, v in WD.items()}, open(WOUT, 'w'), ensure_ascii=False)
v = np.zeros(int(frames / FPS * SR) + SR)
for i, l in enumerate(lines):
    a0 = int(l['f0'] / FPS * SR); v[a0:a0 + len(aud[i])] += aud[i]
w = wave.open(OUTW, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(v[:int(frames / FPS * SR)], -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
print('frames', frames, frames / FPS, scenes, 'cut', cut_t, 'climax_off', CLIMAX_OFF)
for l in lines: print(l['i'], l['scene'], l['f0'], l['f1'], l['f1'] - l['f0'], l['vi'][:50])
