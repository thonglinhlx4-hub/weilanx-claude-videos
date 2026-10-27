// S1 钩子 v2：真实字形（Playfair Display Italic）轮廓由光笔一笔描出 → 金色渐变填充绽放；
// 中间一株绿色幼苗，右侧问号，三者同一基线、整体居中；问号的点 = 落笔点（第 120 帧 = 第 2 小节重拍）。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, GlowPath, Label, P, PenHead, Svg, clamp, eio, eo, lenOf, partial, prog, pushOut, smooth} from './kit';
import {GLYPHS} from './glyphs';

const S = 0.36; // 字号 360px
const BY = 600; // 基线
const GX = {one: 540, percent: 674, sprout: 1050, question: 1166};

type Seg = {pts: P[]; kind: 'lead' | 'gold' | 'conn' | 'green'; glyph?: string; wt: number};

const place = (c: [number, number][], gx: number): P[] => c.map(([x, y]) => [gx + x * S, BY + y * S] as P);
/** 让闭合轮廓从离 near 最近的点开始 */
const rotateTo = (pts: P[], near: P): P[] => {
  const ring = pts.slice(0, -1);
  let bi = 0, bd = 1e9;
  ring.forEach((p, i) => {
    const d = Math.hypot(p[0] - near[0], p[1] - near[1]);
    if (d < bd) { bd = d; bi = i; }
  });
  const r = [...ring.slice(bi), ...ring.slice(0, bi)];
  return [...r, r[0]];
};
/** 轮廓之间的细连线：向上拱起的柔和弧（像参考片里游走的细线） */
const conn = (a: P, b: P, lift = 60): P[] => {
  const m: P = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - lift];
  const out: P[] = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    out.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * m[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * m[1] + t * t * b[1]]);
  }
  return out;
};
const qb = (a: P, c: P, b: P, n = 16): P[] =>
  Array.from({length: n + 1}, (_, i) => {
    const t = i / n;
    return [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]] as P;
  });

/* 幼苗（相对 sprout 基点，略随斜体倾斜） */
const SX = GX.sprout;
const STEM: P[] = smooth([[SX - 18, BY], [SX - 10, BY - 50], [SX + 4, BY - 112], [SX + 12, BY - 168]], 12);
const LEAF_L: P[] = [...qb([SX - 2, BY - 118], [SX - 30, BY - 196], [SX - 104, BY - 186]), ...qb([SX - 104, BY - 186], [SX - 64, BY - 120], [SX - 2, BY - 118]).slice(1)];
const LEAF_R: P[] = [...qb([SX + 10, BY - 150], [SX + 26, BY - 240], [SX + 112, BY - 250]), ...qb([SX + 112, BY - 250], [SX + 84, BY - 160], [SX + 10, BY - 150]).slice(1)];
const SOIL: P[] = qb([SX - 70, BY + 2], [SX - 16, BY - 12], [SX + 44, BY + 2], 12);

const ONE = place(GLYPHS.one.contours[0], GX.one);
const PC = GLYPHS.percent.contours.map((c) => place(c, GX.percent));
const Q = GLYPHS.question.contours.map((c) => place(c, GX.question));

const SEGS: Seg[] = (() => {
  const segs: Seg[] = [];
  const oneStart = ONE.reduce((b, p) => (p[1] > b[1] - 2 && p[0] < b[0] ? p : b), ONE[0]);
  const lead = smooth([[-90, 990], [200, 930], [380, 820], [460, 690], [500, 628], [oneStart[0] - 28, oneStart[1] + 3], oneStart], 18);
  segs.push({pts: lead, kind: 'lead', wt: 0.55});
  let cur = oneStart;
  const add = (pts: P[], kind: Seg['kind'], glyph?: string, closed = true, lift = 60) => {
    const p = closed ? rotateTo(pts, cur) : pts;
    segs.push({pts: conn(cur, p[0], lift), kind: 'conn', wt: 0.35});
    segs.push({pts: p, kind, glyph, wt: 1});
    cur = p[p.length - 1];
  };
  segs.push({pts: rotateTo(ONE, oneStart), kind: 'gold', glyph: 'one', wt: 1});
  cur = oneStart;
  add(PC[1], 'gold', 'pctA', true, 40);
  add(PC[0], 'gold', 'pctA', true, 10);
  add(PC[4], 'gold', 'pctS', true, 30);
  add(PC[3], 'gold', 'pctB', true, 30);
  add(PC[2], 'gold', 'pctB', true, 10);
  add(SOIL, 'green', 'sprout', false, 40);
  add(STEM, 'green', 'sprout', false, 8);
  add(LEAF_L, 'green', 'sprout', false, 6);
  add(LEAF_R, 'green', 'sprout', true, 30);
  add(Q[0], 'gold', 'q', true, 60);
  return segs;
})();
const DOT = Q[1];
const DOT_C: P = [DOT.reduce((a, p) => a + p[0], 0) / DOT.length, DOT.reduce((a, p) => a + p[1], 0) / DOT.length];
// 时间权重：按长度 × 权重分配
const WLEN = SEGS.map((s) => lenOf(s.pts) * s.wt);
const WTOT = WLEN.reduce((a, b) => a + b, 0);
const STARTS = WLEN.reduce<number[]>((acc, _w, i) => [...acc, i === 0 ? 0 : acc[i - 1] + WLEN[i - 1]], []);
const glyphDone = (g: string) => {
  let last = -1;
  SEGS.forEach((s, i) => { if (s.glyph === g) last = i; });
  return (STARTS[last] + WLEN[last]) / WTOT;
};
const DONE = {one: glyphDone('one'), pctA: glyphDone('pctA'), pctS: glyphDone('pctS'), pctB: glyphDone('pctB'), sprout: glyphDone('sprout'), q: glyphDone('q')};

const T0 = 2, T1 = 115; // 一笔：2 → 115 帧；116–120 落点

const GoldFill: React.FC<{d: string; x: number; o: number; id: string}> = ({d, x, o, id}) =>
  o > 0 ? (
    <g transform={`translate(${x},${BY}) scale(${S})`} opacity={o}>
      <defs>
        <linearGradient id={id} x1="0.2" x2="0.5" y1="0" y2="1">
          <stop offset="0" stopColor="#fff8ea" />
          <stop offset="0.35" stopColor="#ffe0a8" />
          <stop offset="0.75" stopColor="#f2b566" />
          <stop offset="1" stopColor="#d48a3e" />
        </linearGradient>
      </defs>
      <path d={d} fill={C.amber} opacity={0.55} filter="url(#hb18)" />
      <path d={d} fill="#ffd9a0" opacity={0.35} filter="url(#hb5)" />
      <path d={d} fill={`url(#${id})`} opacity={0.88} />
      <path d={d} fill="none" stroke="#fff8ea" strokeWidth={2.2 / S} opacity={0.9} />
    </g>
  ) : null;

export const S1: React.FC<{f: number}> = ({f}) => {
  const g = eio(prog(f, T0, T1 - T0));
  const pos = g * WTOT;
  let head: P | null = null;
  const nodes = SEGS.map((s, i) => {
    const lt = clamp((pos - STARTS[i]) / (WLEN[i] || 1));
    if (lt <= 0) return null;
    const {d, head: h} = partial(s.pts, lt);
    if (lt < 1 || (i === SEGS.length - 1 && g < 1)) head = h;
    if (s.kind === 'conn') {
      const fade = 1 - prog(f, 126, 40) * 0.75;
      return <path key={i} d={d} stroke="#f3c27e" strokeWidth={1.1} fill="none" opacity={0.42 * fade} strokeLinecap="round" />;
    }
    if (s.kind === 'green') return <GlowPath key={i} d={d} color={C.green} w={2.1} core="#eafff0" />;
    if (s.kind === 'lead') return <GlowPath key={i} d={d} w={2.4} o={1 - prog(f, 120, 50) * 0.35} />;
    return <GlowPath key={i} d={d} w={1.5} halo={0.7} />;
  });
  const fo = (k: keyof typeof DONE) => eo(clamp((g - DONE[k]) * 9));
  const land = prog(f, 115, 5);
  const ring = prog(f, 120, 30);
  const breathe = 1 + 0.012 * Math.sin(f * 0.05);
  const settle = 1 + 0.03 * eo(prog(f, 0, 200));
  return (
    <AbsoluteFill style={pushOut(f, 240)}>
      <AbsoluteFill style={{transform: `scale(${settle * breathe})`, transformOrigin: '960px 470px'}}>
        <Svg>
          <defs>
            <filter id="hb18" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation={18 / S} /></filter>
            <filter id="hb5" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation={5 / S} /></filter>
            <radialGradient id="pool"><stop offset="0" stopColor="#ff9a3a" stopOpacity="0.16" /><stop offset="0.5" stopColor="#ff8a2a" stopOpacity="0.06" /><stop offset="1" stopColor="#ff8a2a" stopOpacity="0" /></radialGradient>
          </defs>
          {/* 字下的暖光池 */}
          <ellipse cx={960} cy={480} rx={760} ry={300} fill="url(#pool)" opacity={eo(prog(f, 30, 80))} />
          <GoldFill d={GLYPHS.one.d} x={GX.one} o={fo('one')} id="gf1" />
          <GoldFill d={GLYPHS.percent.d} x={GX.percent} o={Math.min(fo('pctA'), 1) * 0.35 + fo('pctB') * 0.65} id="gf2" />
          <GoldFill d={GLYPHS.question.d} x={GX.question} o={eo(prog(f, 112, 10))} id="gf3" />
          {/* 幼苗叶片的淡绿填充 */}
          <g opacity={fo('sprout') * 0.35}>
            <path d={'M' + LEAF_L.map((p) => p.join(',')).join('L') + 'Z'} fill={C.green} filter="url(#b4)" />
            <path d={'M' + LEAF_R.map((p) => p.join(',')).join('L') + 'Z'} fill={C.green} filter="url(#b4)" />
          </g>
          {nodes}
          {land > 0 ? (
            <g>
              <path d={'M' + DOT.map((p) => p.join(',')).join('L') + 'Z'} fill="#fff1d2" opacity={eo(land)} />
              <circle cx={DOT_C[0]} cy={DOT_C[1]} r={30} fill={C.amber} opacity={0.4 * eo(land)} filter="url(#b10)" />
              <PenHead p={DOT_C} f={f} size={1.05 + (1 - ring) * 0.7} o={1 - prog(f, 150, 60) * 0.5} />
            </g>
          ) : head ? (
            <PenHead p={head} f={f} size={0.9} />
          ) : null}
          {ring > 0 && ring < 1 ? <circle cx={DOT_C[0]} cy={DOT_C[1]} r={20 + ring * 560} fill="none" stroke={C.gold} strokeWidth={4 * (1 - ring)} opacity={0.7 * (1 - ring)} filter="url(#b4)" /> : null}
          {/* 基线细光 */}
          <line x1={520} x2={1400} y1={BY + 1} y2={BY + 1} stroke="#f3c27e" strokeWidth={1} opacity={0.28 * eo(prog(f, 120, 20))} />
          <Label x={960} y={BY + 78} text="mỗi ngày  ·  365 ngày" size={22} color={C.dim} anchor="middle" o={prog(f, 150, 14)} ls={4} italic />
        </Svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

