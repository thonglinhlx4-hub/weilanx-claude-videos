// 金线一笔风 v2 素材包（ep53）：更贴近参考片——细线、三层发光、四芒星笔头、星空 + 暖散景视差、
// 颗粒 + 暗角、七段数码管（SVG 手绘段）、细衬线字幕、描边写字（stroke-dashoffset）。
// 动画都是帧号 f 的纯函数；随机只用 rand(seed)。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont as loadSerif} from '@remotion/google-fonts/NotoSerif';

const serif = loadSerif('normal', {weights: ['300', '400', '500'], subsets: ['vietnamese', 'latin', 'latin-ext']});
loadSerif('italic', {weights: ['300', '400'], subsets: ['vietnamese', 'latin', 'latin-ext']});

export const FONT = {serif: serif.fontFamily};
export const W = 1920, H = 1080, FPS = 30;

export const C = {
  bg: '#05050a', bgWarm: '#120d0e',
  gold: '#e2a85c', mid: '#f3c27e', core: '#fff6e4', amber: '#ff9a3a',
  red: '#ff3b2f', orange: '#ff6a3a', green: '#7fe39a', blue: '#9fb4ff',
  grid: 'rgba(70,98,205,0.40)', gridFaint: 'rgba(70,98,205,0.2)',
  label: 'rgba(226,222,212,0.72)', dim: 'rgba(200,196,188,0.45)', white: '#f4f0e8',
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const prog = (f: number, a: number, d: number) => clamp((f - a) / d);
export const eo = (t: number) => 1 - Math.pow(1 - t, 3);
export const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const ei = (t: number) => t * t * t;
export const rand = (s: number) => {
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export type P = [number, number];
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
export const circlePts = (cx: number, cy: number, r: number, a0 = -Math.PI / 2, turns = 1, n = 64, dir = 1): P[] =>
  Array.from({length: n + 1}, (_, i) => {
    const a = a0 + dir * (i / n) * Math.PI * 2 * turns;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P;
  });
/** 圆角矩形（从左上角圆弧之后的上边开始，顺时针） */
export const roundRectPts = (x: number, y: number, w: number, h: number, r: number): P[] => {
  const out: P[] = [];
  const arc = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 10; i++) {
      const a = a0 + (i / 10) * (Math.PI / 2);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  out.push([x + r, y]);
  out.push([x + w - r, y]); arc(x + w - r, y + r, -Math.PI / 2);
  out.push([x + w, y + h - r]); arc(x + w - r, y + h - r, 0);
  out.push([x + r, y + h]); arc(x + r, y + h - r, Math.PI / 2);
  out.push([x, y + r]); arc(x + r, y + r, Math.PI);
  return out;
};
export const lenOf = (pts: P[]) => {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
};
/** 画到 t（0..1，按长度）为止的路径 + 笔头；from 让尾巴也收走 */
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

export const Defs: React.FC = () => (
  <defs>
    <filter id="b1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" /></filter>
    <filter id="b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
    <filter id="b10" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" /></filter>
    <filter id="b24" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="24" /></filter>
    <radialGradient id="halo"><stop offset="0" stopColor="#fff" stopOpacity="1" /><stop offset="0.12" stopColor="#fff1cf" stopOpacity="0.95" /><stop offset="0.35" stopColor="#ffb258" stopOpacity="0.35" /><stop offset="1" stopColor="#ff8a2a" stopOpacity="0" /></radialGradient>
    <radialGradient id="bokehG"><stop offset="0" stopColor="#ffb468" stopOpacity="0.9" /><stop offset="0.6" stopColor="#ff8a3c" stopOpacity="0.35" /><stop offset="1" stopColor="#ff7a30" stopOpacity="0" /></radialGradient>
    <linearGradient id="flareH" x1="0" x2="1"><stop offset="0" stopColor="#ffe6bf" stopOpacity="0" /><stop offset="0.5" stopColor="#fff8ea" stopOpacity="0.95" /><stop offset="1" stopColor="#ffe6bf" stopOpacity="0" /></linearGradient>
    <linearGradient id="flareV" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ffe6bf" stopOpacity="0" /><stop offset="0.5" stopColor="#fff8ea" stopOpacity="0.9" /><stop offset="1" stopColor="#ffe6bf" stopOpacity="0" /></linearGradient>
  </defs>
);

export const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}>
    <Defs />
    {children}
  </svg>
);

/** 发光线：宽琥珀光晕 + 中层金 + 近白细芯 */
export const GlowPath: React.FC<{d: string; color?: string; w?: number; o?: number; core?: string; halo?: number}> = ({d, color = C.gold, w = 2.4, o = 1, core = C.core, halo = 1}) =>
  d ? (
    <g opacity={o} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={d} stroke={color === C.gold ? C.amber : color} strokeWidth={w * 9} opacity={0.22 * halo} filter="url(#b24)" />
      <path d={d} stroke={color} strokeWidth={w * 3.2} opacity={0.55} filter="url(#b4)" />
      <path d={d} stroke={color === C.gold ? C.mid : color} strokeWidth={w * 1.4} opacity={0.85} filter="url(#b1)" />
      <path d={d} stroke={core} strokeWidth={Math.max(0.8, w * 0.55)} />
    </g>
  ) : null;

/** 笔头：白热点 + 琥珀光晕 + 四芒星（横长竖短） */
export const PenHead: React.FC<{p: P; f: number; size?: number; o?: number}> = ({p, f, size = 1, o = 1}) => {
  const fl = 1 + 0.12 * Math.sin(f * 1.9) + 0.06 * Math.sin(f * 3.7);
  const s = size * fl;
  const star = (L: number, wd: number) => `M${-L},0 Q0,${-wd} ${L},0 Q0,${wd} ${-L},0 Z M0,${-L * 0.42} Q${wd},0 0,${L * 0.42} Q${-wd},0 0,${-L * 0.42} Z`;
  return (
    <g transform={`translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`} opacity={o} style={{mixBlendMode: 'screen'}}>
      <circle r={70 * s} fill="url(#halo)" opacity={0.75} />
      <path d={star(46 * s, 5 * s)} fill="#fff4dc" opacity={0.95} />
      <rect x={-210 * s} y={-1} width={420 * s} height={2} fill="url(#flareH)" opacity={0.75} />
      <rect x={-0.8} y={-60 * s} width={1.6} height={120 * s} fill="url(#flareV)" opacity={0.45} />
      <circle r={6.5 * size} fill="#fff" />
    </g>
  );
};

/** 一条会被画出来的发光线，带笔头 */
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

/** 星空 + 暖色散景（三层视差）+ 暗角 */
export const Space: React.FC<{f: number; warm?: number; dim?: number; drift?: number}> = ({f, warm = 1, dim = 1, drift = 1}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 42%, ${C.bgWarm} 0%, ${C.bg} 58%, #010103 100%)`}}>
    <svg width={W} height={H} style={{position: 'absolute', opacity: dim}}>
      <Defs />
      {[0, 1, 2].map((layer) =>
        Array.from({length: [220, 120, 50][layer]}).map((_, i) => {
          const s = layer * 1000 + i;
          const sp = [0.08, 0.2, 0.45][layer] * drift;
          const x = (((rand(s) * W - f * sp) % W) + W) % W;
          const y = rand(s + 3) * H;
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(f * (0.03 + rand(s + 7) * 0.05) + i));
          const r = [0.5, 0.8, 1.2][layer] * (0.6 + rand(s + 5) * 0.8);
          return <circle key={s} cx={x} cy={y} r={r} fill={rand(s + 11) > 0.85 ? '#ffd9a8' : '#ffffff'} opacity={[0.28, 0.4, 0.55][layer] * tw} />;
        }),
      )}
      {Array.from({length: 34}).map((_, i) => {
        const sp = (0.25 + rand(i + 31) * 0.5) * drift;
        const x = (((rand(i + 50) * (W + 200) - f * sp) % (W + 200)) + W + 200) % (W + 200) - 100;
        const y = H * (0.04 + Math.pow(rand(i + 70), 1.6) * 0.42) + Math.sin(f * 0.01 + i) * 6;
        const r = 5 + rand(i + 90) * 16;
        const tw = 0.6 + 0.4 * Math.sin(f * 0.04 + i * 2.1);
        const red = rand(i + 80) > 0.7;
        return <circle key={'b' + i} cx={x} cy={y} r={r} fill={red ? '#ff5a30' : 'url(#bokehG)'} opacity={(red ? 0.16 : 0.32) * warm * tw} filter={r > 12 ? 'url(#b4)' : undefined} />;
      })}
    </svg>
  </AbsoluteFill>
);

/** 颗粒 + 暗角，盖在最上层 */
export const GrainVignette: React.FC<{f: number}> = ({f}) => (
  <>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: 0.07, mixBlendMode: 'screen'}}>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={1} seed={f % 17} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width={W} height={H} filter="url(#grain)" />
    </svg>
  </>
);

/* ---------- 七段数码管 ---------- */
const SEG: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '',
};
const segPoly = (s: string, w: number, h: number, t: number): string => {
  const g = t * 0.18, hh = h / 2;
  const hor = (y: number) => `${g + t / 2},${y} ${g + t},${y - t / 2} ${w - g - t},${y - t / 2} ${w - g - t / 2},${y} ${w - g - t},${y + t / 2} ${g + t},${y + t / 2}`;
  const ver = (x: number, y0: number, y1: number) => `${x},${y0 + g + t / 2} ${x + t / 2},${y0 + g + t} ${x + t / 2},${y1 - g - t} ${x},${y1 - g - t / 2} ${x - t / 2},${y1 - g - t} ${x - t / 2},${y0 + g + t}`;
  switch (s) {
    case 'a': return hor(t / 2);
    case 'g': return hor(hh);
    case 'd': return hor(h - t / 2);
    case 'f': return ver(t / 2, 0, hh);
    case 'b': return ver(w - t / 2, 0, hh);
    case 'e': return ver(t / 2, hh, h);
    case 'c': return ver(w - t / 2, hh, h);
  }
  return '';
};
/** value 如 "37.8"；size = 数字高度(px)。带 "8" 虚影与红色辉光 */
export const SevenSeg: React.FC<{value: string; x: number; y: number; size?: number; color?: string; o?: number; ghost?: boolean; ghostO?: number}> = ({value, x, y, size = 60, color = C.red, o = 1, ghost = true, ghostO = 0.07}) => {
  const h = size, w = size * 0.52, t = size * 0.11, gap = size * 0.18;
  const cells: {ch: string; dot: boolean}[] = [];
  for (const ch of value) {
    if ((ch === '.' || ch === ',') && cells.length) cells[cells.length - 1].dot = true;
    else cells.push({ch, dot: false});
  }
  const lit: React.ReactNode[] = [], off: React.ReactNode[] = [];
  cells.forEach((c, i) => {
    const ox = i * (w + gap);
    const on = SEG[c.ch] ?? '';
    'abcdefg'.split('').forEach((s) => {
      const poly = <polygon key={i + s} points={segPoly(s, w, h, t)} transform={`translate(${ox},0)`} />;
      (on.includes(s) ? lit : off).push(poly);
    });
    const dot = <circle key={i + 'dp'} cx={ox + w + gap * 0.5} cy={h - t / 2} r={t * 0.75} />;
    (c.dot ? lit : off).push(dot);
  });
  return (
    <g transform={`translate(${x},${y}) skewX(-7)`} opacity={o}>
      {ghost && ghostO > 0 ? <g fill={color} opacity={ghostO}>{off}</g> : null}
      <g fill={color} opacity={0.75} filter="url(#b10)">{lit}</g>
      <g fill={color} opacity={0.95} filter="url(#b1)">{lit}</g>
      <g fill="#ffd2c6" opacity={0.55}>{lit}</g>
    </g>
  );
};
export const segWidth = (value: string, size: number) => {
  const n = value.replace(/[.,]/g, '').length;
  return n * size * 0.52 + (n - 1) * size * 0.18;
};

/** 小号衬线标注（SVG） */
export const Label: React.FC<{x: number; y: number; text: string; size?: number; color?: string; o?: number; anchor?: 'start' | 'middle' | 'end'; italic?: boolean; weight?: number; ls?: number}> = ({x, y, text, size = 22, color = C.label, o = 1, anchor = 'start', italic = false, weight = 400, ls = 0.5}) =>
  o > 0 ? (
    <text x={x} y={y} fontFamily={FONT.serif} fontSize={size} fill={color} opacity={o} textAnchor={anchor} fontStyle={italic ? 'italic' : 'normal'} fontWeight={weight} letterSpacing={ls}>
      {text}
    </text>
  ) : null;

/** 发光公式（衬线斜体），children 允许 tspan */
export const Formula: React.FC<{x: number; y: number; size?: number; o?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; children: React.ReactNode}> = ({x, y, size = 44, o = 1, color = C.mid, anchor = 'start', children}) =>
  o > 0 ? (
    <g opacity={o} fontFamily={FONT.serif} fontStyle="italic" fontWeight={400} fontSize={size} textAnchor={anchor}>
      <text x={x} y={y} fill={C.amber} opacity={0.6} filter="url(#b10)">{children}</text>
      <text x={x} y={y} fill={color}>{children}</text>
      <text x={x} y={y} fill="none" stroke={C.core} strokeWidth={0.6} opacity={0.6}>{children}</text>
    </g>
  ) : null;

/** 光笔描字：逐字母 stroke-dashoffset 描出外轮廓，随后轻填充；笔头沿字游走 */
export const PenWord: React.FC<{text: string; f: number; at: number; dur: number; x: number; y: number; size: number; ls?: number; fillO?: number; o?: number; widths?: number[]; head?: boolean}> = ({text, f, at, dur, x, y, size, ls = 0, fillO = 0.18, o = 1, widths, head = true}) => {
  const chars = text.split('');
  // 近似字宽（Noto Serif 大写）：用于笔头位置与逐字时间
  const cw = widths ?? chars.map((c) => (c === ' ' ? 0.3 : c === 'I' ? 0.4 : c === 'K' || c === 'P' || c === 'L' ? 0.66 : c === 'A' || c === 'Ã' || c === 'Á' ? 0.7 : 0.62));
  const total = cw.reduce((a, b) => a + b, 0) * size + ls * (chars.length - 1);
  let cx = x - total / 2;
  const T = prog(f, at, dur);
  const nodes: React.ReactNode[] = [];
  let acc = 0;
  const totalW = cw.reduce((a, b) => a + b, 0);
  let headP: P | null = null;
  chars.forEach((c, i) => {
    const t0 = acc / totalW, t1 = (acc + cw[i]) / totalW;
    acc += cw[i];
    const lt = clamp((T - t0) / Math.max(0.001, t1 - t0) * 0.75);
    const lx = cx;
    cx += cw[i] * size + ls;
    if (c === ' ') return;
    if (T >= t0 && T < t1) {
      const u = (T - t0) / (t1 - t0);
      headP = [lx + u * cw[i] * size, y - size * (0.35 + 0.3 * Math.sin(u * Math.PI * 3))];
    }
    const L = 1400;
    const fill = clamp((T - t1) * 6) * fillO;
    nodes.push(
      <g key={i} opacity={lt > 0 ? 1 : 0}>
        <text x={lx} y={y} fontFamily={FONT.serif} fontWeight={400} fontSize={size} fill={C.mid} fillOpacity={fill} stroke={C.amber} strokeWidth={size * 0.05} strokeOpacity={0.35} filter="url(#b10)" strokeDasharray={`${L} ${L}`} strokeDashoffset={L * (1 - eo(lt))}>{c}</text>
        <text x={lx} y={y} fontFamily={FONT.serif} fontWeight={400} fontSize={size} fill={C.mid} fillOpacity={fill} stroke={C.mid} strokeWidth={size * 0.018} filter="url(#b1)" strokeDasharray={`${L} ${L}`} strokeDashoffset={L * (1 - eo(lt))}>{c}</text>
        <text x={lx} y={y} fontFamily={FONT.serif} fontWeight={400} fontSize={size} fill="none" stroke={C.core} strokeWidth={Math.max(0.8, size * 0.006)} strokeDasharray={`${L} ${L}`} strokeDashoffset={L * (1 - eo(lt))}>{c}</text>
      </g>,
    );
  });
  return (
    <g opacity={o}>
      {nodes}
      {head && headP ? <PenHead p={headP} f={f} size={0.8} /> : null}
    </g>
  );
};

/** 底部字幕：一行细衬线白字 */
export const Sub: React.FC<{f: number; cues: [number, number, string][]}> = ({f, cues}) => {
  const c = cues.find(([a, b]) => f >= a && f < b);
  if (!c) return null;
  const [a, b, s] = c;
  const o = Math.min(prog(f, a, 5), 1 - prog(f, b - 4, 4));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 62, textAlign: 'center', fontFamily: FONT.serif, fontWeight: 300, fontSize: 40, letterSpacing: 2, color: C.white, opacity: o, whiteSpace: 'nowrap', textShadow: '0 1px 10px rgba(0,0,0,0.9)'}}>{s}</div>
  );
};

/** 招牌转场：推走 + 运动模糊 */
export const pushOut = (f: number, end: number, dur = 14): React.CSSProperties => {
  const t = eio(prog(f, end - dur, dur));
  if (t <= 0) return {};
  return {transform: `translateX(${-t * 560}px) scale(${1 - t * 0.06})`, filter: `blur(${t * 16}px)`, opacity: 1 - t};
};
/** 转场丝带：宽丝带从右上甩过画面，落在 land（下一场第一笔起点），甩出段落在 end（小节线） */
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
      <path d={d} stroke={C.mid} strokeWidth={20 * wide + 2} fill="none" opacity={0.3} filter="url(#b4)" strokeLinecap="round" />
      <GlowPath d={d} w={2.6 + 3 * wide} />
      <PenHead p={head} f={f} size={1.2} />
    </g>
  );
};
