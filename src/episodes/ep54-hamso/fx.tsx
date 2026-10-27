// ep54 v2 特效包：在 ep53 kit 之上覆盖——更粗更亮的霓虹（白热芯 + 4 层金色泛光）、带横向变形镜头光条的笔头星、
// 上三分之一的失焦散景灯带（暖橙/红 + 少量蓝白，视差）、边缘色散、更重的颗粒；以及半透明 3D 人物合成（Figure）。
// 其余一律从 ep53 kit 透传，ep53 本身不受影响。
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, Defs, FONT, H, P, W, clamp, eio, eo, partial, prog, rand, smooth} from '../ep53-compound/kit';

export * from '../ep53-compound/kit';

/** 额外滤镜：大半径泛光、色散 */
export const Defs2: React.FC = () => (
  <defs>
    <filter id="b2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" /></filter>
    <filter id="b7" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
    <filter id="b16" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="16" /></filter>
    <filter id="b36" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="36" /></filter>
    <filter id="ca" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
      <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
      <feOffset in="r" dx="-5" dy="0" result="r2" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
      <feOffset in="b" dx="5" dy="1" result="b2" />
      <feBlend in="r2" in2="b2" mode="screen" />
    </filter>
    <radialGradient id="edgeR" cx="0.5" cy="0.5" r="0.72"><stop offset="0.45" stopColor="#000" /><stop offset="1" stopColor="#fff" /></radialGradient>
    <mask id="edgeM" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}><rect width={W} height={H} fill="url(#edgeR)" /></mask>
    <radialGradient id="halo2"><stop offset="0" stopColor="#fff" stopOpacity="1" /><stop offset="0.08" stopColor="#fff6e2" stopOpacity="0.95" /><stop offset="0.3" stopColor="#ffbf6a" stopOpacity="0.42" /><stop offset="0.6" stopColor="#ff8f2e" stopOpacity="0.12" /><stop offset="1" stopColor="#ff7a20" stopOpacity="0" /></radialGradient>
    <linearGradient id="streak" x1="0" x2="1"><stop offset="0" stopColor="#ffd9a0" stopOpacity="0" /><stop offset="0.35" stopColor="#ffe9c8" stopOpacity="0.35" /><stop offset="0.5" stopColor="#ffffff" stopOpacity="1" /><stop offset="0.65" stopColor="#ffe9c8" stopOpacity="0.35" /><stop offset="1" stopColor="#ffd9a0" stopOpacity="0" /></linearGradient>
    <linearGradient id="streakB" x1="0" x2="1"><stop offset="0" stopColor="#8fb4ff" stopOpacity="0" /><stop offset="0.5" stopColor="#cfe0ff" stopOpacity="0.7" /><stop offset="1" stopColor="#8fb4ff" stopOpacity="0" /></linearGradient>
  </defs>
);

export const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}>
    <Defs />
    <Defs2 />
    {children}
  </svg>
);

/** 霓虹线：4 层泛光（36/16/7/2）+ 白热芯 */
export const GlowPath: React.FC<{d: string; color?: string; w?: number; o?: number; core?: string; halo?: number}> = ({d, color = C.gold, w = 2.4, o = 1, core = C.core, halo = 1}) => {
  if (!d) return null;
  const gold = color === C.gold;
  return (
    <g opacity={o} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={d} stroke={gold ? C.amber : color} strokeWidth={w * 12} opacity={0.2 * halo} filter="url(#b36)" />
      <path d={d} stroke={gold ? '#ffae4a' : color} strokeWidth={w * 6} opacity={0.36 * halo} filter="url(#b16)" />
      <path d={d} stroke={color} strokeWidth={w * 3.2} opacity={0.7} filter="url(#b7)" />
      <path d={d} stroke={gold ? C.mid : color} strokeWidth={w * 1.7} opacity={0.95} filter="url(#b2)" />
      <path d={d} stroke={core} strokeWidth={Math.max(1, w * 0.8)} />
    </g>
  );
};

/** 笔头星：白热点 + 双层暖光晕 + 四芒星 + 横向变形镜头光条（带一丝蓝） */
export const PenHead: React.FC<{p: P; f: number; size?: number; o?: number}> = ({p, f, size = 1, o = 1}) => {
  const fl = 1 + 0.14 * Math.sin(f * 1.9) + 0.07 * Math.sin(f * 3.7);
  const s = size * fl;
  const star = (L: number, wd: number) => `M${-L},0 Q0,${-wd} ${L},0 Q0,${wd} ${-L},0 Z M0,${-L * 0.5} Q${wd},0 0,${L * 0.5} Q${-wd},0 0,${-L * 0.5} Z`;
  return (
    <g transform={`translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`} opacity={o} style={{mixBlendMode: 'screen'}}>
      <circle r={150 * s} fill="url(#halo2)" opacity={0.55} />
      <circle r={60 * s} fill="url(#halo2)" opacity={0.95} />
      <ellipse rx={420 * s} ry={9 * s} fill="url(#streakB)" opacity={0.35} filter="url(#b2)" />
      <rect x={-340 * s} y={-1.6 * s} width={680 * s} height={3.2 * s} fill="url(#streak)" opacity={0.9} />
      <path d={star(62 * s, 6 * s)} fill="#fff6e2" opacity={0.95} />
      <rect x={-1} y={-70 * s} width={2} height={140 * s} fill="url(#flareV)" opacity={0.5} />
      <circle r={9 * size} fill="#fff" />
    </g>
  );
};

export const Stroke: React.FC<{pts: P[]; f: number; at: number; dur: number; from?: number; color?: string; w?: number; o?: number; head?: boolean; ease?: (t: number) => number; headSize?: number; core?: string}> = ({pts, f, at, dur, from = 0, color, w, o = 1, head = true, ease = eo, headSize, core}) => {
  const t = ease(prog(f, at, dur));
  if (t <= 0) return null;
  const {d, head: h} = partial(pts, t, from);
  return (
    <g>
      <GlowPath d={d} color={color} w={w} o={o} core={core} />
      {head && t < 1 ? <PenHead p={h} f={f} size={headSize ?? 0.9} o={o} /> : null}
    </g>
  );
};

/** 散景灯带：上三分之一的一条失焦灯（远处夜市/城市灯），pan = 相机水平位移（视差） */
const BOKEH = Array.from({length: 78}).map((_, i) => {
  const r0 = rand(i * 7 + 1);
  const kind = r0 > 0.9 ? 'blue' : r0 > 0.83 ? 'white' : r0 > 0.62 ? 'red' : 'warm';
  const depth = rand(i * 7 + 2); // 0 远 1 近
  return {
    x: rand(i * 7 + 3) * (W + 600) - 300,
    y: H * (0.25 + 0.16 * (rand(i * 7 + 4) - 0.5) * (1.4 - depth) + 0.05 * Math.sin(i * 0.7)),
    r: 6 + depth * 24 + rand(i * 7 + 5) * 6,
    depth, kind, ph: rand(i * 7 + 6) * 6.28,
  };
});
const BCOL: Record<string, [string, string]> = {warm: ['#ffc070', '#ff8a30'], red: ['#ff5a36', '#e0281c'], blue: ['#a9c4ff', '#5f86ff'], white: ['#fff4e4', '#ffd9b0']};
export const BokehBand: React.FC<{f: number; pan?: number; o?: number; drift?: number}> = ({f, pan = 0, o = 1, drift = 1}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: o}}>
    <defs>
      {Object.entries(BCOL).map(([k, [a, b]]) => (
        <radialGradient key={k} id={`bk-${k}`}>
          <stop offset="0" stopColor={a} stopOpacity="0.75" /><stop offset="0.72" stopColor={b} stopOpacity="0.55" /><stop offset="0.9" stopColor={a} stopOpacity="0.7" /><stop offset="1" stopColor={b} stopOpacity="0" />
        </radialGradient>
      ))}
      <linearGradient id="bandHaze" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ff8a3a" stopOpacity="0" /><stop offset="0.5" stopColor="#ff8a3a" stopOpacity="0.07" /><stop offset="1" stopColor="#ff8a3a" stopOpacity="0" /></linearGradient>
    </defs>
    <rect x={0} y={H * 0.1} width={W} height={H * 0.32} fill="url(#bandHaze)" />
    {BOKEH.map((b, i) => {
      const sp = (0.15 + b.depth * 0.5) * drift;
      const par = pan * (0.06 + b.depth * 0.22);
      const span = W + 600;
      const x = ((((b.x - f * sp - par) % span) + span) % span) - 300;
      const tw = 0.72 + 0.28 * Math.sin(f * 0.05 + b.ph);
      const base = b.kind === 'warm' ? 0.62 : b.kind === 'red' ? 0.75 : 0.6;
      return <circle key={i} cx={x} cy={b.y} r={b.r} fill={`url(#bk-${b.kind})`} opacity={base * tw * (0.55 + 0.45 * b.depth)} />;
    })}
  </svg>
);

/** 星空 + 散景灯带 */
export const Space: React.FC<{f: number; warm?: number; dim?: number; drift?: number; pan?: number; band?: number}> = ({f, warm = 1, dim = 1, drift = 1, pan = 0, band = 1}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 30%, #140d0c 0%, ${C.bg} 55%, #010103 100%)`}}>
    <svg width={W} height={H} style={{position: 'absolute', opacity: dim}}>
      {[0, 1].map((layer) =>
        Array.from({length: [160, 70][layer]}).map((_, i) => {
          const s = layer * 1000 + i;
          const sp = [0.08, 0.25][layer] * drift;
          const x = (((rand(s) * W - f * sp - pan * [0.03, 0.08][layer]) % W) + W) % W;
          const y = rand(s + 3) * H;
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(f * (0.03 + rand(s + 7) * 0.05) + i));
          const r = [0.6, 1.0][layer] * (0.6 + rand(s + 5) * 0.8);
          return <circle key={s} cx={x} cy={y} r={r} fill={rand(s + 11) > 0.8 ? '#ffd9a8' : '#ffffff'} opacity={[0.3, 0.45][layer] * tw} />;
        }),
      )}
    </svg>
    <BokehBand f={f} pan={pan} o={clamp(0.85 * warm * band, 0, 1.2)} drift={drift} />
  </AbsoluteFill>
);

/** 颗粒 + 暗角（颗粒比 ep53 重一点） */
export const GrainVignette: React.FC<{f: number; grain?: number}> = ({f, grain = 0.1}) => (
  <>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none'}} />
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: grain, mixBlendMode: 'screen'}}>
      <filter id="grain2"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={f % 23} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width={W} height={H} filter="url(#grain2)" />
    </svg>
  </>
);

/** 转场丝带（用新的霓虹 + 笔头） */
export const Ribbon: React.FC<{f: number; end: number; land: P; from?: P}> = ({f, end, land, from = [W + 120, H * 0.3]}) => {
  const t = prog(f, end - 12, 22);
  if (t <= 0 || t >= 1) return null;
  const mid1: P = [W * 0.62, H * 0.12], mid2: P = [W * 0.38, H * 0.62];
  const pts = smooth([from, mid1, mid2, [(land[0] + mid2[0]) / 2, land[1] - 140], land], 20);
  const e = eio(t);
  const {d, head} = partial(pts, e, Math.max(0, e - 0.5));
  const wide = 1 - t;
  return (
    <g>
      <path d={d} stroke={C.gold} strokeWidth={46 * wide + 6} fill="none" opacity={0.14} filter="url(#b10)" strokeLinecap="round" />
      <GlowPath d={d} w={2.6 + 3 * wide} />
      <PenHead p={head} f={f} size={1.2} />
    </g>
  );
};

/* ---------- 半透明 3D 人物合成 ---------- */
export type Fig = {src: string; at: number; out: number; x: number; y: number; h: number; side?: 1 | -1; caption?: string; o?: number};
/** 人物：screen 叠加、羽化、金色轮廓光（已烘进 PNG）、轻微模糊 + 颗粒、CSS 3D 透视慢推 + 视差；at 柔和溶入，out 淡出 */
export const Figure: React.FC<{fig: Fig; f: number; fadeIn?: number; fadeOut?: number}> = ({fig, f, fadeIn = 20, fadeOut = 16}) => {
  const inn = eo(prog(f, fig.at, fadeIn));
  const out = 1 - prog(f, fig.out - fadeOut, fadeOut);
  const vis = Math.min(inn, out);
  if (vis <= 0) return null;
  const life = fig.out - fig.at;
  const k = clamp((f - fig.at) / life);
  const side = fig.side ?? 1;
  const z = -260 + 220 * eio(k) + 60 * (1 - inn); // 慢推近
  const rotY = side * (14 - 10 * k);
  const dx = side * (-30 * k) + (1 - inn) * side * -40; // 视差横移
  const dy = Math.sin(f * 0.03) * 6;
  const op = (fig.o ?? 0.68) * vis;
  const blur = 0.7 + (1 - inn) * 5;
  return (
    <AbsoluteFill style={{perspective: 1300, perspectiveOrigin: '50% 45%', mixBlendMode: 'screen', opacity: op}}>
      <div style={{position: 'absolute', left: fig.x - fig.h * 0.4, top: fig.y - fig.h / 2, height: fig.h, transform: `translate3d(${dx}px, ${dy}px, ${z}px) rotateY(${rotY}deg)`, transformStyle: 'preserve-3d'}}>
        <Img src={staticFile(fig.src)} style={{height: fig.h, width: 'auto', display: 'block', filter: `blur(${blur.toFixed(2)}px) contrast(1.1) brightness(0.96)`, WebkitMaskImage: 'radial-gradient(ellipse 62% 58% at 50% 44%, #000 55%, transparent 100%)', maskImage: 'radial-gradient(ellipse 62% 58% at 50% 44%, #000 55%, transparent 100%)'}} />
        {/* 远景版：更大更糊的一层，制造深度残影 */}
        <Img src={staticFile(fig.src)} style={{position: 'absolute', left: 0, top: 0, height: fig.h, width: 'auto', opacity: 0.35, transform: 'translateZ(-120px) scale(1.12)', filter: 'blur(10px) brightness(1.3)'}} />
      </div>
    </AbsoluteFill>
  );
};

/** 字幕：同 ep53，但长句自动折成两行（v2 新增的历史句较长） */
export const Sub: React.FC<{f: number; cues: [number, number, string][]}> = ({f, cues}) => {
  const c = cues.find(([a, b]) => f >= a && f < b);
  if (!c) return null;
  const [a, b, s] = c;
  const o = Math.min(prog(f, a, 5), 1 - prog(f, b - 4, 4));
  return (
    <div style={{position: 'absolute', left: 160, right: 160, bottom: 56, textAlign: 'center', fontFamily: FONT.serif, fontWeight: 300, fontSize: 40, lineHeight: 1.3, letterSpacing: 2, color: C.white, opacity: o, textShadow: '0 1px 10px rgba(0,0,0,0.9)'}}>{s}</div>
  );
};
