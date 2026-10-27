# ep56: edge-tts WordBoundary for every spoken line -> words.json {i: [[frame_offset_from_trimmed_line_start, word], ...]}
import asyncio, edge_tts, json, sys, subprocess, numpy as np
SRC, TTS, OUT = sys.argv[1:4]
S = json.load(open(SRC)); SR = 48000
def onset(i):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{TTS}/{i:02d}.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32); idx = np.nonzero(np.abs(x) > 0.01)[0]
    return max(0, idx[0] - int(0.03 * SR)) / SR
async def wb(t):
    out = []
    c = edge_tts.Communicate(t, 'vi-VN-NamMinhNeural', rate='+6%', boundary='WordBoundary')
    async for ch in c.stream():
        if ch['type'] == 'WordBoundary': out.append((ch['offset'] / 1e7, ch['text']))
    return out
async def main():
    res = {}
    for i, s in enumerate(S):
        for k in range(4):
            try: w = await wb(s[1]); break
            except Exception as e: print('retry', i, e); await asyncio.sleep(2)
        o = onset(i)
        res[i] = [[round((t - o) * 30), x] for t, x in w]
    json.dump(res, open(OUT, 'w'), ensure_ascii=False)
asyncio.run(main())
