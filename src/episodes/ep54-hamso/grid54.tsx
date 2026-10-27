// ep54 v3：一次函数 / 分段函数段（7.4 s – 40 s）的特效件——对标参考片：
// 满屏深蓝发光网格（细线 + 亮主线 + 柔光 + 暗角，从笔头径向浮现）、带透视的跟拍相机（慢推 + 漂移 + 节拍推近）、
// 大号红色数码管、大光斑点（核心 + 横向光条 + 光晕 + 镜头鬼影）、发光坐标值、斜写标签、火花、红色印章。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, H, Label, P, SevenSeg, W, clamp, eio, eo, prog, rand} from './fx';

/* ---------- 相机 ---------- */
export type Cam = {z: number; fx: number; fy: number; rx: number; ry: number};
export const CAM0: Cam = {z: 1, fx: W / 2, fy: H / 2, rx: 0, ry: 0};
export const camG = (c: Cam) => `translate(${W / 2} ${H / 2}) scale(${c.z.toFixed(4)}) translate(${(-c.fx).toFixed(1)} ${(-c.fy).toFixed(1)})`;
export const camCss = (c: Cam, extraRx = 0): React.CSSProperties => ({
  transform: `perspective(2300px) rotateX(${(c.rx + extraRx).toFixed(2)}deg) rotateY(${c.ry.toFixed(2)}deg)`,
  transformOrigin: '50% 55%',
});
/** 世界 → 屏幕（只算 2D 部分，忽略小角度倾斜） */
export const camApply = (c: Cam, p: P): P => [W / 2 + (p[0] - c.fx) * c.z, H / 2 + (p[1] - c.fy) * c.z];

/** 相机世界：CSS 透视倾斜 + SVG 缩放平移（矢量缩放保持清晰） */
export const CamWorld: React.FC<{cam: Cam; children: React.ReactNode; style?: React.CSSProperties; svg?: (c: React.ReactNode) => React.ReactNode}> = ({cam, children, style}) => (
  <AbsoluteFill style={{...camCss(cam), ...style}}>{children}</AbsoluteFill>
);

/* ---------- 满屏发光网格 ---------- */
export const GX0 = 36, GY0 = 40, GSTEP = 54; // 网格线经过两张图的原点（360,850）与（306,850）
const GMAJ = 5;
const EXT = {x0: -700, x1: W + 700, y0: -500, y1: H + 500};
const gridLines = () => {
  const minor: string[] = [], major: string[] = [];
  const i0 = Math.floor((EXT.x0 - GX0) / GSTEP), i1 = Math.ceil((EXT.x1 - GX0) / GSTEP);
  for (let i = i0; i <= i1; i++) {
    const x = GX0 + i * GSTEP;
    ((((i - 6) % GMAJ) + GMAJ) % GMAJ === 0 ? major : minor).push(`M${x},${EXT.y0}V${EXT.y1}`);
  }
  const j0 = Math.floor((EXT.y0 - GY0) / GSTEP), j1 = Math.ceil((EXT.y1 - GY0) / GSTEP);
  for (let j = j0; j <= j1; j++) {
    const y = GY0 + j * GSTEP;
    ((((j - 15) % GMAJ) + GMAJ) % GMAJ === 0 ? major : minor).push(`M${EXT.x0},${y}H${EXT.x1}`);
  }
  // 次细线（半格）
  const fine: string[] = [];
  for (let i = i0; i <= i1; i++) fine.push(`M${GX0 + i * GSTEP + GSTEP / 2},${EXT.y0}V${EXT.y1}`);
  for (let j = j0; j <= j1; j++) fine.push(`M${EXT.x0},${GY0 + j * GSTEP + GSTEP / 2}H${EXT.x1}`);
  return {minor: minor.join(''), major: major.join(''), fine: fine.join('')};
};
const GL = gridLines();

/** reveal 0..1：从 (cx,cy) 径向浮现；o 总不透明度；floorRx 额外倾斜（变成 3D 地面） */
export const GridStage: React.FC<{cam: Cam; reveal: number; cx: number; cy: number; o?: number; floorRx?: number; f: number}> = ({cam, reveal, cx, cy, o = 1, floorRx = 0, f}) => {
  if (o <= 0 || reveal <= 0) return null;
  const R = 120 + 2500 * eo(reveal);
  const ring = reveal < 1 ? 1 - reveal : 0;
  const breathe = 0.92 + 0.08 * Math.sin(f * 0.045);
  return (
    <AbsoluteFill style={{...camCss(cam, floorRx), transformOrigin: floorRx ? '50% 78%' : '50% 55%', opacity: o}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <filter id="gb3" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="gb9" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9" /></filter>
          <radialGradient id="gRev" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R}>
            <stop offset="0" stopColor="#fff" /><stop offset="0.5" stopColor="#fff" /><stop offset="1" stopColor="#000" />
          </radialGradient>
          <radialGradient id="gRing" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R}>
            <stop offset="0.45" stopColor="#000" /><stop offset="0.82" stopColor="#fff" /><stop offset="1" stopColor="#000" />
          </radialGradient>
          <radialGradient id="gVig" gradientUnits="userSpaceOnUse" cx={W / 2} cy={H * 0.52} r={W * 0.62}>
            <stop offset="0" stopColor="#fff" /><stop offset="0.5" stopColor="#d0d0d0" /><stop offset="0.8" stopColor="#555" /><stop offset="1" stopColor="#151515" />
          </radialGradient>
          <radialGradient id="gNavy" gradientUnits="userSpaceOnUse" cx={W / 2} cy={H * 0.5} r={W * 0.75}>
            <stop offset="0" stopColor="#0d1940" stopOpacity="0.5" /><stop offset="0.6" stopColor="#070f28" stopOpacity="0.38" /><stop offset="1" stopColor="#03050e" stopOpacity="0" />
          </radialGradient>
          <mask id="gRevM" maskUnits="userSpaceOnUse" x={EXT.x0} y={EXT.y0} width={EXT.x1 - EXT.x0} height={EXT.y1 - EXT.y0}>
            <rect x={EXT.x0} y={EXT.y0} width={EXT.x1 - EXT.x0} height={EXT.y1 - EXT.y0} fill="url(#gRev)" />
          </mask>
          <mask id="gVigM" maskUnits="userSpaceOnUse" x={EXT.x0} y={EXT.y0} width={EXT.x1 - EXT.x0} height={EXT.y1 - EXT.y0}>
            <rect x={EXT.x0} y={EXT.y0} width={EXT.x1 - EXT.x0} height={EXT.y1 - EXT.y0} fill="url(#gVig)" />
          </mask>
          <mask id="gRingM" maskUnits="userSpaceOnUse" x={EXT.x0} y={EXT.y0} width={EXT.x1 - EXT.x0} height={EXT.y1 - EXT.y0}>
            <rect x={EXT.x0} y={EXT.y0} width={EXT.x1 - EXT.x0} height={EXT.y1 - EXT.y0} fill="url(#gRing)" />
          </mask>
        </defs>
        <g transform={camG(cam)}>
          <g mask="url(#gRevM)">
            <rect x={EXT.x0} y={EXT.y0} width={EXT.x1 - EXT.x0} height={EXT.y1 - EXT.y0} fill="url(#gNavy)" />
            <g mask="url(#gVigM)" fill="none" opacity={breathe}>
              <path d={GL.major} stroke="#3f6cff" strokeWidth={7} opacity={0.32} filter="url(#gb9)" />
              <path d={GL.minor} stroke="#3a62e8" strokeWidth={3.5} opacity={0.22} filter="url(#gb3)" />
              {/* v4：细线加粗、降透明度，减少相机移动时的锯齿闪烁 */}
              <path d={GL.fine} stroke="#3554c8" strokeWidth={1.5} opacity={0.12} />
              <path d={GL.minor} stroke="#5277f0" strokeWidth={1.6} opacity={0.36} />
              <path d={GL.major} stroke="#86a2ff" strokeWidth={1.6} opacity={0.78} />
            </g>
          </g>
          {ring > 0 ? (
            <g mask="url(#gRingM)" fill="none" opacity={ring}>
              <path d={GL.minor + GL.major} stroke="#cfe0ff" strokeWidth={2.2} />
              <path d={GL.minor + GL.major} stroke="#7fa2ff" strokeWidth={8} opacity={0.6} filter="url(#gb9)" />
            </g>
          ) : null}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ---------- 发光线（比 GlowPath 更粗的白热芯 + 更强的金色泛光） ---------- */
export const HotLine: React.FC<{d: string; w?: number; o?: number; color?: string; core?: string}> = ({d, w = 3.2, o = 1, color = C.gold, core = '#fffaf0'}) => {
  if (!d) return null;
  const gold = color === C.gold;
  return (
    <g opacity={o} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={d} stroke={gold ? '#ff9a3a' : color} strokeWidth={w * 16} opacity={0.26} filter="url(#b36)" />
      <path d={d} stroke={gold ? '#ffb04e' : color} strokeWidth={w * 7} opacity={0.5} filter="url(#b16)" />
      <path d={d} stroke={gold ? '#ffc56a' : color} strokeWidth={w * 3.4} opacity={0.9} filter="url(#b7)" />
      <path d={d} stroke={gold ? '#ffe0a0' : color} strokeWidth={w * 1.9} opacity={1} filter="url(#b2)" />
      <path d={d} stroke={core} strokeWidth={w * 1.05} />
      <path d={d} stroke="#ffffff" strokeWidth={w * 0.45} />
    </g>
  );
};

/* ---------- 大光斑点 ---------- */
export const Flare: React.FC<{p: P; f: number; size?: number; o?: number; ghost?: boolean}> = ({p, f, size = 1, o = 1, ghost = true}) => {
  if (o <= 0) return null;
  const fl = 1 + 0.12 * Math.sin(f * 1.7) + 0.06 * Math.sin(f * 4.1);
  const s = size * fl;
  const spike = (L: number, wd: number, a: number) => {
    const c = Math.cos(a), sn = Math.sin(a);
    const q = (x: number, y: number) => `${(x * c - y * sn).toFixed(1)},${(x * sn + y * c).toFixed(1)}`;
    return `M${q(-L, 0)} Q${q(0, -wd)} ${q(L, 0)} Q${q(0, wd)} ${q(-L, 0)} Z`;
  };
  // 镜头鬼影：沿 点→画面中心 方向
  const gx = W / 2 - p[0], gy = H / 2 - p[1];
  return (
    <g opacity={o} style={{mixBlendMode: 'screen'}}>
      <g transform={`translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`}>
        <circle r={260 * s} fill="url(#halo2)" opacity={0.38} />
        <circle r={95 * s} fill="url(#halo2)" opacity={1} />
        <ellipse rx={480 * s} ry={13 * s} fill="url(#streakB)" opacity={0.42} filter="url(#b2)" />
        <rect x={-400 * s} y={-2.2 * s} width={800 * s} height={4.4 * s} fill="url(#streak)" opacity={0.95} />
        <rect x={-1.2} y={-150 * s} width={2.4} height={300 * s} fill="url(#flareV)" opacity={0.6} />
        <path d={spike(78 * s, 7 * s, 0)} fill="#fff6e2" opacity={0.95} />
        <path d={spike(46 * s, 5 * s, Math.PI / 2)} fill="#fff6e2" opacity={0.85} />
        <path d={spike(30 * s, 3 * s, Math.PI / 4 + f * 0.01)} fill="#ffe9c8" opacity={0.5} />
        <path d={spike(30 * s, 3 * s, -Math.PI / 4 + f * 0.01)} fill="#ffe9c8" opacity={0.5} />
        <circle r={44 * s} fill="none" stroke="#ffd9a0" strokeWidth={1.4} opacity={0.22} />
        <circle r={20 * size} fill="#fff4dc" filter="url(#b7)" />
        <circle r={11 * size} fill="#ffffff" />
      </g>
      {ghost ? (
        <g opacity={0.16}>
          <circle cx={p[0] + gx * 0.55} cy={p[1] + gy * 0.55} r={34 * size} fill="#9fb4ff" filter="url(#b4)" />
          <circle cx={p[0] + gx * 1.25} cy={p[1] + gy * 1.25} r={18 * size} fill="#ffc070" filter="url(#b2)" />
        </g>
      ) : null}
    </g>
  );
};

/* ---------- 大号数码管读数 ---------- */
export type Row = {label: string; value: string; unit?: string; color?: string; hot?: number};
export const LedPanel: React.FC<{x: number; y: number; rows: Row[]; f: number; at: number; size?: number; lw?: number; gapY?: number; o?: number; digits?: number}> = ({x, y, rows, f, at, size = 76, lw = 210, gapY = 32, o: oo = 1, digits = 4}) => {
  const o = eo(prog(f, at, 8)) * oo;
  if (o <= 0) return null;
  const flick = f - at < 9 ? (Math.floor((f - at) / 2) % 2 ? 0.35 : 1) : 1; // v4：开机闪烁每 2 帧换一次
  const cellW = size * 0.52 + size * 0.18;
  return (
    <g opacity={o * flick}>
      {rows.map((r, i) => {
        const yy = y + i * (size + gapY);
        const col = r.color ?? '#ff4a32';
        const n = r.value.replace(/[.,]/g, '').length;
        const hot = r.hot ?? 0;
        return (
          <g key={i}>
            <Label x={x} y={yy + size * 0.66} text={r.label} size={26} color="rgba(240,232,220,0.92)" ls={2.5} weight={500} />
            <rect x={x + lw - 18} y={yy - 14} width={Math.max(n, digits) * cellW + 26} height={size + 28} rx={6} fill="#2a0604" opacity={0.55} stroke="#ff5a3c" strokeOpacity={0.18} />
            <g filter="url(#b16)" opacity={0.65 + 0.3 * hot}><SevenSeg value={r.value} x={x + lw} y={yy} size={size} color={col} ghost={false} /></g>
            <SevenSeg value={r.value} x={x + lw} y={yy} size={size} color={col} />
            <SevenSeg value={r.value} x={x + lw} y={yy} size={size} color="#ffe6da" ghost={false} o={0.42 + 0.4 * hot} />
            {r.unit ? <Label x={x + lw + Math.max(n, digits) * cellW + 22} y={yy + size * 0.95} text={r.unit} size={22} color="rgba(230,222,210,0.7)" /> : null}
          </g>
        );
      })}
    </g>
  );
};

/* ---------- 发光文字（衬线），可写出 ---------- */
export const GlowText: React.FC<{x: number; y: number; text: string; size: number; color?: string; glow?: string; f: number; at: number; dur?: number; italic?: boolean; anchor?: 'start' | 'middle' | 'end'; rotate?: number; weight?: number; ls?: number; o?: number}> = ({x, y, text, size, color = '#ffd99a', glow = '#ff9a3a', f, at, dur = 18, italic = true, anchor = 'start', rotate = 0, weight = 400, ls = 0, o = 1}) => {
  const t = prog(f, at, dur);
  if (t <= 0 || o <= 0) return null;
  const Ln = 2400;
  const off = Ln * (1 - eo(clamp(t * 1.25)));
  const fill = clamp((t - 0.45) * 2.2);
  const common = {x, y, fontFamily: FONT.serif, fontSize: size, fontStyle: italic ? 'italic' : 'normal', fontWeight: weight, textAnchor: anchor, letterSpacing: ls} as const;
  return (
    <g opacity={o} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>
      <text {...common} fill={glow} fillOpacity={0.75 * fill} stroke={glow} strokeWidth={size * 0.06} strokeOpacity={0.55} strokeDasharray={`${Ln} ${Ln}`} strokeDashoffset={off} filter="url(#b16)">{text}</text>
      <text {...common} fill={glow} fillOpacity={0.6 * fill} filter="url(#b4)">{text}</text>
      <text {...common} fill={color} fillOpacity={fill} stroke={color} strokeWidth={size * 0.022} strokeDasharray={`${Ln} ${Ln}`} strokeDashoffset={off} filter="url(#b1)">{text}</text>
      <text {...common} fill="#fff8ec" fillOpacity={fill * 0.55} stroke="#fffaf0" strokeWidth={Math.max(0.8, size * 0.01)} strokeDasharray={`${Ln} ${Ln}`} strokeDashoffset={off}>{text}</text>
    </g>
  );
};

/* ---------- 坐标轴（无网格，网格交给 GridStage） ---------- */
export type Cfg = {ox: number; oy: number; w: number; h: number; xMax: number; yMax: number; xTicks: number[]; yTicks: number[]; xName: string; yName: string};
export const px = (c: Cfg, x: number, y: number): P => [c.ox + (x / c.xMax) * c.w, c.oy - (y / c.yMax) * c.h];
export const Axes: React.FC<{c: Cfg; f: number; at: number; o?: number; hide?: number[]; labels?: boolean}> = ({c, f, at, o = 1, hide = [], labels = true}) => {
  const ax = eo(prog(f, at + 2, 20)), ay = eo(prog(f, at + 8, 20));
  const lab = prog(f, at + 14, 12);
  const col = 'rgba(236,238,255,0.92)';
  return (
    <g opacity={o}>
      <g fill="none" strokeLinecap="round">
        <g stroke="#9fb4ff" strokeWidth={6} opacity={0.35} filter="url(#b4)">
          <path d={`M${c.ox - 20},${c.oy} L${c.ox + c.w + 80},${c.oy}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ax} />
          <path d={`M${c.ox},${c.oy + 20} L${c.ox},${c.oy - c.h - 80}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ay} />
        </g>
        <g stroke={col} strokeWidth={2}>
          <path d={`M${c.ox - 20},${c.oy} L${c.ox + c.w + 80},${c.oy}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ax} />
          <path d={`M${c.ox},${c.oy + 20} L${c.ox},${c.oy - c.h - 80}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ay} />
          {ax > 0.98 ? <path d={`M${c.ox + c.w + 66},${c.oy - 7} L${c.ox + c.w + 80},${c.oy} L${c.ox + c.w + 66},${c.oy + 7}`} /> : null}
          {ay > 0.98 ? <path d={`M${c.ox - 7},${c.oy - c.h - 66} L${c.ox},${c.oy - c.h - 80} L${c.ox + 7},${c.oy - c.h - 66}`} /> : null}
        </g>
      </g>
      <g opacity={lab}>
        {c.xTicks.map((t) => {
          const [x] = px(c, t, 0);
          return (
            <g key={'xt' + t} opacity={hide.includes(t) ? 0 : 1}>
              <line x1={x} x2={x} y1={c.oy - 7} y2={c.oy + 7} stroke={col} strokeWidth={1.5} />
              {labels ? <Label x={x} y={c.oy + 36} text={String(t)} size={22} color="rgba(220,226,255,0.78)" anchor="middle" /> : null}
            </g>
          );
        })}
        {c.yTicks.map((t) => {
          const [, y] = px(c, 0, t);
          return (
            <g key={'yt' + t} opacity={hide.includes(-t) ? 0 : 1}>
              <line x1={c.ox - 7} x2={c.ox + 7} y1={y} y2={y} stroke={col} strokeWidth={1.5} />
              {labels ? <Label x={c.ox - 18} y={y + 7} text={String(t)} size={22} color="rgba(220,226,255,0.78)" anchor="end" /> : null}
            </g>
          );
        })}
        {labels ? <Label x={c.ox + c.w + 96} y={c.oy + 8} text={c.xName} size={24} color="rgba(236,230,218,0.9)" /> : null}
        {labels ? <Label x={c.ox + 18} y={c.oy - c.h - 70} text={c.yName} size={24} color="rgba(236,230,218,0.9)" /> : null}
      </g>
    </g>
  );
};

/* ---------- v5：屏幕空间文字 ---------- */
// 文字锚点经 makePJ（完整相机投影 + 8 帧平均 + 取整）放到屏幕上；字形本身只做固定缩放 TS、不旋转、不随帧缩放，
// 所以静止段每帧栅格化结果完全相同。数字用 tabular-nums。
export type PJ = (p: P) => P;
export const TS = 1.06;
export const TAB: React.CSSProperties = {fontVariantNumeric: 'tabular-nums'};
/** 把以世界坐标写的子元素整体刚性平移到锚点 p 的屏幕整像素位置（固定缩放 s） */
export const At: React.FC<{pj: PJ; p: P; s?: number; children: React.ReactNode}> = ({pj, p, s = TS, children}) => {
  const [X, Y] = pj(p);
  return <g transform={`translate(${X} ${Y}) scale(${s}) translate(${(-p[0]).toFixed(3)} ${(-p[1]).toFixed(3)})`}>{children}</g>;
};
export const AxesLabels: React.FC<{c: Cfg; f: number; at: number; pj: PJ; o?: number; hide?: number[]}> = ({c, f, at, pj, o = 1, hide = []}) => {
  const lab = prog(f, at + 14, 12);
  if (lab <= 0 || o <= 0) return null;
  const tc = 'rgba(220,226,255,0.78)', nc = 'rgba(236,230,218,0.9)';
  return (
    <g opacity={o * lab} style={TAB}>
      {c.xTicks.map((t) => {
        if (hide.includes(t)) return null;
        const [x] = px(c, t, 0);
        return <At key={'xt' + t} pj={pj} p={[x, c.oy + 36]}><Label x={x} y={c.oy + 36} text={String(t)} size={22} color={tc} anchor="middle" /></At>;
      })}
      {c.yTicks.map((t) => {
        if (hide.includes(-t)) return null;
        const [, y] = px(c, 0, t);
        return <At key={'yt' + t} pj={pj} p={[c.ox - 18, y + 7]}><Label x={c.ox - 18} y={y + 7} text={String(t)} size={22} color={tc} anchor="end" /></At>;
      })}
      <At pj={pj} p={[c.ox + c.w + 96, c.oy + 8]}><Label x={c.ox + c.w + 96} y={c.oy + 8} text={c.xName} size={24} color={nc} /></At>
      <At pj={pj} p={[c.ox + 18, c.oy - c.h - 70]}><Label x={c.ox + 18} y={c.oy - c.h - 70} text={c.yName} size={24} color={nc} /></At>
    </g>
  );
};
/** 投影数值（屏幕空间；锚点随光点走，取整像素；数值本身由调用方每 2 帧量化） */
export const ProjText: React.FC<{c: Cfg; p: P; xv: string; yv: string; pj: PJ; o?: number}> = ({c, p, xv, yv, pj, o = 1}) => {
  const a: P = [p[0], c.oy + 68], b: P = [c.ox - 62, p[1] + 9];
  return (
    <g opacity={o} fontFamily={FONT.serif} fontSize={28} fontWeight={500} style={TAB}>
      <At pj={pj} p={a}>
        <text x={a[0]} y={a[1]} textAnchor="middle" fill="#ff9a3a" filter="url(#b4)" opacity={0.9}>{xv}</text>
        <text x={a[0]} y={a[1]} textAnchor="middle" fill="#fff0d0">{xv}</text>
      </At>
      <At pj={pj} p={b}>
        <text x={b[0]} y={b[1]} textAnchor="end" fill="#ff9a3a" filter="url(#b4)" opacity={0.9}>{yv}</text>
        <text x={b[0]} y={b[1]} textAnchor="end" fill="#fff0d0">{yv}</text>
      </At>
    </g>
  );
};

/** 投影虚线 + 坐标轴上的发光数值 */
export const Projection: React.FC<{c: Cfg; p: P; xv: string; yv: string; o?: number; color?: string; text?: boolean}> = ({c, p, xv, yv, o = 1, color = '#ffd28a', text = true}) => (
  <g opacity={o}>
    <g stroke={color} strokeDasharray="7 7" strokeWidth={1.8} opacity={0.85}>
      <line x1={p[0]} x2={p[0]} y1={p[1]} y2={c.oy} />
      <line x1={c.ox} x2={p[0]} y1={p[1]} y2={p[1]} />
    </g>
    <circle cx={p[0]} cy={c.oy} r={5} fill="#fff3d8" />
    <circle cx={c.ox} cy={p[1]} r={5} fill="#fff3d8" />
    {text ? <g fontFamily={FONT.serif} fontSize={28} fontWeight={500}>
      <text x={p[0]} y={c.oy + 68} textAnchor="middle" fill="#ff9a3a" filter="url(#b4)" opacity={0.9}>{xv}</text>
      <text x={p[0]} y={c.oy + 68} textAnchor="middle" fill="#fff0d0">{xv}</text>
      <text x={c.ox - 62} y={p[1] + 9} textAnchor="end" fill="#ff9a3a" filter="url(#b4)" opacity={0.9}>{yv}</text>
      <text x={c.ox - 62} y={p[1] + 9} textAnchor="end" fill="#fff0d0">{yv}</text>
    </g> : null}
  </g>
);

/** 小发光标记点 */
export const Marker: React.FC<{p: P; o?: number; r?: number; color?: string}> = ({p, o = 1, r = 7, color = '#fff6e0'}) => (
  <g opacity={o}>
    <circle cx={p[0]} cy={p[1]} r={r * 5} fill="url(#halo2)" opacity={0.75} />
    <circle cx={p[0]} cy={p[1]} r={r * 1.6} fill="#ffcf7a" filter="url(#b4)" />
    <circle cx={p[0]} cy={p[1]} r={r} fill={color} />
  </g>
);

/* ---------- 火花：从 (x,y) 向下爆开，重力 ---------- */
export const Sparks: React.FC<{p: P; f: number; at: number; n?: number; scale?: number}> = ({p, f, at, n = 46, scale = 1}) => {
  const t = f - at;
  if (t < 0 || t > 52) return null;
  return (
    <g style={{mixBlendMode: 'screen'}} strokeLinecap="round">
      {Array.from({length: n}).map((_, i) => {
        const life = 26 + rand(i * 5 + 1) * 26;
        if (t > life) return null;
        const a = Math.PI * (0.05 + 0.9 * rand(i * 5 + 2)) + (rand(i * 5 + 3) - 0.5) * 0.6 - (rand(i * 5 + 9) > 0.75 ? Math.PI : 0) * 0.55;
        const sp = (5 + rand(i * 5 + 4) * 15) * scale;
        const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp * 0.8 - 4 * scale;
        const g = 1.1 * scale, drag = 0.92;
        const k = (1 - Math.pow(drag, t)) / (1 - drag);
        const x = p[0] + vx * k, y = p[1] + vy * k + 0.5 * g * t * t * 0.6;
        const k2 = (1 - Math.pow(drag, Math.max(0, t - 2.5))) / (1 - drag);
        const x2 = p[0] + vx * k2, y2 = p[1] + vy * k2 + 0.5 * g * Math.max(0, t - 2.5) ** 2 * 0.6;
        const fade = 1 - t / life;
        const col = rand(i * 5 + 7) > 0.6 ? '#ffe2a8' : rand(i * 5 + 7) > 0.25 ? '#ffae4a' : '#ff6a3a';
        return (
          <g key={i} opacity={fade}>
            <line x1={x2} y1={y2} x2={x} y2={y} stroke={col} strokeWidth={6 * fade + 1} opacity={0.5} filter="url(#b4)" />
            <line x1={x2} y1={y2} x2={x} y2={y} stroke="#fff4dc" strokeWidth={2 * fade + 0.8} />
          </g>
        );
      })}
    </g>
  );
};

/* ---------- 红色竖排印章 ---------- */
export const RedStamp: React.FC<{x: number; y: number; words: string[]; f: number; at: number; size?: number; o?: number}> = ({x, y, words, f, at, size = 50, o = 1}) => {
  const t = prog(f, at, 8);
  if (t <= 0 || o <= 0) return null;
  const sc = 1.7 - 0.7 * eo(t);
  const lh = size * 1.22;
  const w = size * 3.6, h = words.length * lh + size * 0.7;
  const flash = 1 - prog(f, at + 6, 14);
  return (
    <g opacity={o * clamp(t * 2)} transform={`translate(${x + w / 2},${y + h / 2}) scale(${sc}) translate(${-w / 2},${-h / 2})`}>
      <rect x={-6} y={-6} width={w + 12} height={h + 12} rx={10} fill="#ff2a1a" opacity={0.25 + 0.45 * flash} filter="url(#b16)" />
      <rect x={0} y={0} width={w} height={h} rx={8} fill="#3a0503" opacity={0.6} stroke="#ff4030" strokeWidth={3} />
      <rect x={0} y={0} width={w} height={h} rx={8} fill="none" stroke="#ff4030" strokeWidth={10} opacity={0.5} filter="url(#b7)" />
      <rect x={8} y={8} width={w - 16} height={h - 16} rx={5} fill="none" stroke="#ff8a70" strokeWidth={1.2} opacity={0.7} />
      <g fontFamily={FONT.serif} fontWeight={600} fontSize={size} textAnchor="middle" letterSpacing={2}>
        {words.map((s, i) => (
          <g key={i}>
            <text x={w / 2} y={size * 0.35 + (i + 1) * lh - size * 0.14} fill="#ff2a1a" filter="url(#b7)" opacity={0.95}>{s}</text>
            <text x={w / 2} y={size * 0.35 + (i + 1) * lh - size * 0.14} fill="#ff6a50">{s}</text>
            <text x={w / 2} y={size * 0.35 + (i + 1) * lh - size * 0.14} fill="#ffe2d8" opacity={0.55}>{s}</text>
          </g>
        ))}
      </g>
    </g>
  );
};

/** 采样折线 → path */
export const ptsD = (pts: P[]) => 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');
export const lerpP = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export {eio};
