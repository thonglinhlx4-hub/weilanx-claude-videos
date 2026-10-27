# ep55 mix: voice -> -16 LUFS; BGM (ducked by voice env) -> -27 LUFS; SFX bus (ducked ~3.5 dB under speech) with its loudest
# moment set to -16 LUFS momentary (ep54 hits sat inside the BGM, roughly 8-10 dB lower); sum -> linear gain to -14 LUFS ->
# alimiter, iterated until integrated -14.0 ±0.2 and true peak <= -1.2 dBTP. Writes D/mix.wav and copies it to public/audio/ep55-pi/.
# usage: mix.py WORKDIR REPO
import sys, subprocess, json, re, shutil, numpy as np
D, REPO = sys.argv[1:3]
def run(*a): return subprocess.run(a, capture_output=True, text=True)
def ebu(fn):
    r = run('ffmpeg', '-hide_banner', '-nostats', '-v', 'verbose', '-i', fn, '-af', 'ebur128=peak=true:framelog=verbose', '-f', 'null', '-').stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); tp = float(re.findall(r'Peak:\s+(-?[\d.inf]+) dBFS', r)[-1])
    M = [float(x) for x in re.findall(r' M:\s*(-?[\d.]+)', r)]
    return I, tp, (max(M) if M else None)
run('ffmpeg', '-v', 'error', '-y', '-i', f'{D}/voice.wav', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '1', f'{D}/voice_n.wav')
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{D}/voice_n.wav', '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'], capture_output=True).stdout, np.float32)
n = len(x) // 480; np.save(f'{D}/voice_env.npy', np.sqrt((x[:n * 480].reshape(n, 480) ** 2).mean(1)))
J = f'{REPO}/src/episodes/ep55-pi/script.vi.json'
r = run('python3', f'{REPO}/audio/episodes/ep55-pi.py', f'{D}/bgm_raw.wav', f'{D}/voice_env.npy', J); print(r.stdout.strip(), r.stderr[-500:])
run('ffmpeg', '-v', 'error', '-y', '-i', f'{D}/bgm_raw.wav', '-af', 'loudnorm=I=-27:TP=-3:LRA=11', '-ar', '48000', f'{D}/bgm_n.wav')
r = run('python3', f'{REPO}/audio/episodes/ep55-pi-sfx.py', f'{D}/sfx.json', f'{D}/voice_env.npy', f'{D}/sfx_raw.wav'); print(r.stdout.strip(), r.stderr[-800:])
_, _, Msfx = ebu(f'{D}/sfx_raw.wav')
gs = -16.0 - Msfx
print('sfx max momentary', Msfx, 'gain', round(gs, 2))
run('ffmpeg', '-v', 'error', '-y', '-i', f'{D}/sfx_raw.wav', '-af', f'volume={gs:.2f}dB', '-c:a', 'pcm_f32le', f'{D}/sfx_n.wav')
run('ffmpeg', '-v', 'error', '-y', '-i', f'{D}/voice_n.wav', '-i', f'{D}/bgm_n.wav', '-i', f'{D}/sfx_n.wav', '-filter_complex',
    '[0:a]aformat=channel_layouts=stereo[v];[v][1:a][2:a]amix=inputs=3:duration=first:normalize=0', '-c:a', 'pcm_f32le', f'{D}/sum.wav')
I0, tp0, _ = ebu(f'{D}/sum.wav'); print('sum', I0, tp0)
g = -14.0 - I0; lim = 0.80
for it in range(5):
    run('ffmpeg', '-v', 'error', '-y', '-i', f'{D}/sum.wav', '-af', f'volume={g:.2f}dB,aresample=192000,alimiter=limit={lim:.3f}:attack=1:release=60:level=false,aresample=48000', '-ar', '48000', '-c:a', 'pcm_s16le', f'{D}/mix.wav')
    I, tp, _ = ebu(f'{D}/mix.wav'); print('iter', it, 'gain', round(g, 2), 'lim', lim, '->', I, tp)
    # wav ceiling −2.3 dBTP: AAC encoding overshoots ~0.9 dB, so the delivered mp4s stay ≤ −1.2 dBTP
    ok = abs(I + 14) <= 0.2 and tp <= -2.3
    if ok: break
    if tp > -2.3: lim *= 10 ** ((-2.4 - tp) / 20)
    g += -14.0 - I
shutil.copy(f'{D}/mix.wav', f'{REPO}/public/audio/ep55-pi/mix.wav')
for k in ('voice_n', 'bgm_n', 'sfx_n'):
    print(k, ebu(f'{D}/{k}.wav'))
print('FINAL', I, tp, run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{D}/mix.wav').stdout.strip())
