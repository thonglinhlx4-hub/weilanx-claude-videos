// ep54 v2 钩子：手写霓虹书法 f( 大白菜 ) = ?  ——全部是手绘三次贝塞尔路径（不是字体字形），stroke 逐段画出，
// 每段有自己的时长（快甩 / 慢弯）和笔宽（不均匀）；相机跟着笔头横移、推拉，轻微 3D 视差；写完整体拉远缩成中间一小组；
// 然后从问号拉出一笔，交给 SLinear 变成一次函数的直线（见 HAND / handPts）。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, GlowPath, P, PenHead, Svg, W, clamp, eio, eo, prog, rand, smooth} from './fx';

type Seg = {p: [P, P, P, P]; d: number; w: number; ease?: 'lin' | 'eio' | 'eo'};
type Ink = {segs: Seg[]; at: number; color?: string; core?: string; o?: number};
const cub = (s: Seg['p'], n = 22): P[] =>
  Array.from({length: n + 1}, (_, i) => {
    const t = i / n, u = 1 - t;
    return [u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0], u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1]] as P;
  });
const S = (a: P, b: P, c: P, d: P, dur: number, w: number, ease: Seg['ease'] = 'eio'): Seg => ({p: [a, b, c, d], d: dur, w, ease});
const EZ = {lin: (t: number) => t, eio, eo};

/* ---- 笔画（世界坐标，基线约 y=600） ---- */
// A：从左边甩进来 → 小环 → 大草书 f → 横 → 发丝连到 "(" → "(" → 出锋
const A: Ink = {at: 0, segs: [
  S([-560, 660], [-420, 700], [-220, 600], [-70, 640], 6, 0.75, 'lin'),
  S([-70, 640], [10, 668], [40, 585], [-2, 598], 3, 0.55, 'lin'),
  S([-2, 598], [-40, 610], [20, 668], [96, 640], 2, 0.6, 'lin'),
  S([96, 640], [250, 650], [360, 600], [400, 520], 3, 1.0, 'lin'),
  S([400, 520], [440, 430], [500, 300], [512, 236], 3, 0.95, 'lin'),
  S([512, 236], [524, 168], [446, 150], [440, 228], 5, 1.05, 'eio'),
  S([440, 228], [430, 330], [370, 620], [302, 850], 5, 1.4, 'eo'),
  S([302, 850], [282, 930], [208, 906], [238, 836], 4, 1.15, 'eio'),
  S([238, 836], [266, 760], [300, 640], [346, 576], 3, 0.95, 'lin'),
  S([346, 576], [394, 540], [470, 552], [524, 538], 3, 0.85, 'lin'),
  S([524, 538], [562, 498], [584, 380], [612, 330], 2, 0.4, 'lin'),
  S([612, 330], [538, 404], [516, 624], [602, 782], 6, 1.25, 'eio'),
  S([602, 782], [632, 822], [662, 802], [684, 768], 2, 0.6, 'lin'),
]};
// 大白菜：白色菜帮（左右轮廓、中肋、内叶）+ 绿色皱褶叶顶
const CX = 790;
const ruffle = (x0: number, x1: number, yTop: number, yEnd: number, n: number, amp: number): P[] => {
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const arc = yEnd - (yEnd - yTop) * Math.sin(Math.PI * t);
    const r = amp * (0.6 + 0.4 * rand(i + 3)) * Math.sin(t * Math.PI * 9 + 0.5);
    pts.push([x + Math.cos(t * Math.PI * 9) * amp * 0.25, arc + r]);
  }
  return smooth(pts, 6);
};
const CAB_W: Ink[] = [
  {at: 50, segs: [S([CX, 812], [CX - 74, 800], [CX - 96, 620], [CX - 82, 482], 6, 1.15, 'eo'), S([CX - 82, 482], [CX - 74, 410], [CX - 66, 372], [CX - 58, 344], 3, 1.0, 'lin')]},
  {at: 58, segs: [S([CX, 812], [CX + 74, 800], [CX + 94, 620], [CX + 80, 482], 6, 1.15, 'eo'), S([CX + 80, 482], [CX + 72, 410], [CX + 64, 372], [CX + 56, 344], 3, 1.0, 'lin')]},
  {at: 76, segs: [S([CX - 2, 796], [CX - 8, 650], [CX + 4, 500], [CX - 2, 366], 5, 0.6, 'eo')]},
  {at: 80, segs: [S([CX - 14, 786], [CX - 56, 700], [CX - 56, 520], [CX - 30, 384], 5, 0.5, 'eo')]},
  {at: 82, segs: [S([CX + 14, 786], [CX + 54, 696], [CX + 50, 540], [CX + 28, 400], 5, 0.5, 'eo')]},
];
const TOP = ruffle(CX - 66, CX + 64, 238, 360, 40, 15);
const TOP2 = ruffle(CX - 40, CX + 40, 300, 352, 22, 8);
// B：")" → 拖尾 → 细细的游丝环 → "="
const B: Ink = {at: 86, segs: [
  S([918, 330], [990, 420], [1002, 632], [918, 792], 5, 1.25, 'eio'),
  S([918, 792], [896, 824], [948, 846], [1008, 806], 2, 0.7, 'lin'),
]};
const E1: Ink = {at: 93, segs: [S([1052, 534], [1100, 528], [1150, 526], [1200, 520], 3, 1.0, 'lin')]};
const E2: Ink = {at: 96, segs: [S([1056, 602], [1110, 596], [1160, 594], [1208, 588], 3, 1.0, 'lin')]};
// C："?" 钩 + 竖 + 小卷；点在第 111 帧（第 2 小节重拍）落下（笔抬起，不连 "="）
const Q: Ink = {at: 99, segs: [
  S([1262, 400], [1258, 270], [1440, 256], [1440, 368], 5, 1.25, 'eio'),
  S([1440, 368], [1440, 452], [1344, 462], [1344, 572], 4, 1.2, 'eo'),
  S([1344, 572], [1344, 616], [1350, 634], [1362, 646], 2, 0.85, 'lin'),
]};
export const DOT: P = [1350, 742];
const DOT_AT = 111;
// 游丝：从公式上方掠过的一条细长环线（像参考片里飞出去又绕回来的笔迹）
const STRAY: Ink = {at: 96, o: 0.4, segs: [
  S([1010, 800], [1240, 900], [1560, 700], [1520, 420], 3, 0.22, 'lin'),
  S([1520, 420], [1480, 100], [560, 40], [330, 200], 5, 0.2, 'lin'),
]};

const inkLen = (k: Ink) => k.segs.reduce((a, s) => a + s.d, 0);
/** 画到第 f 帧：返回各段 path（含部分段）+ 笔头位置 */
const inkState = (k: Ink, f: number) => {
  let t = f - k.at;
  const out: {d: string; w: number}[] = [];
  let head: P | null = null;
  if (t <= 0) return {out, head, done: false};
  for (const s of k.segs) {
    if (t <= 0) break;
    const u = clamp(t / s.d);
    const pts = cub(s.p);
    const e = EZ[s.ease ?? 'eio'](u);
    const n = Math.max(1, Math.round(e * (pts.length - 1)));
    const frac = e * (pts.length - 1);
    const sub = pts.slice(0, n + 1);
    if (u < 1) {
      const i = Math.floor(frac), r = frac - i;
      const a = pts[Math.min(i, pts.length - 1)], b = pts[Math.min(i + 1, pts.length - 1)];
      sub.splice(Math.min(i + 1, sub.length), sub.length, [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r]);
      head = sub[sub.length - 1];
    }
    out.push({d: 'M' + sub.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L'), w: s.w});
    t -= s.d;
  }
  return {out, head, done: f - k.at >= inkLen(k)};
};
const ptsD = (pts: P[]) => 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');
const polyState = (pts: P[], f: number, at: number, dur: number) => {
  const t = eio(prog(f, at, dur));
  if (t <= 0) return {d: '', head: null as P | null};
  const n = Math.max(1, Math.round(t * (pts.length - 1)));
  const sub = pts.slice(0, n + 1);
  return {d: ptsD(sub), head: t < 1 ? sub[sub.length - 1] : null};
};

/** 一条墨迹：粗泛光走整条（3 层大模糊一次画完），白热芯 + 细泛光按段变宽 → 笔宽不均 */
const InkDraw: React.FC<{segs: {d: string; w: number}[]; color?: string; core?: string; o?: number; scale?: number; lite?: boolean}> = ({segs, color = C.gold, core = C.core, o = 1, scale = 1, lite}) => {
  if (!segs.length) return null;
  const all = segs.map((s) => s.d).join(' ');
  const gold = color === C.gold;
  const W0 = 4.2 * scale;
  if (lite) return <g opacity={o} fill="none" strokeLinecap="round" strokeLinejoin="round">{segs.map((s, i) => <path key={i} d={s.d} stroke="#fff" strokeWidth={W0 * s.w * 1.4} />)}</g>;
  return (
    <g opacity={o} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={all} stroke={gold ? C.amber : color} strokeWidth={W0 * 13} opacity={0.22} filter="url(#b36)" />
      <path d={all} stroke={gold ? '#ffae4a' : color} strokeWidth={W0 * 6} opacity={0.4} filter="url(#b16)" />
      <path d={all} stroke={color} strokeWidth={W0 * 3} opacity={0.75} filter="url(#b7)" />
      {segs.map((s, i) => <path key={'m' + i} d={s.d} stroke={gold ? C.mid : color} strokeWidth={W0 * 1.9 * s.w} opacity={0.95} filter="url(#b2)" />)}
      {segs.map((s, i) => <path key={'c' + i} d={s.d} stroke={core} strokeWidth={Math.max(1, W0 * 0.95 * s.w)} />)}
    </g>
  );
};

/** 手写公式本体（世界坐标）。lf = 本地帧号；lite = 只画芯（给色散层用） */
export const HookInk: React.FC<{lf: number; scale?: number; lite?: boolean; noHead?: boolean}> = ({lf, scale = 1, lite, noHead}) => {
  const heads: P[] = [];
  const draw = (k: Ink, color?: string, core?: string, key?: string) => {
    const st = inkState(k, lf);
    if (st.head) heads.push(st.head);
    return <InkDraw key={key} segs={st.out} color={color ?? k.color} core={core ?? k.core} o={k.o ?? 1} scale={scale} lite={lite} />;
  };
  const top = polyState(TOP, lf, 66, 12), top2 = polyState(TOP2, lf, 84, 6);
  if (top.head) heads.push(top.head);
  const cabOn = clamp((lf - 84) / 16);
  const dotOn = lf >= DOT_AT;
  const burst = prog(lf, DOT_AT, 26);
  return (
    <g>
      {/* 大白菜的柔光填充 */}
      {cabOn > 0 && !lite ? (
        <g opacity={cabOn}>
          <path d={`M${CX},812 C${CX - 74},800 ${CX - 96},620 ${CX - 82},482 L${CX - 58},344 L${CX + 56},344 L${CX + 80},482 C${CX + 94},620 ${CX + 74},800 ${CX},812 Z`} fill="#fff4e6" opacity={0.08} filter="url(#b7)" />
          <path d={ptsD(TOP) + 'Z'} fill={C.green} opacity={0.12} filter="url(#b7)" />
        </g>
      ) : null}
      {draw(STRAY, undefined, undefined, 'stray')}
      {draw(A, undefined, undefined, 'A')}
      {CAB_W.map((k, i) => draw(k, '#e8f0ff', '#ffffff', 'cw' + i))}
      <InkDraw segs={top.d ? [{d: top.d, w: 1.0}] : []} color="#5fe08a" core="#eaffef" scale={scale} lite={lite} />
      <InkDraw segs={top2.d ? [{d: top2.d, w: 0.55}] : []} color="#5fe08a" core="#eaffef" scale={scale} lite={lite} />
      {draw(B, undefined, undefined, 'B')}
      {draw(E1, undefined, undefined, 'E1')}
      {draw(E2, undefined, undefined, 'E2')}
      {draw(Q, undefined, undefined, 'Q')}
      {dotOn ? (
        lite ? <circle cx={DOT[0]} cy={DOT[1]} r={9 * scale} fill="#fff" /> : (
          <g>
            <circle cx={DOT[0]} cy={DOT[1]} r={14 * scale} fill={C.mid} filter="url(#b7)" />
            <circle cx={DOT[0]} cy={DOT[1]} r={8 * scale} fill="#fff" />
            {burst > 0 && burst < 1 ? (
              <g opacity={1 - burst} stroke="#fff3da" strokeLinecap="round">
                {Array.from({length: 10}).map((_, i) => {
                  const a = (i / 10) * Math.PI * 2 + 0.3;
                  const r0 = 20 + burst * 60, r1 = r0 + 30 + 90 * eo(burst) * (i % 2 ? 0.6 : 1);
                  return <line key={i} x1={DOT[0] + Math.cos(a) * r0} y1={DOT[1] + Math.sin(a) * r0} x2={DOT[0] + Math.cos(a) * r1} y2={DOT[1] + Math.sin(a) * r1} strokeWidth={3 * (1 - burst) + 0.6} />;
                })}
                <circle cx={DOT[0]} cy={DOT[1]} r={30 + burst * 260} fill="none" stroke={C.gold} strokeWidth={4 * (1 - burst)} opacity={0.7} filter="url(#b2)" />
              </g>
            ) : null}
          </g>
        )
      ) : null}
      {!lite && !noHead ? heads.map((h, i) => <PenHead key={i} p={h} f={lf} size={1.15} />) : null}
      {!lite && !noHead && dotOn && lf < 150 ? <PenHead p={DOT} f={lf} size={1.6 * (1 - prog(lf, DOT_AT, 30) * 0.5)} o={1 - prog(lf, 120, 30)} /> : null}
    </g>
  );
};

/* ---- 相机 ---- */
const allInks = [A, ...CAB_W, B, E1, E2, Q].sort((a, b) => a.at - b.at);
const penAt = (f: number): P => {
  let best: P = [-560, 660];
  let bestAt = -1;
  for (const k of allInks) {
    if (f < k.at) continue;
    const st = inkState(k, f);
    const p = st.head ?? k.segs[k.segs.length - 1].p[3];
    if (k.at >= bestAt) { best = p; bestAt = k.at; }
  }
  if (f >= 66 && f < 78) best = polyState(TOP, f, 66, 12).head ?? best;
  if (f >= DOT_AT) best = DOT;
  return best;
};
const camX = (f: number) => {
  let s = 0, n = 0;
  for (let j = 0; j < 14; j++) { s += penAt(Math.max(0, f - j))[0] * (14 - j); n += 14 - j; }
  return s / n;
};
const FINAL = {z: 0.5, cx: 660, cy: 590, sx: 800, sy: 520};
export const hookCam = (f: number) => {
  const z0 = 1.22 - 0.08 * eio(prog(f, 0, 110));
  const cx = camX(Math.min(f, 112));
  const follow = {z: z0, tx: W * 0.56 - cx * z0, ty: 520 - 560 * z0};
  const fin = {z: FINAL.z, tx: FINAL.sx - FINAL.cx * FINAL.z, ty: FINAL.sy - FINAL.cy * FINAL.z};
  const k = eio(prog(f, 136, 40));
  const z = follow.z + (fin.z - follow.z) * k;
  const tx = follow.tx + (fin.tx - follow.tx) * k, ty = follow.ty + (fin.ty - follow.ty) * k;
  const vel = camX(Math.min(f, 112)) - camX(Math.max(0, Math.min(f, 112) - 4));
  const rotY = clamp(-vel * 0.12, -9, 9) * (1 - k) + 3 * Math.sin(f / 60) * (1 - k);
  return {z, tx, ty, rotY, pan: -(tx - fin.tx)};
};
/** 世界坐标 → 拉远后的屏幕坐标 */
export const finalScreen = (p: P): P => [FINAL.sx + (p[0] - FINAL.cx) * FINAL.z, FINAL.sy + (p[1] - FINAL.cy) * FINAL.z];

/* ---- 交棒：从问号的点拉出一笔，弯弯绕绕冲到右上，SLinear 里拉直成 y = 15x ---- */
export const HAND_END: P = [1540, 325];
const HSTART = finalScreen(DOT);
const HAND_RAW: P[] = smooth([HSTART, [HSTART[0] + 70, HSTART[1] + 30], [HSTART[0] + 150, HSTART[1] - 20], [HSTART[0] + 200, HSTART[1] + 20], [HSTART[0] + 280, HSTART[1] - 90], [HSTART[0] + 340, HSTART[1] - 130], HAND_END], 14);
const resample = (pts: P[], n: number): P[] => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const T = L[L.length - 1];
  return Array.from({length: n}, (_, k) => {
    const d = (k / (n - 1)) * T;
    let i = 1;
    while (i < L.length - 1 && L[i] < d) i++;
    const s = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * s, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * s] as P;
  });
};
export const HAND = resample(HAND_RAW, 64);
export const HAND_AT = 178;
/** morph 0 = 弯笔迹，1 = 直线 a→b */
export const handPts = (morph: number, a: P, b: P): P[] => HAND.map((p, i) => {
  const t = i / (HAND.length - 1);
  const q: P = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  return [p[0] + (q[0] - p[0]) * morph, p[1] + (q[1] - p[1]) * morph] as P;
});

export const SHook2: React.FC<{f: number; fadeAt: number}> = ({f, fadeAt}) => {
  const cam = hookCam(f);
  const fade = 1 - eo(prog(f, fadeAt, 22));
  const hand = eio(prog(f, HAND_AT, 30));
  const n = Math.max(2, Math.round(hand * (HAND.length - 1)));
  const handD = hand > 0 && f < fadeAt ? ptsD(HAND.slice(0, n + 1)) : '';
  const world = `translate(${cam.tx.toFixed(1)},${cam.ty.toFixed(1)}) scale(${cam.z.toFixed(4)})`;
  const tilt = `perspective(1600px) rotateY(${cam.rotY.toFixed(2)}deg) rotateX(${(3 * (1 - prog(f, 136, 40))).toFixed(2)}deg)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: tilt, opacity: fade}}>
        <Svg>
          <defs><radialGradient id="pool2"><stop offset="0" stopColor="#ff9a3a" stopOpacity="0.14" /><stop offset="1" stopColor="#ff8a2a" stopOpacity="0" /></radialGradient></defs>
          <ellipse cx={960} cy={560} rx={900} ry={380} fill="url(#pool2)" opacity={eo(prog(f, 20, 60))} />
          <g transform={world}><HookInk lf={f} scale={1 / Math.max(0.6, cam.z) ** 0.35} /></g>
          {/* 边缘色散：只在画面四周，红蓝错位叠在芯线上 */}
          <g mask="url(#edgeM)" filter="url(#ca)" opacity={0.75} style={{mixBlendMode: 'screen'}}>
            <g transform={world}><HookInk lf={f} lite scale={1 / Math.max(0.6, cam.z) ** 0.35} /></g>
          </g>
        </Svg>
      </AbsoluteFill>
      {handD ? (
        <Svg>
          <GlowPath d={handD} w={3} />
          {hand < 1 ? <PenHead p={HAND[n]} f={f} size={1.2} /> : <PenHead p={HAND_END} f={f} size={1.2} />}
        </Svg>
      ) : null}
    </AbsoluteFill>
  );
};
