#!/bin/bash
# ep54 mix: voice.wav -> -16 LUFS; BGM (ducked by voice env) -> -27 LUFS; amix -> -14 LUFS / TP -1.2 -> public/audio/ep54-hamso/mix.wav
set -e
D=$1; REPO=$(cd "$(dirname "$0")/../../.." && pwd)
ffmpeg -v error -y -i $D/voice.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -ac 1 $D/voice_n.wav
python3 - "$D" <<'PY'
import sys, numpy as np, subprocess
D=sys.argv[1]
raw=subprocess.run(['ffmpeg','-v','error','-i',f'{D}/voice_n.wav','-f','f32le','-ac','1','-ar','48000','-'],capture_output=True).stdout
x=np.frombuffer(raw,np.float32); n=len(x)//480
np.save(f'{D}/voice_env.npy', np.sqrt((x[:n*480].reshape(n,480)**2).mean(1)))
PY
python3 $REPO/audio/episodes/ep54-hamso.py $D/bgm_raw.wav $D/voice_env.npy
ffmpeg -v error -y -i $D/bgm_raw.wav -af loudnorm=I=-27:TP=-3:LRA=11 -ar 48000 $D/bgm_n.wav
ffmpeg -v error -y -i $D/voice_n.wav -i $D/bgm_n.wav -filter_complex "[0:a]aformat=channel_layouts=stereo[v];[v][1:a]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-14:TP=-1.2:LRA=11[o]" -map "[o]" -ar 48000 -c:a pcm_s16le $D/mix.wav
cp $D/mix.wav $REPO/public/audio/ep54-hamso/mix.wav
ffmpeg -hide_banner -i $D/mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
ffprobe -v error -show_entries format=duration -of csv=p=0 $D/mix.wav
