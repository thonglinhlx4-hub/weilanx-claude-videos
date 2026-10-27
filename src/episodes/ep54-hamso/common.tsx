// ep54 公共小件：坐标网格图、数码管读数、描边写字（斜体衬线）、绿色线描蔬菜、对勾叉号。
import React from 'react';
import {C, FONT, GlowPath, Label, P, PenHead, SevenSeg, clamp, eo, partial, prog} from './fx';

export type Cfg = {ox: number; oy: number; w: number; h: number; xMax: number; yMax: number; xTicks: number[]; yTicks: number[]; xName: string; yName: string};
export const px = (c: Cfg, x: number, y: number): P => [c.ox + (x / c.xMax) * c.w, c.oy - (y / c.yMax) * c.h];

export const Chart: React.FC<{c: Cfg; f: number; at: number; id: string}> = ({c, f, at, id}) => {
  const g = eo(prog(f, at, 22));
  const step = 54;
  const x0 = c.ox - 90, x1 = c.ox + c.w + 120, y0 = c.oy - c.h - 110, y1 = c.oy + 60;
  const sweep = x0 + (x1 - x0) * g;
  const ax = eo(prog(f, at + 2, 20)), ay = eo(prog(f, at + 8, 20));
  const lab = prog(f, at + 14, 12);
  return (
    <g>
      <defs>
        <radialGradient id={`gf-${id}`} cx="0.5" cy="0.5" r="0.62"><stop offset="0.6" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
        <mask id={`gm-${id}`}><rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#gf-${id})`} /></mask>
      </defs>
      <g mask={`url(#gm-${id})`} strokeWidth={1}>
        {Array.from({length: Math.floor((x1 - x0) / step) + 1}).map((_, i) => {
          const x = x0 + i * step;
          return x <= sweep ? <line key={'v' + i} x1={x} x2={x} y1={y0} y2={y1} stroke={i % 2 ? C.gridFaint : C.grid} /> : null;
        })}
        {Array.from({length: Math.floor((y1 - y0) / step) + 1}).map((_, i) => (
          <line key={'h' + i} x1={x0} x2={sweep} y1={y1 - i * step} y2={y1 - i * step} stroke={i % 2 ? C.gridFaint : C.grid} />
        ))}
      </g>
      <g stroke="rgba(225,228,255,0.78)" strokeWidth={1.6} fill="none">
        <path d={`M${c.ox - 20},${c.oy} L${c.ox + c.w + 70},${c.oy}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ax} />
        <path d={`M${c.ox},${c.oy + 20} L${c.ox},${c.oy - c.h - 70}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ay} />
        {ax > 0.98 ? <path d={`M${c.ox + c.w + 58},${c.oy - 6} L${c.ox + c.w + 70},${c.oy} L${c.ox + c.w + 58},${c.oy + 6}`} /> : null}
        {ay > 0.98 ? <path d={`M${c.ox - 6},${c.oy - c.h - 58} L${c.ox},${c.oy - c.h - 70} L${c.ox + 6},${c.oy - c.h - 58}`} /> : null}
      </g>
      <g opacity={lab}>
        {c.xTicks.map((t) => {
          const [x] = px(c, t, 0);
          return (
            <g key={'xt' + t}>
              <line x1={x} x2={x} y1={c.oy - 5} y2={c.oy + 5} stroke="rgba(225,228,255,0.6)" />
              <Label x={x} y={c.oy + 32} text={String(t)} size={17} color={C.dim} anchor="middle" />
            </g>
          );
        })}
        {c.yTicks.map((t) => {
          const [, y] = px(c, 0, t);
          return (
            <g key={'yt' + t}>
              <line x1={c.ox - 5} x2={c.ox + 5} y1={y} y2={y} stroke="rgba(225,228,255,0.6)" />
              <Label x={c.ox - 16} y={y + 6} text={String(t)} size={17} color={C.dim} anchor="end" />
            </g>
          );
        })}
        <Label x={c.ox + c.w + 40} y={c.oy + 64} text={c.xName} size={19} color={C.label} anchor="middle" />
        <Label x={c.ox + 16} y={c.oy - c.h - 78} text={c.yName} size={19} color={C.label} />
      </g>
    </g>
  );
};

/** 数码管读数面板：标签 + LED + 单位 */
export const Readout: React.FC<{x: number; y: number; rows: {label: string; value: string; unit?: string; color?: string}[]; f: number; at: number; size?: number; lw?: number}> = ({x, y, rows, f, at, size = 40, lw = 190}) => {
  const o = eo(prog(f, at, 8));
  if (o <= 0) return null;
  const flick = f - at < 8 ? (Math.floor(f) % 2 ? 0.45 : 1) : 1;
  return (
    <g opacity={o * flick}>
      {rows.map((r, i) => (
        <g key={i}>
          <Label x={x} y={y + i * (size + 26) + size * 0.72} text={r.label} size={17} color={C.label} ls={2} />
          <SevenSeg value={r.value} x={x + lw} y={y + i * (size + 26)} size={size} color={r.color ?? C.red} />
          {r.unit ? <Label x={x + lw + r.value.replace(/[.,]/g, '').length * size * 0.7 + 14} y={y + i * (size + 26) + size * 0.92} text={r.unit} size={16} color={C.dim} /> : null}
        </g>
      ))}
    </g>
  );
};

/** 斜体衬线文字被光笔描出（dashoffset），描完后轻填充 */
export const PenText: React.FC<{text: string; f: number; at: number; dur: number; x: number; y: number; size: number; anchor?: 'start' | 'middle' | 'end'; italic?: boolean; color?: string; fillO?: number; o?: number}> = ({text, f, at, dur, x, y, size, anchor = 'start', italic = true, color = C.mid, fillO = 0.85, o = 1}) => {
  const t = eo(prog(f, at, dur));
  if (t <= 0) return null;
  const Ln = 3000;
  const fill = clamp((prog(f, at, dur) - 0.75) * 4) * fillO;
  const common = {x, y, fontFamily: FONT.serif, fontSize: size, fontStyle: italic ? 'italic' : 'normal', textAnchor: anchor, strokeDasharray: `${Ln} ${Ln}`, strokeDashoffset: Ln * (1 - t)} as const;
  return (
    <g opacity={o}>
      <text {...common} fill={C.amber} fillOpacity={fill * 0.5} stroke={C.amber} strokeWidth={size * 0.05} strokeOpacity={0.4} filter="url(#b10)">{text}</text>
      <text {...common} fill={color} fillOpacity={fill} stroke={color} strokeWidth={size * 0.02} filter="url(#b1)">{text}</text>
      <text {...common} fill="none" stroke={C.core} strokeWidth={Math.max(0.8, size * 0.008)}>{text}</text>
    </g>
  );
};

const qb = (a: P, c: P, b: P, n = 14): P[] =>
  Array.from({length: n + 1}, (_, i) => {
    const t = i / n;
    return [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]] as P;
  });
/** 线描卷心菜（相对中心 cx,cy，尺寸 s）：外圈叶 + 内层叶脉，一笔连下来 */
export const cabbagePts = (cx: number, cy: number, s: number): P[][] => {
  const k = (x: number, y: number): P => [cx + x * s, cy + y * s];
  const outer: P[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = -Math.PI / 2 + (i / 64) * Math.PI * 2;
    const r = 1 + 0.07 * Math.sin(a * 7) + 0.04 * Math.sin(a * 3 + 1);
    outer.push(k(Math.cos(a) * r * 0.95, Math.sin(a) * r));
  }
  const leafL = [...qb(k(0, 0.95), k(-0.9, 0.3), k(-0.35, -0.85)), ...qb(k(-0.35, -0.85), k(-0.1, 0), k(0, 0.95)).slice(1)];
  const leafR = [...qb(k(0, 0.95), k(0.9, 0.25), k(0.4, -0.8)), ...qb(k(0.4, -0.8), k(0.1, 0), k(0, 0.95)).slice(1)];
  const vein = qb(k(0, 0.95), k(0.05, 0.1), k(-0.05, -0.75));
  const v1 = qb(k(-0.02, 0.4), k(-0.3, 0.25), k(-0.5, 0.05), 8);
  const v2 = qb(k(0.02, 0.2), k(0.3, 0.05), k(0.5, -0.15), 8);
  return [outer, leafL, leafR, vein, v1, v2];
};
export const Veggie: React.FC<{cx: number; cy: number; s: number; f: number; at: number; dur: number; o?: number; head?: boolean}> = ({cx, cy, s, f, at, dur, o = 1, head = true}) => {
  const parts = cabbagePts(cx, cy, s);
  const T = prog(f, at, dur);
  if (T <= 0) return null;
  let hp: P | null = null;
  const fillO = clamp((T - 0.85) * 6) * 0.22;
  return (
    <g opacity={o}>
      <path d={'M' + parts[0].map((p) => p.join(',')).join('L') + 'Z'} fill={C.green} opacity={fillO} filter="url(#b4)" />
      {parts.map((pts, i) => {
        const t0 = i === 0 ? 0 : 0.45 + (i - 1) * 0.11;
        const t1 = i === 0 ? 0.45 : t0 + 0.13;
        const lt = eo(clamp((T - t0) / (t1 - t0)));
        if (lt <= 0) return null;
        const {d, head: h} = partial(pts, lt);
        if (lt < 1) hp = h;
        return <GlowPath key={i} d={d} color={C.green} w={i === 0 ? 2.2 : 1.4} core="#eafff0" />;
      })}
      {head && hp ? <PenHead p={hp} f={f} size={0.8} /> : null}
    </g>
  );
};

export const Check: React.FC<{x: number; y: number; s?: number; f: number; at: number}> = ({x, y, s = 1, f, at}) => {
  const t = eo(prog(f, at, 10));
  if (t <= 0) return null;
  const d = `M${x - 22 * s},${y} L${x - 6 * s},${y + 18 * s} L${x + 28 * s},${y - 24 * s}`;
  return <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} stroke={C.green} strokeWidth={5 * s} fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#b1)" />;
};
export const Cross: React.FC<{x: number; y: number; s?: number; f: number; at: number}> = ({x, y, s = 1, f, at}) => {
  const t = eo(prog(f, at, 10));
  if (t <= 0) return null;
  const r = 22 * s;
  return (
    <g stroke={C.red} strokeWidth={5 * s} strokeLinecap="round" filter="url(#b1)">
      <path d={`M${x - r},${y - r} L${x + r},${y + r}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(t * 2)} />
      <path d={`M${x + r},${y - r} L${x - r},${y + r}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(t * 2 - 1)} />
    </g>
  );
};

/** 发光圆角框里的一行小字：淡入 */
export const Fade: React.FC<{f: number; at: number; d?: number; children: React.ReactNode; dy?: number}> = ({f, at, d = 10, children, dy = 10}) => {
  const t = eo(prog(f, at, d));
  if (t <= 0) return null;
  return <g opacity={t} transform={`translate(0,${(1 - t) * dy})`}>{children}</g>;
};
