# ep52-margin BGM: 120 BPM, 1 bar = 2.0 s = 60 frames @30fps, 64 s total. Pure synthesis.
# Climax downbeat at 48.0 s (bar 24). Silence/breath 47.0-48.0.
import numpy as np, wave, sys
SR=44100; BPM=120; BEAT=60/BPM; BAR=4*BEAT; DUR=64.0
N=int(DUR*SR); out=np.zeros((N,2))
rng=np.random.default_rng(7)
def mtof(m): return 440*2**((m-69)/12)
def env(n,a,d): 
    t=np.arange(n)/SR; e=np.minimum(1,t/max(a,1e-4))*np.exp(-t/d); return e
def add(sig,t,g=1.0,pan=0.0):
    i=int(t*SR); 
    if i>=N: return
    s=sig[:N-i]*g; out[i:i+len(s),0]+=s*(1-pan)/1; out[i:i+len(s),1]+=s*(1+pan)/1
def kick(g=1):
    n=int(0.5*SR); t=np.arange(n)/SR; f=45+110*np.exp(-t*30); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*7)*g
def hat(d=0.05):
    n=int(0.2*SR); x=rng.standard_normal(n); x=np.diff(x,prepend=0); return x*env(n,0.001,d)*0.25
def snare():
    n=int(0.3*SR); t=np.arange(n)/SR; x=rng.standard_normal(n)*np.exp(-t*18)*0.5+np.sin(2*np.pi*190*t)*np.exp(-t*25)*0.4; return x
def pad(midis,dur,g=0.12):
    n=int(dur*SR); t=np.arange(n)/SR; s=np.zeros(n)
    for m in midis:
        for det in (-0.08,0,0.08):
            s+=np.sin(2*np.pi*mtof(m+det)*t)+0.3*np.sin(2*np.pi*2*mtof(m+det)*t)
    a=np.minimum(1,t/0.6)*np.minimum(1,(dur-t)/0.6); return s*a*g/len(midis)/3
def bell(m,d=1.8,g=0.25):
    n=int(d*SR); t=np.arange(n)/SR; f=mtof(m)
    return (np.sin(2*np.pi*f*t)+0.5*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*3))*np.exp(-t*2.2)*g
def bass(m,d,g=0.35):
    n=int(d*SR); t=np.arange(n)/SR; return np.tanh(2*np.sin(2*np.pi*mtof(m)*t))*env(n,0.005,d*0.6)*g
def riser(d,g=0.3):
    n=int(d*SR); t=np.arange(n)/SR; x=rng.standard_normal(n)
    # crude brightening: mix of diff noise growing
    x=(x+np.diff(x,prepend=0)*t/d)*(t/d)**2; return x*g
def boom():
    n=int(3*SR); t=np.arange(n)/SR; f=30+80*np.exp(-t*8)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*1.2)*1.0
def crash():
    n=int(3*SR); t=np.arange(n)/SR; x=rng.standard_normal(n); return np.diff(x,prepend=0)*np.exp(-t*1.5)*0.35
CH=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]  # Am F C G
ROOT=[33,29,36,31]
for bar in range(32):
    t0=bar*BAR; c=CH[bar%4]; r=ROOT[bar%4]
    if bar<2:   # intro 0-4s
        add(pad(c,BAR+0.6,0.08),t0)
        if bar==1: add(riser(BAR,0.15),t0)
        continue
    if bar==31:
        add(pad([57,60,64,69],4.0,0.1),t0); add(bell(81,3.0,0.2),t0); add(bell(76,3,0.15),t0+0.5); continue
    if bar>=26:  # redefinition: calm
        add(pad(c,BAR+0.6,0.1),t0); add(bell(c[-1]+12,1.6,0.12),t0)
        add(kick(0.5),t0); add(bass(r,BAR*0.9,0.2),t0); continue
    full = 13<=bar<=23 or bar>=24
    add(pad(c,BAR+0.6,0.1),t0)
    add(kick(1.0 if bar!=24 else 1.2),t0)            # downbeat
    add(bass(r,BEAT*1.8),t0); add(bass(r,BEAT*1.8,0.25),t0+2*BEAT)
    if full: add(kick(0.7),t0+2*BEAT)
    for k in range(8):
        tt=t0+k*BEAT/2
        if bar==23 and tt>=47.0: continue
        add(hat(0.03 if k%2 else 0.06),tt,0.6 if full else 0.35,pan=0.3*(-1)**k)
    if full: add(snare(),t0+BEAT,0.4); add(snare(),t0+3*BEAT,0.4)
    if bar==2: add(bell(76,2.0,0.3),t0); add(crash(),t0,0.5)   # hook landing 4s
    if bar==12: add(boom(),t0,0.5); add(crash(),t0,0.4)        # flash 24s
    if 20<=bar<=23: add(riser(BAR,0.12+0.05*(bar-20)),t0)
    if bar==24: add(boom(),t0); add(crash(),t0,0.9); add(pad([45,57,60,64,69],4,0.2),t0); add(bell(81,2.5,0.35),t0)
# breath: hard duck 47.0-48.0
a=int(47.0*SR); b=int(48.0*SR); g=np.linspace(1,0,int(0.15*SR))
out[a:a+len(g)]*=g[:,None]; out[a+len(g):b]*=0
# final fade
fl=int(2*SR); out[-fl:]*=np.linspace(1,0,fl)[:,None]
out=np.tanh(out*1.2); out/= np.max(np.abs(out))*1.12
pcm=(out*32767).astype('<i2')
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print("ok", DUR)
