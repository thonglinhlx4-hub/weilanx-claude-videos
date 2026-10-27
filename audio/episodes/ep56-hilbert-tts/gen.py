# ep56 TTS: every line of script.src.json -> OUT/NN.mp3 (edge-tts vi-VN-NamMinhNeural, +6%). Run with proxy env unset.
import asyncio, json, os, sys, edge_tts
SRC, OUT = sys.argv[1], sys.argv[2]
S = json.load(open(SRC))
async def one(i, txt):
    fn = f'{OUT}/{i:02d}.mp3'
    if os.path.exists(fn) and os.path.getsize(fn) > 1000: return
    for k in range(4):
        try:
            await edge_tts.Communicate(txt, 'vi-VN-NamMinhNeural', rate='+6%').save(fn); return
        except Exception as e:
            print('retry', i, e); await asyncio.sleep(2)
async def main():
    sem = asyncio.Semaphore(6)
    async def w(i, t):
        async with sem: await one(i, t)
    await asyncio.gather(*[w(i, s[1]) for i, s in enumerate(S)])
asyncio.run(main()); print('ok', len(S))
