// 金线一笔风 (gold-thread) 小素材包：星空底、发光金线 + 笔头、发光大字、数码管、字幕、网格。
// 动画都是帧号 f 的纯函数；随机只用 rand(seed)。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont as loadSerif} from '@remotion/google-fonts/NotoSerif';
import {loadFont as loadSans} from '@remotion/google-fonts/BeVietnamPro';
import {loadFont as loadLed} from '@remotion/google-fonts/Orbitron';

const serif = loadSerif('normal', {weights: ['400', '600'], subsets: ['vietnamese', 'latin']});
const sans = loadSans('normal', {weights: ['500', '800', '900'], subsets: ['vietnamese', 'latin']});
const led = loadLed('normal', {weights: ['700', '900'], subsets: ['latin']});

export const FONT = {serif: serif.fontFamily, sans: sans.fontFamily, led: led.fontFamily};
export const W = 1920, H = 1080, FPS = 30;

export const C = {
  bg: '#040509', bgWarm: '#161011',
  gold: '#d9a868', goldCore: '#fff2d6', goldDeep: '#9a7a58', amber: '#f0a640',
  red: '#ff3b2f', redGlow: 'rgba(255,59,47,0.75)', blue: '#8fa8ff', grid: 'rgba(110,130,210,0.16)',
  white: '#f3efe6',
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const prog = (f: number, a: number, d: number) => clamp((f - a) / d);
export const eo = (t: number) => 1 - Math.pow(1 - t, 3);
export const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const rand = (s: number) => {
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export type P = [number, number];
/** Catmull-Rom 平滑成密集折线 */
export const smooth = (pts: P[], seg = 14): P[] => {
  if (pts.length < 3) return pts;
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < seg; k++) {
      const t = k / seg, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) =>
        0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
/** 画到 t（0..1，按长度）为止的路径 + 笔头位置；from 可以让尾巴也收走 */
export const partial = (pts: P[], t: number, from = 0) => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1] || 1;
  const at = (d: number): P => {
    let i = 1;
    while (i < L.length - 1 && L[i] < d) i++;
    const s = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * s, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * s];
  };
  const a = clamp(from) * total, b = clamp(t) * total;
  if (b <= a) return {d: '', head: at(b), total};
  const seg: P[] = [at(a)];
  for (let i = 0; i < pts.length; i++) if (L[i] > a && L[i] < b) seg.push(pts[i]);
  seg.push(at(b));
  return {d: 'M' + seg.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L'), head: at(b), total};
};

/** SVG 滤镜定义：三档模糊 */
export const Defs: React.FC = () => (
  <defs>
    <filter id="b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
    <filter id="b10" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" /></filter>
    <filter id="b28" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28" /></filter>
    <radialGradient id="headG"><stop offset="0" stopColor="#fff" /><stop offset="0.25" stopColor="#ffe9b8" /><stop offset="1" stopColor="rgba(240,166,64,0)" /></radialGradient>
  </defs>
);

/** 发光线：外层琥珀光晕 + 中层金 + 线芯近白 */
export const GlowPath: React.FC<{d: string; color?: string; w?: number; o?: number; core?: string}> = ({d, color = C.gold, w = 4, o = 1, core = C.goldCore}) =>
  d ? (
    <g opacity={o} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={d} stroke={color} strokeWidth={w * 6} opacity={0.35} filter="url(#b28)" />
      <path d={d} stroke={color} strokeWidth={w * 2.2} opacity={0.75} filter="url(#b3)" />
      <path d={d} stroke={core} strokeWidth={w * 0.7} />
    </g>
  ) : null;

/** 笔头：亮白点 + 十字星芒，size 控制大小 */
export const PenHead: React.FC<{p: P; f: number; size?: number; o?: number}> = ({p, f, size = 1, o = 1}) => {
  const fl = 1 + 0.15 * Math.sin(f * 1.7);
  return (
    <g transform={`translate(${p[0]},${p[1]})`} opacity={o}>
      <circle r={60 * size * fl} fill="url(#headG)" opacity={0.85} />
      <circle r={7 * size} fill="#fff" />
      <line x1={-140 * size * fl} x2={140 * size * fl} y1={0} y2={0} stroke="#fff4dc" strokeWidth={1.6} opacity={0.7} />
      <line y1={-46 * size} y2={46 * size} x1={0} x2={0} stroke="#fff4dc" strokeWidth={1.2} opacity={0.45} />
    </g>
  );
};

/** 一条会被画出来的发光线，带笔头 */
export const Stroke: React.FC<{pts: P[]; f: number; at: number; dur: number; from?: number; color?: string; w?: number; o?: number; head?: boolean}> = ({pts, f, at, dur, from = 0, color, w, o = 1, head = true}) => {
  const t = eo(prog(f, at, dur));
  const {d, head: h} = partial(pts, t, from);
  return (
    <g>
      <GlowPath d={d} color={color} w={w} o={o} />
      {head && t > 0 && t < 1 ? <PenHead p={h} f={f} size={(w ?? 4) / 4} o={o} /> : null}
    </g>
  );
};

/** 星空底：近黑渐变 + 星点 + 暖色散景，缓慢漂移 */
export const Space: React.FC<{f: number; warm?: number; dim?: number}> = ({f, warm = 0.6, dim = 1}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 55%, ${C.bgWarm} 0%, ${C.bg} 62%, #010103 100%)`}}>
    <svg width={W} height={H} style={{position: 'absolute', opacity: dim}}>
      <Defs />
      {Array.from({length: 170}).map((_, i) => {
        const x = (rand(i) * W + f * (0.15 + rand(i + 9) * 0.3)) % W;
        const y = rand(i + 3) * H;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(f * 0.05 + i));
        return <circle key={i} cx={x} cy={y} r={0.6 + rand(i + 5) * 1.3} fill="#fff" opacity={0.25 * tw} />;
      })}
      {Array.from({length: 26}).map((_, i) => {
        const x = (rand(i + 50) * W - f * 0.4 * (0.5 + rand(i))) % W;
        const xx = x < 0 ? x + W : x;
        const y = H * (0.15 + rand(i + 70) * 0.35);
        const col = rand(i + 80) > 0.6 ? '#ff6a3a' : '#f3b563';
        return <circle key={'b' + i} cx={xx} cy={y} r={4 + rand(i + 90) * 9} fill={col} opacity={0.18 * warm} filter="url(#b3)" />;
      })}
    </svg>
  </AbsoluteFill>
);

/** 发光大字：金渐变 + 强外发光，从放大 + 模糊收拢进场 */
export const GlowText: React.FC<{text: string; f: number; at: number; x?: number; y?: number; size?: number; color?: 'gold' | 'red' | 'white'; out?: number; font?: string; weight?: number; ls?: number}> = ({text, f, at, x = W / 2, y = H / 2, size = 160, color = 'gold', out, font = FONT.sans, weight = 900, ls = 0}) => {
  const t = eo(prog(f, at, 14));
  const o = out === undefined ? 1 : 1 - prog(f, out, 10);
  const v = t * o;
  if (v <= 0) return null;
  const glow = color === 'red' ? 'rgba(255,70,50,' : color === 'white' ? 'rgba(255,240,215,' : 'rgba(245,170,70,';
  const fill =
    color === 'red'
      ? {color: '#ff6b55'}
      : color === 'white'
        ? {color: '#fffaf0'}
        : {background: 'linear-gradient(180deg,#fff7e0 0%,#ffd790 45%,#e09a45 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'};
  const pulse = 1 + 0.04 * Math.sin((f - at) * 0.12);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${1 + (1 - t) * 0.25})`, opacity: v, filter: `blur(${(1 - t) * 12}px)`, whiteSpace: 'nowrap'}}>
      <div style={{position: 'absolute', inset: 0, fontFamily: font, fontWeight: weight, fontSize: size, letterSpacing: ls, color: glow + '0.9)', filter: `blur(${size * 0.16 * pulse}px)`, opacity: 0.85}}>{text}</div>
      <div style={{position: 'relative', fontFamily: font, fontWeight: weight, fontSize: size, letterSpacing: ls, ...fill, textShadow: color === 'gold' ? undefined : `0 0 ${size * 0.12}px ${glow}0.9)`}}>{text}</div>
    </div>
  );
};

/** 红色数码管读数：标签 + 带虚影的 LED 数字 */
export const Led: React.FC<{label: string; value: string; f: number; at: number; x: number; y: number; size?: number; color?: string}> = ({label, value, f, at, x, y, size = 64, color = C.red}) => {
  const o = eo(prog(f, at, 10));
  if (o <= 0) return null;
  const flick = f - at < 8 ? (Math.floor(f) % 2 ? 0.4 : 1) : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: o * flick, display: 'flex', alignItems: 'center', gap: 18}}>
      <div style={{fontFamily: FONT.serif, fontSize: size * 0.34, color: 'rgba(243,239,230,0.7)'}}>{label}</div>
      <div style={{position: 'relative', fontFamily: FONT.led, fontWeight: 900, fontSize: size, letterSpacing: 4, whiteSpace: 'pre'}}>
        <span style={{position: 'absolute', left: 0, top: 0, color: 'rgba(255,60,40,0.09)'}}>{value.replace(/[0-9]/g, '8')}</span>
        <span style={{color, textShadow: `0 0 ${size * 0.25}px ${C.redGlow}, 0 0 ${size * 0.6}px rgba(255,40,20,0.45)`}}>{value}</span>
      </div>
    </div>
  );
};

/** 底部字幕：细衬线白字，一行，柔入柔出 */
export const Sub: React.FC<{f: number; cues: [number, number, string][]}> = ({f, cues}) => {
  const c = cues.find(([a, b]) => f >= a && f < b);
  if (!c) return null;
  const [a, b, s] = c;
  const o = Math.min(prog(f, a, 6), 1 - prog(f, b - 6, 6));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 70, textAlign: 'center', fontFamily: FONT.serif, fontSize: 44, letterSpacing: 1.5, color: C.white, opacity: o, textShadow: '0 2px 14px rgba(0,0,0,0.95)'}}>{s}</div>
  );
};

/** 细网格（坐标图底） */
export const Grid: React.FC<{x: number; y: number; w: number; h: number; step?: number; o?: number}> = ({x, y, w, h, step = 60, o = 1}) => (
  <g opacity={o} stroke={C.grid} strokeWidth={1}>
    {Array.from({length: Math.floor(w / step) + 1}).map((_, i) => <line key={'v' + i} x1={x + i * step} x2={x + i * step} y1={y} y2={y + h} />)}
    {Array.from({length: Math.floor(h / step) + 1}).map((_, i) => <line key={'h' + i} y1={y + i * step} y2={y + i * step} x1={x} x2={x + w} />)}
  </g>
);

/** 招牌转场：画面被推走 + 模糊，返回容器样式。在场景最后 dur 帧里用 */
export const pushOut = (f: number, end: number, dur = 14): React.CSSProperties => {
  const t = eio(prog(f, end - dur, dur));
  return {transform: `translateX(${-t * 520}px) scale(${1 - t * 0.08})`, filter: `blur(${t * 14}px)`, opacity: 1 - t};
};
/** 转场丝带：从屏幕右侧甩出一条宽金线，落在 land 点（下一场第一笔的起点） */
export const Ribbon: React.FC<{f: number; end: number; land: P; dur?: number}> = ({f, end, land, dur = 16}) => {
  const t = prog(f, end - dur, dur + 4);
  if (t <= 0 || t >= 1) return null;
  const pts = smooth([[W + 80, H * 0.25], [W * 0.7, H * 0.18], [W * 0.45, H * 0.55], [land[0] + 200, land[1] - 120], land], 18);
  const {d, head} = partial(pts, eo(t), Math.max(0, eo(t) - 0.55));
  return (
    <g>
      <GlowPath d={d} w={9 * (1 - t * 0.6)} />
      <PenHead p={head} f={f} size={1.4} />
    </g>
  );
};
