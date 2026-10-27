# ep54 v2 placement: decode + trim each TTS line, keep the v1 timing for every old line, insert the extra history
# lines (src entries carrying {"before": i}) in chronological order, shift the rest by whole bars so later scene
# starts and the climax stay on 130 BPM bar lines. Writes script.vi.json + voice.wav (48 kHz mono, not normalised).
import json, subprocess, sys, numpy as np
SRC, OLD, TTS, OUTJ, OUTW = sys.argv[1:6]
S = json.load(open(SRC)); J = json.load(open(OLD))
SR = 48000; FPS = 30; BAR = J['bar']; BF = BAR * FPS
def load(i):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{TTS}/{i:02d}.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    e = np.abs(x) > 0.01; idx = np.nonzero(e)[0]
    a, b = max(0, idx[0] - int(0.03 * SR)), min(len(x), idx[-1] + int(0.08 * SR))
    return x[a:b]
aud = [load(i) for i in range(len(S))]
dur = [len(a) / SR for a in aud]
old = J['lines']; sc = dict(J['scenes'])
extra = {s[3]['before']: i for i, s in enumerate(S) if len(s) > 3 and isinstance(s[3], dict)}
GAP = 12
shift = 0; lines = [None] * len(S)
hist_end_old = sc['rule']
for i, l in enumerate(old):
    if l['scene'] != 'history' or i in (20, 21, 22, 23):
        pass
    if i in extra:
        k = extra[i]; f0 = l['f0'] + shift
        f1 = f0 + round(dur[k] * FPS)
        lines[k] = dict(i=k, scene='history', vi=S[k][2], spoken=S[k][1], f0=f0, f1=f1, inserted=True)
        shift += f1 + GAP - l['f0'] - shift + 0  # next old line starts GAP after the inserted one
        shift = f1 + GAP - l['f0']
    if l['f0'] >= hist_end_old: break
    lines[i] = dict(l, f0=l['f0'] + shift, f1=l['f0'] + shift + round(dur[i] * FPS))
# whole-bar shift for everything from the rule scene on
last = max(x['f1'] for x in lines if x)
n = 0
while round((round(sc['rule'] / BF) + n) * BF) - last < 60: n += 1
new_sc = {}
for k, v in sc.items():
    new_sc[k] = v if v < hist_end_old else round((round(v / BF) + n) * BF)
for i, l in enumerate(old):
    if l['f0'] >= hist_end_old:
        s0 = sc[l['scene']]; f0 = new_sc[l['scene']] + (l['f0'] - s0)
        lines[i] = dict(l, f0=f0, f1=f0 + round(dur[i] * FPS))
frames = new_sc['climax'] + (J['frames'] - sc['climax'])
# overlap check (chronological)
order = sorted(range(len(lines)), key=lambda i: lines[i]['f0'])
for a, b in zip(order, order[1:]):
    if lines[a]['f1'] > lines[b]['f0'] - 3: print('OVERLAP', a, b, lines[a]['f1'], lines[b]['f0'])
for i, l in enumerate(lines): l['i'] = i; l['start'] = round(l['f0'] / FPS, 3); l['end'] = round(l['f1'] / FPS, 3)
out = dict(fps=FPS, bar=BAR, total=round(frames / FPS, 3), frames=frames, scenes=new_sc, barsAdded=n, lines=lines)
json.dump(out, open(OUTJ, 'w'), ensure_ascii=False, indent=1)
v = np.zeros(int(frames / FPS * SR) + SR)
for i, l in enumerate(lines):
    a = int(l['f0'] / FPS * SR); v[a:a + len(aud[i])] += aud[i]
import wave
w = wave.open(OUTW, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(v[:int(frames / FPS * SR)], -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
print('bars added', n, 'frames', frames, new_sc)
for i in order: 
    l = lines[i]; od = (old[i]['f1'] - old[i]['f0']) if i < len(old) else None
    print(i, l['f0'], l['f1'], 'old dur', od, 'new', l['f1'] - l['f0'], l['vi'][:40])
