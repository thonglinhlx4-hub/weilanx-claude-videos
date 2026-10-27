# ep58 placement: decode + trim each TTS line, place back to back (0.25 s gap + per-line beats), snap scene starts UP to
# 130 BPM bar lines; the climax (line 17 "mười" = 18 tỷ tỷ hạt, right after the 2^64 proof pause) is snapped to a bar downbeat.
# Writes script.vi.json + words.json + voice.wav (48 kHz mono).
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
CL = 17
CLIMAX_OFF = [w for w in WD[CL] if w[1] == 'mười'][0][0]
GAP = 0.3
# beats: after the hook, after "Nhà vua bật cười", after "Vua vẫn trả được", before the last-square reveal, the proof hold (line 16), Earth lines
PAUSE = {0: 0.6, 1: 1.4, 2: 0.3, 3: 0.6, 4: 0.8, 5: 1.3, 6: 0.5, 7: 0.8, 8: 0.8, 9: 0.8, 10: 1.6, 11: 0.7, 12: 0.9, 13: 0.7, 14: 0.8, 15: 1.0,
         16: 2.0, 17: 1.6, 18: 0.9, 19: 1.1, 20: 1.6, 21: 0.9, 22: 1.1}
snapf = lambda f: int(np.ceil(f / BF - 1e-6) * BF + 0.5)
t = 0.6; scenes = {'hook': 0}; lines = []; prev = 'hook'
for i, s in enumerate(S):
    sc = s[0]
    if sc != prev:
        st = snapf(t * FPS); scenes[sc] = st; t = st / FPS + 0.3; prev = sc
    if i == CL:
        st = snapf(t * FPS + CLIMAX_OFF); scenes['climax'] = st; t = (st - CLIMAX_OFF) / FPS
    d = len(aud[i]) / SR
    f0 = round(t * FPS); f1 = f0 + round(d * FPS)
    lines.append(dict(i=i, scene=sc, vi=s[2] if len(s) > 2 else s[1], spoken=s[1], f0=f0, f1=f1, start=round(f0 / FPS, 3), end=round(f1 / FPS, 3)))
    t = f1 / FPS + GAP + PAUSE.get(i, 0)
frames = int(lines[-1]['f1'] + 3.8 * FPS)
out = dict(fps=FPS, bar=BAR, total=round(frames / FPS, 3), frames=frames, scenes=scenes, climax_line=CL, lines=lines)
json.dump(out, open(OUTJ, 'w'), ensure_ascii=False, indent=1)
json.dump({str(k): v for k, v in WD.items()}, open(WOUT, 'w'), ensure_ascii=False)
v = np.zeros(int(frames / FPS * SR) + SR)
for i, l in enumerate(lines):
    a0 = int(l['f0'] / FPS * SR); v[a0:a0 + len(aud[i])] += aud[i]
w = wave.open(OUTW, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(v[:int(frames / FPS * SR)], -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
print('frames', frames, frames / FPS, scenes, 'climax_off', CLIMAX_OFF)
for l in lines: print(l['i'], l['scene'], l['f0'], l['f1'], l['f1'] - l['f0'], l['vi'][:50])
