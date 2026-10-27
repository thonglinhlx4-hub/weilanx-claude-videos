// ep55 柔光版素材：在 ep54 kit（fx.tsx → ep53 kit）之上覆盖。
// (a) 柔光：泛光层的半径 / 不透明度约为 ep54 后半段 GlowPath 的 0.6 倍，不用 HotLine、不用大 Flare；笔头星缩小、去掉蓝色长光条。
// (b) 一笔光：Ink 只画线，不画笔头；全片唯一的笔头 Pen 由 ink55.penAt 决定。
// (c) 文字：TX / TXw 一律整数像素、固定字号、不旋转、tabular-nums；TXw 的锚点经 makePJ 投影（平均 + 取整）。
import React from 'react';
import {C, FONT, H, P, SevenSeg, W, clamp, eo, prog} from '../ep54-hamso/fx';
import {Stroke, penAt, progOf, ptsOf} from './ink55';
import {partial} from './geo55';
import {PJ} from './cam55';

export {C, FONT, H, W, SevenSeg, clamp, eo, prog};
export {Svg, Space, GrainVignette, Sub} from '../ep54-hamso/fx';
export type {P};

export const TAB: React.CSSProperties = {fontVariantNumeric: 'tabular-nums'};

/** 柔光霓虹线：3 层泛光 + 暖白芯（比 ep54 GlowPath 暗约 40%） */
export const SoftGlow: React.FC<{d: string; color?: string; w?: number; o?: number; core?: string}> = ({d, color = C.gold, w = 2, o = 1, core = '#ffe9c8'}) => {
  if (!d || o <= 0) return null;
  const gold = color === C.gold;
  return (
    <g opacity={o} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={d} stroke={gold ? '#ffae4a' : color} strokeWidth={w * 6} opacity={0.15} filter="url(#b16)" />
      <path d={d} stroke={color} strokeWidth={w * 3} opacity={0.36} filter="url(#b7)" />
      <path d={d} stroke={gold ? C.mid : color} strokeWidth={w * 1.5} opacity={0.72} filter="url(#b2)" />
      <path d={d} stroke={core} strokeWidth={Math.max(0.9, w * 0.62)} opacity={0.88} />
    </g>
  );
};

/** 一笔：画出 stroke 当前进度的线（不画笔头） */
export const Ink: React.FC<{s: Stroke; f: number; o?: number; full?: boolean}> = ({s, f, o = 1, full}) => {
  if (o <= 0) return null;
  const t = full ? 1 : progOf(s, f);
  if (t <= 0) return null;
  const e = t;
  const from = s.tail ? Math.max(0, e - s.tail) : 0;
  if (s.tail && t >= 1) return null;
  const {d} = partial(ptsOf(s, f), e, from);
  return <SoftGlow d={d} color={s.color} w={s.w} o={o} core={s.core} />;
};

/** 唯一笔头：小白热点 + 柔和暖晕 + 短横向光条（亮度约为 ep54 PenHead 的 0.55） */
export const Pen: React.FC<{f: number; o?: number}> = ({f, o: oo = 1}) => {
  const pp = penAt(f);
  if (!pp || pp.o * oo <= 0.01) return null;
  const {p, o} = pp;
  const fl = 1 + 0.04 * Math.sin(f * 0.9);
  const s = 0.62 * fl;
  return (
    <g transform={`translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`} opacity={o * oo} style={{mixBlendMode: 'screen'}}>
      <circle r={120 * s} fill="url(#halo2)" opacity={0.28} />
      <circle r={44 * s} fill="url(#halo2)" opacity={0.62} />
      <rect x={-190 * s} y={-1.2 * s} width={380 * s} height={2.4 * s} fill="url(#streak)" opacity={0.45} />
      <path d={`M${-40 * s},0 Q0,${-4 * s} ${40 * s},0 Q0,${4 * s} ${-40 * s},0 Z M0,${-22 * s} Q${4 * s},0 0,${22 * s} Q${-4 * s},0 0,${-22 * s} Z`} fill="#fff3dc" opacity={0.6} />
      <circle r={5.5} fill="#fff8ec" opacity={0.95} />
    </g>
  );
};

type TxtP = {text: string; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number; italic?: boolean; ls?: number; o?: number; glow?: string; glowO?: number};
/** 屏幕文字：整数像素、固定字号、不旋转、等宽数字；可选一层柔和辉光 */
export const TX: React.FC<TxtP & {x: number; y: number}> = ({x, y, text, size = 26, color = 'rgba(236,230,218,0.9)', anchor = 'start', weight = 400, italic = false, ls = 0.5, o = 1, glow, glowO = 0.45}) => {
  if (o <= 0.003) return null;
  const X = Math.round(x), Y = Math.round(y);
  const common = {x: X, y: Y, fontFamily: FONT.serif, fontSize: size, textAnchor: anchor, fontWeight: weight, fontStyle: italic ? 'italic' : 'normal', letterSpacing: ls, style: TAB} as const;
  return (
    <g opacity={o}>
      {glow ? <text {...common} fill={glow} opacity={glowO} filter="url(#b4)">{text}</text> : null}
      <text {...common} fill={color}>{text}</text>
    </g>
  );
};
/** 世界锚点文字：锚点经 pj 投影成整数像素 */
export const TXw: React.FC<TxtP & {pj: PJ; p: P}> = ({pj, p, ...r}) => {
  const [X, Y] = pj(p);
  return <TX x={X} y={Y} {...r} />;
};
/** 发光标题字：淡入 + 从左到右的遮罩揭开（字形本身不动） */
export const GText: React.FC<TxtP & {x: number; y: number; f: number; at: number; dur?: number; id: string}> = ({x, y, f, at, dur = 16, id, size = 60, anchor = 'middle', text, color = '#ffe2b0', glow = '#ff9a3a', glowO = 0.5, o = 1, ...r}) => {
  const t = prog(f, at, dur);
  if (t <= 0 || o <= 0) return null;
  const wEst = text.length * size * 0.62 + size;
  const x0 = anchor === 'middle' ? x - wEst / 2 : anchor === 'end' ? x - wEst : x;
  const rev = eo(t);
  return (
    <g opacity={o * clamp(t * 2.2)}>
      <defs><clipPath id={'gt-' + id}><rect x={Math.round(x0 - size * 0.3)} y={Math.round(y - size * 1.3)} width={Math.round((wEst + size * 0.6) * rev)} height={Math.round(size * 1.8)} /></clipPath></defs>
      <g clipPath={`url(#gt-${id})`}>
        <TX x={x} y={y} text={text} size={size} anchor={anchor} color={color} glow={glow} glowO={glowO} {...r} />
      </g>
    </g>
  );
};
/** 柔光数码管：ep53 的 SevenSeg 外面再压一层透明度，位置取整 */
export const LED: React.FC<{value: string; x: number; y: number; size?: number; color?: string; o?: number; ghostO?: number}> = ({value, x, y, size = 50, color = '#ff4a32', o = 1, ghostO}) =>
  o > 0 ? <g opacity={o * 0.86}><SevenSeg value={value} x={Math.round(x)} y={Math.round(y)} size={size} color={color} ghostO={ghostO} /></g> : null;
export const ledWidth = (value: string, size: number) => { const n = value.replace(/[.,]/g, '').length; return n * size * 0.7 - size * 0.18; };

/** 柔边深色衬底（屏幕层文字下面） */
export const Backing: React.FC<{x: number; y: number; w: number; h: number; o?: number}> = ({x, y, w, h, o = 1}) =>
  o > 0 ? <rect x={x} y={y} width={w} height={h} rx={28} fill="#05050a" opacity={0.62 * o} filter="url(#b16)" /> : null;

/** 场景可见度：淡入 a..a+din，淡出 b-dout..b */
export const vis = (f: number, a: number, b: number, din = 12, dout = 14) => Math.min(eo(prog(f, a, din)), 1 - prog(f, b - dout, dout));
