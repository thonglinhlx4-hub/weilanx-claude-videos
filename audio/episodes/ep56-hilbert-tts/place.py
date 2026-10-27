# ep56 placement: decode + trim each TTS line, place lines back to back (base gap + per-line pauses for animation beats),
# snap every scene start (and the climax line) UP to a 130 BPM bar line. Writes script.vi.json + voice.wav (48 kHz mono).
# usage: place.py script.src.json TTSDIR out.json voice.wav
import json, subprocess, sys, numpy as np, wave
SRC, TTS, OUTJ, OUTW = sys.argv[1:5]
S = json.load(open(SRC))
SR = 48000; FPS = 30; BAR = 4 * 60 / 130; BF = BAR * FPS
def load(i):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{TTS}/{i:02d}.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    idx = np.nonzero(np.abs(x) > 0.01)[0]
    return x[max(0, idx[0] - int(0.03 * SR)):min(len(x), idx[-1] + int(0.08 * SR))]
aud = [load(i) for i in range(len(S))]
GAP = 0.25
PAUSE = {0: 0.6, 1: 0.8, 2: 0.4, 3: 0.9, 4: 0.4, 5: 0.5, 6: 1.1, 7: 0.4, 8: 0.9, 9: 0.5, 10: 0.5, 11: 0.8, 12: 0.7, 13: 0.7,
         14: 0.7, 15: 0.8, 16: 0.5, 17: 0.6, 18: 0.4, 19: 0.7, 20: 0.5, 21: 0.9, 22: 0.6, 23: 0.3, 24: 0.5, 25: 0.7, 26: 0.9, 27: 0.5,
         28: 1.6, 29: 0.4, 30: 0.9}
CLIMAX_LINE = 28
# downbeat on 'vô' of 'một vô hạn lớn hơn' (WordBoundary offset 85 f after the trimmed line start)
CLIMAX_OFF = 85
snapf = lambda f: int(np.ceil(f / BF - 1e-6) * BF + 0.5)
t = 0.5; scenes = {'hook': 0}; lines = []; prev = 'hook'
for i, s in enumerate(S):
    sc = s[0]
    if sc != prev or i == CLIMAX_LINE:
        key = sc if sc != prev else 'climax'
        # climax: the bar downbeat lands on 'vô' (line 28)
        st = snapf((t + 0.15) * FPS) if key != 'climax' else snapf(t * FPS + CLIMAX_OFF)
        scenes[key] = st
        t = st / FPS + 0.4 if key != 'climax' else (st - CLIMAX_OFF) / FPS
        prev = sc
    d = len(aud[i]) / SR
    f0 = round(t * FPS); f1 = f0 + round(d * FPS)
    lines.append(dict(i=i, scene=sc, vi=s[2] if len(s) > 2 else s[1], spoken=s[1], f0=f0, f1=f1, start=round(f0 / FPS, 3), end=round(f1 / FPS, 3)))
    t = f1 / FPS + GAP + PAUSE.get(i, 0)
frames = int(lines[-1]['f1'] + 4.2 * FPS)
out = dict(fps=FPS, bar=BAR, total=round(frames / FPS, 3), frames=frames, scenes=scenes, lines=lines)
json.dump(out, open(OUTJ, 'w'), ensure_ascii=False, indent=1)
v = np.zeros(int(frames / FPS * SR) + SR)
for i, l in enumerate(lines):
    a = int(l['f0'] / FPS * SR); v[a:a + len(aud[i])] += aud[i]
w = wave.open(OUTW, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(v[:int(frames / FPS * SR)], -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
print('frames', frames, frames / FPS, scenes)
for l in lines: print(l['i'], l['scene'], l['f0'], l['f1'], l['f1'] - l['f0'], l['vi'][:50])
