// ep55 v2 · 纯模块（无 React、无 GL 状态）：3D 世界布局 + 唯一金线（全部笔画 + 自动连线）+ 唯一笔头 + 相机路径。
// 时间常量全部沿用 v1 的 ink55 / timing（口播、字幕、音效不变）。
// 世界单位：约 1 单位 ≈ 相机 10 单位远处 160 px。每一场在世界里有自己的空间（原点 O1..O6），相机沿金线从一场飞到下一场。
import * as THREE from 'three';
import {CLIMAX, FRAMES, L, SC, wd} from '../timing';
import {
  BR, CHIP_AT, CURIOUS_AT, D_CIRC, D_DIAM, E_AT, EQ2_AT, EQ_AT, ERR_AT, FINAL_AT, FINAL_DUR, LROLL0, LROLL_DUR, LW_AT, NASA_AT, NUM_AT, OBJ, O_AT, Q2_AT,
  Q_AT, QMARK_AT, REM_AT, REVEAL, ROLL0, ROLL_DUR, SINE_DRAW, SINE_GO, STEPS, VOY_AT, WHEEL_AT, WHEEL_DUR, WHY_AT, BREATH0, PERIOD_AT, NASA_DIG0,
  ORB_IN, SINE_IN, A_CIRC, A_FRAME, T_LEAD, PI_DIGITS, VOTI_AT, ROW_AT, LFORM_AT, GPSF_AT, VOY_LABEL, TITLE_AT, PIROW_AT, BOX_AT,
} from '../ink55';
import type {CamS, V3} from './gl';

export {CLIMAX, FRAMES, SC, L, wd};
export {BR, CHIP_AT, CURIOUS_AT, D_CIRC, D_DIAM, E_AT, EQ2_AT, EQ_AT, ERR_AT, FINAL_AT, FINAL_DUR, LROLL0, LROLL_DUR, LW_AT, NASA_AT, NUM_AT, OBJ, O_AT, Q2_AT,
  Q_AT, QMARK_AT, REM_AT, REVEAL, ROLL0, ROLL_DUR, SINE_DRAW, SINE_GO, STEPS, VOY_AT, WHEEL_AT, WHEEL_DUR, WHY_AT, BREATH0, PERIOD_AT, NASA_DIG0, ORB_IN,
  SINE_IN, A_CIRC, A_FRAME, T_LEAD, PI_DIGITS, VOTI_AT, ROW_AT, LFORM_AT, GPSF_AT, VOY_LABEL, TITLE_AT, PIROW_AT, BOX_AT};

/* ---------------- 小工具 ---------------- */
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const prog = (f: number, a: number, d: number) => clamp((f - a) / d);
export const ss = (t: number) => { const u = clamp(t); return u * u * u * (u * (6 * u - 15) + 10); };
export const eo = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const eio = (t: number) => { const u = clamp(t); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
/** 平缓的缓入缓出：中段匀速（峰值速度只有平均的 1.25 倍，避免"甩"） */
export const glide = (t: number) => { const u = clamp(t), a = 0.2; if (u < a) return (u * u) / (2 * a * (1 - a)); if (u > 1 - a) return 1 - ((1 - u) * (1 - u)) / (2 * a * (1 - a)); return (u - a / 2) / (1 - a); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const rand = (s: number) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
export const bez = (p0: V3, p1: V3, p2: V3, p3: V3, n = 80): V3[] => Array.from({length: n + 1}, (_, i) => {
  const t = i / n, u = 1 - t;
  return [0, 1, 2].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]) as V3;
});
export const cr3 = (pts: V3[], seg = 16): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < seg; k++) {
      const t = k / seg, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)) as V3);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
export const cum3 = (pts: V3[]) => { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + len3(sub(pts[i], pts[i - 1]))); return c; };
export const at3 = (pts: V3[], c: number[], d: number): V3 => {
  if (d <= 0) return pts[0];
  const tot = c[c.length - 1];
  if (d >= tot) return pts[pts.length - 1];
  let lo = 1, hi = c.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (c[m] < d) lo = m + 1; else hi = m; }
  const s = (d - c[lo - 1]) / (c[lo] - c[lo - 1] || 1);
  return lerp3(pts[lo - 1], pts[lo], s);
};
export const headOf = (pts: V3[], t: number): V3 => { const c = cum3(pts); return at3(pts, c, clamp(t) * c[c.length - 1]); };
/** 圆：中心 c，在由 ex / ey 张成的平面里，从角 a0 起，dir=-1 为顺时针（从 ez 一侧看） */
export const circ3 = (c: V3, r: number, a0: number, dir = -1, n = 128, ex: V3 = [1, 0, 0], ey: V3 = [0, 1, 0], turns = 1): V3[] =>
  Array.from({length: n + 1}, (_, i) => { const a = a0 + dir * (i / n) * Math.PI * 2 * turns; return add(c, add(mul(ex, Math.cos(a) * r), mul(ey, Math.sin(a) * r))); });
export const rrect3 = (c: V3, w: number, h: number, r: number, ex: V3 = [1, 0, 0], ey: V3 = [0, 1, 0]): V3[] => {
  // 从左上圆角之后的上边起点开始，顺时针（屏幕视角）
  const P = (x: number, y: number): V3 => add(c, add(mul(ex, x), mul(ey, y)));
  const out: V3[] = [];
  const x0 = -w / 2, x1 = w / 2, y0 = h / 2, y1 = -h / 2;
  const arc = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 8; i++) { const a = a0 - (i / 8) * (Math.PI / 2); out.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); } };
  out.push(P(x0 + r, y0), P(x1 - r, y0)); arc(x1 - r, y0 - r, Math.PI / 2);
  out.push(P(x1, y1 + r)); arc(x1 - r, y1 + r, 0);
  out.push(P(x0 + r, y1)); arc(x0 + r, y1 + r, -Math.PI / 2);
  out.push(P(x0, y0 - r)); arc(x0 + r, y0 - r, Math.PI);
  return out;
};
/** 把一条折线按段长加密（tube 的进度参数沿弧长，线段太长会让发光不均匀） */
export const densify = (pts: V3[], step = 0.08): V3[] => {
  const out: V3[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(len3(sub(b, a)) / step));
    for (let k = 1; k <= n; k++) out.push(lerp3(a, b, k / n));
  }
  return out;
};

/* ---------------- 各场空间的原点 ---------------- */
export const O1: V3 = [0, 0, 0];
export const O2: V3 = [17, 4.5, -32];
export const O3: V3 = [36, 0, -66];
export const O4: V3 = [52, 3, -100];
export const O5: V3 = [68, 0, -132];
export const O5B: V3 = add(O5, [17, 1.4, -9]);
export const O5C: V3 = add(O5, [36, 2.6, -18]);
export const O6: V3 = [104, 5, -176];

/* ---------------- S1 钩子：玻璃车轮在网格地面上滚一圈 ---------------- */
export const WR = 1.3, WX0 = -4.4, CIRC = 2 * Math.PI * WR, ZF = 0.2; // ZF：前轮缘所在平面
export const rollE = (f: number) => eio(prog(f, ROLL0, ROLL_DUR));
export const wheelX = (f: number) => WX0 + CIRC * rollE(f);
export const wheelRot = (f: number) => -(CIRC * rollE(f)) / WR;
/** 车轮的世界变换（转角绕 z） */
export const wheelM = (f: number) => new THREE.Matrix4().makeTranslation(wheelX(f), WR, 0).multiply(new THREE.Matrix4().makeRotationZ(wheelRot(f)));
export const TRACK_END: V3 = [WX0 + CIRC, 0, ZF];

/* ---------------- S2 定义 ---------------- */
export const DC: V3 = add(O2, [-1.6, 0.2, 0]), DR = 2.3;
export const OBJ3 = [
  {c: add(O2, [-4.7, -0.3, 1.6]), r: 0.95},
  {c: add(O2, [-0.4, 0.1, -0.8]), r: 1.55},
  {c: add(O2, [5.6, 0.4, -4.2]), r: 2.3},
];
export const OBJ_IN = L(6) - 14;

/* ---------------- S3 阿基米德：倾斜的沙盘 ---------------- */
export const TILT = 0.95; // 沙盘与竖直面的夹角（弧度），越大越平躺
export const AC3: V3 = add(O3, [0, 0, 0]), AR3 = 2.25;
export const PEX: V3 = [1, 0, 0], PEY: V3 = [0, Math.cos(TILT), -Math.sin(TILT)];
export const PEZ: V3 = [0, Math.sin(TILT), Math.cos(TILT)];
export const plane = (u: number, v: number, h = 0): V3 => add(AC3, add(add(mul(PEX, u), mul(PEY, v)), mul(PEZ, h)));
export const polyUV = (n: number, r: number): [number, number][] => Array.from({length: n + 1}, (_, k) => { const a = Math.PI / 2 - (2 * Math.PI * k) / n; return [Math.cos(a) * r, Math.sin(a) * r]; });
export const STEP3 = [
  {n: 6, at: STEPS[0].at, dur: 34},
  {n: 12, at: STEPS[1].at - 2, dur: 40},
  {n: 24, at: STEPS[2].at, dur: 40},
  {n: 48, at: STEPS[3].at, dur: 42},
  {n: 96, at: STEPS[4].at - 2, dur: 44},
];
export const OUT6_AT = STEPS[0].at + 54; // = v1 outerAt(0)
/** 第 i 步（i≥1，n → 2n 加倍）完成的帧；第 0 步 = 外六边形画完 */
export const step3Done = (i: number) => (i === 0 ? OUT6_AT + 34 : STEP3[i].at + STEP3[i].dur);
/** 加倍动画：笔头绕圆一圈（从顶点顺时针），经过哪里，哪里的内多边形长出新顶点、外多边形被切角 */
export const tracePen = (i: number, f: number) => glide(prog(f, STEP3[i].at, STEP3[i].dur));
export const morphUV = (n: number, t: number, R: number): {inner: [number, number][]; outer: [number, number][]} => {
  const inner: [number, number][] = [], outer: [number, number][] = [];
  const Ro = R / Math.cos(Math.PI / n), Rn = R / Math.cos(Math.PI / (2 * n));
  for (let j = 0; j < n; j++) {
    const th = Math.PI / 2 - (2 * Math.PI * j) / n;
    inner.push([Math.cos(th) * R, Math.sin(th) * R]);
    const p = ss((t - j / n) * n);
    const tm = th - Math.PI / n;
    const rm = lerp(R * Math.cos(Math.PI / n), R, p);
    inner.push([Math.cos(tm) * rm, Math.sin(tm) * rm]);
    const q = ss((t - j / n) * n);
    const ov: [number, number] = [Math.cos(th) * Ro, Math.sin(th) * Ro];
    const dd = Math.PI / (2 * n);
    const A: [number, number] = [Math.cos(th + dd) * Rn, Math.sin(th + dd) * Rn], B: [number, number] = [Math.cos(th - dd) * Rn, Math.sin(th - dd) * Rn];
    outer.push([lerp(ov[0], A[0], q), lerp(ov[1], A[1], q)], [lerp(ov[0], B[0], q), lerp(ov[1], B[1], q)]);
  }
  inner.push(inner[0]); outer.push(outer[0]);
  return {inner, outer};
};
export const lowB = (n: number) => n * Math.sin(Math.PI / n);
export const upB = (n: number) => n * Math.tan(Math.PI / n);
/** 96 边放大镜：从第 96 步画完到不等式出现之后 */
export const INSET_IN = step3Done(4) - 4, INSET_OUT = EQ_AT + 70;

/* ---------------- S4 无理数：伸向远方的数字之河 ---------------- */
export const RIVER = (s: number): V3 => add(O4, [-4.5 + 11.5 * s, -1.6 + 1.7 * s + 0.4 * Math.sin(2 * Math.PI * 1.5 * s + 0.3) * (1 - 0.35 * s), 1.4 - 14 * Math.pow(s, 1.3)]);
export const RIVER_PTS: V3[] = Array.from({length: 501}, (_, i) => RIVER(i / 500));
const RC = cum3(RIVER_PTS), RTOT = RC[RC.length - 1];

/* ---------------- S5 生活 ---------------- */
export const LWR3 = 0.8, LX03 = -6.2, LDIST3 = 2 * 2 * Math.PI * LWR3;
export const LROLL_DUR3 = 72;
export const lrollE = (f: number) => eio(prog(f, LROLL0, LROLL_DUR3));
export const lwheelX = (f: number) => O5[0] + LX03 + LDIST3 * lrollE(f);
export const lwheelM = (f: number) => new THREE.Matrix4().makeTranslation(lwheelX(f), O5[1] + LWR3, O5[2]).multiply(new THREE.Matrix4().makeRotationZ(-(LDIST3 * lrollE(f)) / LWR3));
// 正弦丝带：14 条在深度方向展开
export const SN = 14, SK3 = 1.2 / 0.62, SAMP = 0.95, SXH = 4.6;
export const sphase = (f: number) => 0.07 * Math.max(0, f - SINE_GO) * ss(prog(f, SINE_GO, 30));
export const sine3 = (u: number, f: number, n = 150): V3[] => Array.from({length: n + 1}, (_, i) => {
  const x = -SXH + (2 * SXH * i) / n;
  return add(O5B, [x, SAMP * Math.sin(SK3 * x - sphase(f) + 0.55 * u) * (1 - 0.25 * u), 1.2 - 3.4 * u]);
});
// 地球 + GPS 轨道
export const ER3 = 1.5, ORB_R = 4.6, ORB_TILT = 0.42;
export const ORB_EX: V3 = [1, 0, 0], ORB_EY: V3 = [0, Math.sin(ORB_TILT), -Math.cos(ORB_TILT)];
export const SAT_GO = O_AT + 40;
export const satAng = (f: number) => -Math.PI / 2 - (2 * Math.PI * Math.max(0, f - SAT_GO)) / 170;
export const orbP = (a: number): V3 => add(O5C, add(mul(ORB_EX, Math.cos(a) * ORB_R), mul(ORB_EY, Math.sin(a) * ORB_R)));

/* ---------------- S6 结尾 ---------------- */
export const NF3 = {c: add(O6, [0, 0.6, 0]), w: 9.6, h: 3.4, r: 0.32};
export const VOY_C: V3 = add(O6, [0, -1.0, -44]), VOY_R = 34; // 巨大的圆：几乎水平，圆心（太阳）在远处地平线上
export const VEX: V3 = [1, 0, 0], VEY: V3 = [0, 0.06, -0.998];
export const voyP = (a: number): V3 => add(VOY_C, add(mul(VEX, Math.cos(a) * VOY_R), mul(VEY, Math.sin(a) * VOY_R)));
export const VOY_A0 = -Math.PI / 2 - 0.62, VOY_A1 = -Math.PI / 2 + 0.17;
export const VOY_PROBE: V3 = voyP(VOY_A1);
export const BURST: V3 = add(O6, [0, -1.2, -24]);
export const CHIP3 = [add(O6, [-4.4, -1.2, -16]), add(O6, [0, -1.5, -18]), add(O6, [4.4, -1.2, -16])];
export const CHIP_W = 3.6, CHIP_H = 0.95;
export const QM3: V3 = add(O6, [3.2, -1.0, -17]);
export const FIN3: V3[] = cr3([add(O6, [-6.5, -4.6, -25]), add(O6, [-2.5, -4.3, -26]), add(O6, [1.5, -3.4, -28]), add(O6, [4.5, -0.8, -31]), add(O6, [6.5, 2.8, -35]), add(O6, [7.4, 7.3, -40])], 18);

/* ---------- 把"屏幕上的位置 + 深度"放回世界（让 HUD 一样的框也活在 3D 里、有视差） ---------- */
const _uc = new THREE.PerspectiveCamera();
export const camBasis = (c: CamS) => {
  _uc.fov = c.fov; _uc.aspect = 1920 / 1080; _uc.position.set(c.pos[0], c.pos[1], c.pos[2]); _uc.up.set(0, 1, 0); _uc.lookAt(c.tgt[0], c.tgt[1], c.tgt[2]);
  _uc.updateProjectionMatrix(); _uc.updateMatrixWorld(true);
  const e = _uc.matrixWorld.elements;
  return {right: [e[0], e[1], e[2]] as V3, up: [e[4], e[5], e[6]] as V3, back: [e[8], e[9], e[10]] as V3, pxK: (2 * Math.tan((c.fov * Math.PI) / 360)) / 1080};
};
export const unproj = (c: CamS, sx: number, sy: number, depth: number): V3 => {
  const b = camBasis(c);
  const x = (sx - 960) * b.pxK * depth, y = -(sy - 540) * b.pxK * depth;
  return add(add(add(c.pos, mul(b.back, -depth)), mul(b.right, x)), mul(b.up, y));
};
/** 一个面向相机（取 f 帧的机位）的圆角框：屏幕中心 (sx, sy)、宽高（像素）、深度 */
export const hudRect = (f: number, sx: number, sy: number, wpx: number, hpx: number, depth: number, rpx = 24) => {
  const c = baseCam(f);
  const b = camBasis(c);
  const ctr = unproj(c, sx, sy, depth);
  const k = b.pxK * depth;
  return {c: ctr, w: wpx * k, h: hpx * k, r: rpx * k, ex: b.right, ey: b.up, pts: densify(rrect3(ctr, wpx * k, hpx * k, rpx * k, b.right, b.up), 0.08)};
};
let BASECAM: ((f: number) => CamS) | null = null;
const baseCam = (f: number) => BASECAM!(f);

/* ================= 笔画表 ================= */
export type Kind = 'draw' | 'link' | 'trace';
export type S3 = {
  id: string; at: number; dur: number; kind: Kind;
  pts: V3[] | ((f: number) => V3[]);
  ease?: (t: number) => number;
  progF?: (f: number) => number;
  r?: number; color?: string; core?: string;
  bridge?: boolean; // 场与场之间的长金线（常驻）
};
export const ptsOf = (s: S3, f: number): V3[] => (typeof s.pts === 'function' ? s.pts(f) : s.pts);
export const progOf = (s: S3, f: number): number => (s.progF ? s.progF(f) : (s.ease ?? ss)(prog(f, s.at, s.dur)));
const ap = (m: THREE.Matrix4, p: V3): V3 => { const v = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(m); return [v.x, v.y, v.z]; };

// S1：前轮缘（局部坐标从底点顺时针）
export const WHEEL_LOCAL: V3[] = circ3([0, 0, ZF], WR, -Math.PI / 2, -1, 140);
// S4 数字河的绘制进度
type Glyph3 = {ch: string; p: V3; t: number; d: number; size: number};
export const RIVER_LAYOUT_CAM = (): CamS => camAt(Math.round((L(18) + L(19)) / 2));
export let GLYPHS3: Glyph3[] = [];
let _af: ReturnType<typeof hudRect> | null = null;
let _nf: ReturnType<typeof hudRect> | null = null, _ch: ReturnType<typeof hudRect>[] | null = null, _qm: V3[] | null = null;
export const NFRAME = () => (_nf ??= hudRect(NASA_AT + 50, 1190, 430, 960, 380, 12, 28));
/** 照片卡片（面向当时的机位，世界里有自己的深度 → 有视差） */
let _cards: Record<string, ReturnType<typeof hudRect>> | null = null;
export const CARDS = () => (_cards ??= {
  archimedes: hudRect(A_FRAME + 20, 1450, 560, 300, 384, 12.5, 18),
  jpl: hudRect(NASA_AT + 50, 360, 430, 400, 312, 13.5, 18),
});
/** 物件上方的照片卡（世界坐标中心 + 世界尺寸，朝向 f 帧的机位） */
export const card3 = (f: number, c: V3, w: number, h: number) => {
  const b = camBasis(baseCam(f));
  return {c, w, h, r: 0.1, ex: b.right, ey: b.up, pts: densify(rrect3(c, w, h, 0.1, b.right, b.up), 0.06)};
};
export const CHIP_DEPTH = [10, 12.5, 10];
export const CHIPS = () => (_ch ??= [560, 960, 1360].map((x, i) => hudRect(CHIP_AT[i] + 20, x, 692, 340, 84, CHIP_DEPTH[i], 20)));
export const QMARK = () => (_qm ??= cr3([[1420, 688], [1428, 662], [1452, 650], [1478, 660], [1486, 684], [1470, 706], [1456, 722], [1455, 742]].map(([x, y]) => unproj(baseCam(QMARK_AT + 10), x, y, 11)), 10));
export const AFRAME = () => (_af ??= hudRect(A_FRAME + 20, 1450, 235, 640, 130, 11));

const D: S3[] = [
  // S1
  {id: 'wheel', kind: 'draw', at: WHEEL_AT, dur: WHEEL_DUR, ease: eio, pts: (f) => WHEEL_LOCAL.map((p) => ap(wheelM(f), p))},
  {id: 'unroll', kind: 'draw', at: ROLL0, dur: ROLL_DUR, ease: eio, pts: densify([[WX0, 0, ZF], TRACK_END], 0.1), r: 0.02},
  // S2
  {id: 'dcirc', kind: 'draw', at: D_CIRC, dur: 46, ease: ss, pts: circ3(DC, DR, Math.PI, -1, 160)},
  {id: 'ddiam', kind: 'draw', at: D_DIAM, dur: 18, ease: ss, pts: densify([add(DC, [-DR, 0, 0]), add(DC, [DR, 0, 0])], 0.1), r: 0.014},
  ...OBJ.map((o, i) => ({id: 'obj' + i, kind: 'draw', at: o.at, dur: o.dur, ease: ss, pts: circ3(OBJ3[i].c, OBJ3[i].r, Math.PI / 2, -1, 140)} as S3)),
  // S3
  {id: 'acirc', kind: 'draw', at: A_CIRC, dur: 40, ease: ss, pts: Array.from({length: 161}, (_, i) => { const a = Math.PI / 2 - (i / 160) * 2 * Math.PI; return plane(Math.cos(a) * AR3, Math.sin(a) * AR3); })},
  {id: 'in6', kind: 'draw', at: STEP3[0].at, dur: STEP3[0].dur, ease: glide, color: '#9fb4ff', core: '#eef2ff', r: 0.013, pts: densify(polyUV(6, AR3).map(([u, v]) => plane(u, v)), 0.08)},
  {id: 'out6', kind: 'draw', at: OUT6_AT, dur: 34, ease: glide, color: '#ff8a5a', core: '#fff0e6', r: 0.013, pts: densify(polyUV(6, AR3 / Math.cos(Math.PI / 6)).map(([u, v]) => plane(u, v)), 0.08)},
  {id: 'aframe', kind: 'draw', at: A_FRAME, dur: 32, ease: ss, r: 0.012, pts: () => AFRAME().pts},
  ...STEP3.slice(1).map((s, j) => ({id: 'trace' + s.n, kind: 'trace', at: s.at, dur: s.dur, progF: (f: number) => tracePen(j + 1, f), pts: Array.from({length: 161}, (_, i) => { const a = Math.PI / 2 - (i / 160) * 2 * Math.PI; return plane(Math.cos(a) * AR3, Math.sin(a) * AR3); })} as S3)),
  // S4（数字河：进度跟着口播的数字）
  {id: 'river', kind: 'draw', at: T_LEAD, dur: 300, progF: (f) => riverProg(f), pts: RIVER_PTS, r: 0.016},
  // S5
  {id: 'lwheel', kind: 'draw', at: LW_AT, dur: 30, ease: eio, pts: (f) => circ3([0, 0, 0.16], LWR3, -Math.PI / 2, -1, 110).map((p) => ap(lwheelM(f), p))},
  {id: 'lunroll', kind: 'draw', at: LROLL0, dur: LROLL_DUR3, ease: eio, pts: densify([[O5[0] + LX03, O5[1], O5[2] + 0.16], [O5[0] + LX03 + LDIST3, O5[1], O5[2] + 0.16]], 0.1), r: 0.018},
  {id: 'sine', kind: 'draw', at: SINE_DRAW, dur: 50, ease: ss, pts: (f) => sine3(0, f), r: 0.016},
  {id: 'earth', kind: 'draw', at: E_AT, dur: 26, ease: ss, color: '#8fb0ff', core: '#eef4ff', pts: circ3(O5C, ER3 * 1.002, -Math.PI / 2, -1, 120, [1, 0, 0], [0, 0, 1])},
  {id: 'orbit', kind: 'draw', at: O_AT, dur: 42, ease: ss, pts: Array.from({length: 161}, (_, i) => orbP(-Math.PI / 2 - (i / 160) * Math.PI * 2))},
  // S6
  {id: 'nframe', kind: 'draw', at: NASA_AT, dur: 50, ease: ss, r: 0.016, pts: () => NFRAME().pts},
  {id: 'voy', kind: 'draw', at: VOY_AT, dur: 60, ease: ss, r: 0.05, pts: Array.from({length: 241}, (_, i) => voyP(VOY_A0 + (VOY_A1 - VOY_A0) * (i / 240)))},
  ...CHIP3.map((_c, i) => ({id: 'chip' + i, kind: 'draw', at: CHIP_AT[i], dur: 20, ease: ss, r: 0.014, pts: () => CHIPS()[i].pts} as S3)),
  {id: 'toburst', kind: 'link', bridge: true, at: BREATH0 + 10, dur: CLIMAX - 4 - (BREATH0 + 10), ease: eio, r: 0.022,
    pts: bez(VOY_PROBE, add(VOY_PROBE, [0, 3, 6]), add(BURST, [3, 2, 4]), BURST, 160)},
  {id: 'qmark', kind: 'draw', at: QMARK_AT, dur: 22, ease: ss, pts: () => QMARK()},
  {id: 'final', kind: 'draw', at: FINAL_AT, dur: FINAL_DUR, ease: ss, pts: FIN3, r: 0.02},
];

/* ---------- S4 数字布局（用该场的主相机算字号：越远越小，出生时定好，之后不变） ---------- */
const SPOKEN = ['Ba', 'phẩy', 'một', 'bốn', 'một', 'năm', 'chín', 'hai', 'sáu', 'năm', 'ba', 'năm'];
const buildGlyphs = () => {
  const cam = RIVER_LAYOUT_CAM();
  const out: Glyph3[] = [];
  let d = RTOT * 0.035, t = 0, gap = 6;
  const seen: Record<string, number> = {};
  const pxK = (2 * Math.tan((cam.fov * Math.PI) / 360)) / 1080;
  const forward = new THREE.Vector3(cam.tgt[0] - cam.pos[0], cam.tgt[1] - cam.pos[1], cam.tgt[2] - cam.pos[2]).normalize();
  const depth = (p: V3) => new THREE.Vector3(p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]).dot(forward);
  const scr = (p: V3): [number, number] => {
    const b = camBasis(cam); const v = sub(p, cam.pos); const z = -(v[0] * b.back[0] + v[1] * b.back[1] + v[2] * b.back[2]);
    return [960 + (v[0] * b.right[0] + v[1] * b.right[1] + v[2] * b.right[2]) / (z * b.pxK), 540 - (v[0] * b.up[0] + v[1] * b.up[1] + v[2] * b.up[2]) / (z * b.pxK)];
  };
  void depth; void pxK;
  for (let k = 0; k < PI_DIGITS.length; k++) {
    const ch = PI_DIGITS[k];
    const p0 = at3(RIVER_PTS, RC, d);
    const size = Math.round(clamp(0.4 / (depth(p0) * pxK), 12, 50));
    const wpx = (ch === ',' ? size * 0.3 : size * 0.6) + Math.max(3, size * 0.08);
    // 沿河前进，直到屏幕上的距离够放下这个字（河往远处拐时字不会挤在一起）
    const s0 = scr(p0);
    let d1 = d;
    while (d1 < RTOT) { d1 += 0.01; const q = scr(at3(RIVER_PTS, RC, d1)); if (Math.hypot(q[0] - s0[0], q[1] - s0[1]) >= wpx) break; }
    if (d1 > RTOT * 0.985 || (size <= 12 && k > 40)) break;
    if (k < SPOKEN.length) { const w = SPOKEN[k]; const n = seen[w.toLowerCase()] ?? 0; seen[w.toLowerCase()] = n + 1; t = wd(18, w, n); }
    else { gap = Math.max(1.6, gap * 0.93); t += gap; }
    out.push({ch, p: at3(RIVER_PTS, RC, (d + d1) / 2), t: Math.round(t), d: (d + d1) / 2, size});
    d = d1;
  }
  return out;
};
const riverProg = (f: number): number => {
  const G = GLYPHS3;
  if (!G.length) return 0;
  const g0 = G[0], gl = G[G.length - 1];
  if (f <= T_LEAD) return 0;
  if (f < g0.t) return (eo(prog(f, T_LEAD, g0.t - T_LEAD)) * g0.d) / RTOT;
  for (let k = 1; k < G.length; k++) { const a = G[k - 1], b = G[k]; if (f < b.t) return (a.d + ((b.d - a.d) * (f - a.t)) / Math.max(1, b.t - a.t)) / RTOT; }
  return (gl.d + (RTOT - gl.d) * prog(f, gl.t, 30)) / RTOT;
};

/* ---------- 场间长金线（相机沿它飞）与场内细连线：自动补在相邻两笔之间 ---------- */
// 场间飞行窗口：[a, b]（b = 下一场第一笔开始）
export const FLIGHTS: {from: string; to: string; a: number; lift: V3}[] = [
  {from: 'unroll', to: 'dcirc', a: SC.define - 46, lift: [4, 7, -6]},
  {from: 'obj2', to: 'acirc', a: SC.arch - 46, lift: [3, 6, 4]},
  {from: 'trace96', to: 'river', a: SC.irr - 40, lift: [2, 5, 6]},
  {from: 'river', to: 'lwheel', a: SC.life - 34, lift: [-2, 6, 6]},
  {from: 'lunroll', to: 'sine', a: LROLL0 + LROLL_DUR3, lift: [2, 3, 3]},
  {from: 'sine', to: 'earth', a: L(24) + 92, lift: [3, 4, 4]},
  {from: 'orbit', to: 'nframe', a: SC.end - 50, lift: [3, 8, 6]},
];
export const BRIDGE_DUR = (fl: (typeof FLIGHTS)[number]) => {
  const to = D.find((s) => s.id === fl.to)!;
  return to.at - fl.a;
};

const endOf = (s: S3) => { const f = s.at + s.dur; return headOf(ptsOf(s, f), progOf(s, f)); };
const startOf = (s: S3) => headOf(ptsOf(s, s.at), progOf(s, s.at));
const tanOf = (pts: V3[], end: boolean): V3 => {
  const n = pts.length;
  const a = end ? pts[Math.max(0, n - 4)] : pts[0], b = end ? pts[n - 1] : pts[Math.min(n - 1, 3)];
  const d = sub(b, a), l = len3(d) || 1;
  return mul(d, 1 / l);
};
export let STROKES3: S3[] = [];
export const S3ID: Record<string, S3> = {};
const buildStrokes = () => {
  GLYPHS3 = buildGlyphs();
  const ds = [...D].sort((a, b) => a.at - b.at);
  const out: S3[] = [];
  for (let i = 0; i < ds.length; i++) {
    const s = ds[i];
    out.push(s);
    const nx = ds[i + 1];
    if (!nx) break;
    const fl = FLIGHTS.find((x) => x.from === s.id && x.to === nx.id);
    const pa = endOf(s), pb = startOf(nx);
    const e = s.at + s.dur;
    if (fl) {
      const ta = tanOf(ptsOf(s, e), true), tb = tanOf(ptsOf(nx, nx.at), false);
      const span = len3(sub(pb, pa));
      const c1 = add(add(pa, mul(ta, span * 0.25)), fl.lift), c2 = add(sub(pb, mul(tb, span * 0.3)), mul(fl.lift, 0.35));
      out.push({id: 'bridge-' + nx.id, kind: 'link', bridge: true, at: fl.a, dur: nx.at - fl.a, ease: (t) => eio(t), pts: bez(pa, c1, c2, pb, 220), r: 0.022});
      continue;
    }
    const gap = nx.at - e;
    const dist = len3(sub(pb, pa));
    if (dist < 1e-3) continue;
    if (gap <= 0) throw new Error(`stroke ${nx.id} starts away from ${s.id} without a gap`);
    // 场内连线：笔头从上一笔末端平滑飞到下一笔起点；最多用 40 帧，剩下的时间停在上一笔末端
    const dur = Math.min(gap, Math.max(16, Math.min(40, Math.round(dist * 5))));
    const ta = tanOf(ptsOf(s, e), true), tb = tanOf(ptsOf(nx, nx.at), false);
    const k = Math.min(dist * 0.4, 2.5);
    out.push({id: 'link-' + nx.id, kind: 'link', at: nx.at - dur, dur, ease: ss, pts: bez(pa, add(pa, mul(ta, k)), sub(pb, mul(tb, k)), pb, 90), r: 0.01});
  }
  out.sort((a, b) => a.at - b.at);
  STROKES3 = out;
  for (const s of out) S3ID[s.id] = s;
};

/** 唯一笔头：正在画 → 在笔尖；否则停在最近一笔的末端（轻微呼吸）。返回世界坐标 + 亮度 */
export const pen3 = (f: number): {p: V3; o: number; moving: boolean} => {
  let last: S3 | null = null;
  for (const s of STROKES3) {
    if (f >= s.at && f < s.at + s.dur) return {p: headOf(ptsOf(s, f), progOf(s, f)), o: s.kind === 'link' ? (s.bridge ? 0.95 : 0.8) : 1, moving: true};
    if (s.at + s.dur <= f) last = s;
  }
  if (!last) { const s0 = STROKES3[0]; return {p: startOf(s0), o: 0.85 * eo(prog(f, 0, 14)), moving: false}; }
  const e = last.at + last.dur;
  // 停住时笔头留在上一笔末端；若那一笔会移动（车轮），笔头跟着走
  const p = headOf(ptsOf(last, f), progOf(last, e));
  const restO = last.kind === 'link' && !last.bridge ? 0.8 : 0.9;
  return {p, o: lerp(1, restO, prog(f, e, 20)) * (1 - prog(f, FRAMES - 40, 36)), moving: false};
};

/* ================= 相机 ================= */
export type Key = {f: number; pos: V3; tgt: V3; fov: number};
const K = (f: number, pos: V3, tgt: V3, fov = 36): Key => ({f: Math.round(f), pos, tgt, fov});
const o1 = (p: V3) => add(O1, p), o2 = (p: V3) => add(O2, p), o3 = (p: V3) => add(O3, p), o4 = (p: V3) => add(O4, p), o5 = (p: V3) => add(O5, p), o5b = (p: V3) => add(O5B, p), o5c = (p: V3) => add(O5C, p), o6 = (p: V3) => add(O6, p);
export const KEYS: Key[] = [
  // S1：贴近轮子，低机位 → 跟着滚 → 升起看全程 → 推向余数
  K(0, o1([-3.0, 1.9, 6.4]), o1([-4.4, 1.25, 0]), 38),
  K(WHEEL_AT + WHEEL_DUR + 20, o1([-2.4, 2.2, 7.0]), o1([-3.6, 1.15, 0]), 38),
  K(ROLL0 + 50, o1([0.6, 2.6, 8.4]), o1([-0.6, 0.9, 0]), 38),
  K(ROLL0 + ROLL_DUR + 6, o1([0.9, 3.5, 10.6]), o1([-0.2, 0.55, 0]), 38),
  K(REM_AT - 6, o1([0.9, 3.5, 10.6]), o1([-0.2, 0.55, 0]), 38),
  K(REM_AT + 24, o1([3.0, 1.9, 6.6]), o1([2.2, 0.45, 0]), 38),
  K(REVEAL + 70, o1([2.6, 2.1, 7.0]), o1([1.7, 0.5, 0]), 38),
  K(SC.define - 50, o1([1.6, 2.9, 9.4]), o1([0.6, 0.8, 0]), 38),
  // 飞向 S2（中间两个关键帧在 buildCam 里沿桥线自动插入）
  K(SC.define + 18, o2([-1.0, 1.0, 9.6]), o2([-1.4, 0.2, 0]), 36),
  K(OBJ_IN - 10, o2([0.8, 0.6, 9.2]), o2([-0.6, 0.15, 0]), 36),
  K(OBJ_IN + 40, o2([0.6, 1.8, 12.8]), o2([0.3, 0.6, -0.6]), 38),
  K(Q_AT - 10, o2([-0.6, 1.3, 13.4]), o2([0.2, 0.3, -0.8]), 38),
  K(SC.arch - 48, o2([0.2, 1.1, 12.6]), o2([0.3, 0.3, -1.0]), 38),
  // S3：沙盘，斜上方，慢慢绕；96 时推近到顶部边缘
  K(SC.arch + 20, o3([2.6, 4.6, 9.8]), o3([2.9, 0.15, 0]), 36),
  K(STEP3[1].at - 30, o3([3.4, 4.2, 9.6]), o3([3.1, 0.15, 0]), 36),
  K(STEP3[3].at + 50, o3([3.9, 4.6, 9.4]), o3([3.15, 0.2, 0]), 36),
  K(STEP3[4].at - 6, o3([3.6, 4.9, 9.5]), o3([3.1, 0.25, 0]), 36),
  K(INSET_IN + 26, o3([3.2, 4.5, 8.6]), o3([2.9, 0.45, -0.2]), 36),
  K(EQ_AT - 14, o3([3.3, 4.5, 8.7]), o3([3.0, 0.45, -0.2]), 36),
  K(EQ_AT + 40, o3([3.3, 4.8, 9.6]), o3([3.1, 0.25, 0]), 36),
  K(SC.irr - 44, o3([3.6, 5.2, 10.4]), o3([3.1, 0.2, 0]), 36),
  // S4：数字河，机位缓慢横移（字很密，动得很慢）
  K(T_LEAD + 14, o4([-0.6, 1.6, 10.8]), o4([0.6, -0.3, -2.6]), 36),
  K(L(18) - 10, o4([-0.2, 1.5, 10.4]), o4([0.8, -0.3, -2.8]), 36),
  K(L(19) + 70, o4([0.3, 1.4, 10.2]), o4([1.0, -0.35, -3.0]), 36),
  K(ROW_AT - 6, o4([0.5, 1.5, 10.4]), o4([1.0, -0.2, -3.0]), 36),
  K(SC.life - 38, o4([0.8, 1.7, 10.8]), o4([1.0, -0.1, -3.0]), 36),
  // S5a：路面车轮，低机位跟拍
  K(SC.life + 16, o5([-4.4, 1.1, 6.0]), o5([-5.0, 0.7, 0]), 36),
  K(LROLL0 - 2, o5([-4.0, 1.3, 6.6]), o5([-4.6, 0.7, 0]), 36),
  K(LROLL0 + 40, o5([0.0, 1.7, 8.2]), o5([-0.6, 0.6, 0]), 36),
  K(SINE_IN - 30, o5([0.6, 2.2, 10.2]), o5([-0.4, 0.6, 0]), 36),
  // S5b：正弦丝带，升降 + 绕
  K(SINE_DRAW + 20, o5b([-1.6, 1.0, 9.4]), o5b([0.0, 0.0, -0.8]), 36),
  K(PERIOD_AT, o5b([1.6, 2.6, 9.0]), o5b([0.2, -0.1, -0.9]), 36),
  K(L(24) + 88, o5b([3.0, 3.2, 8.2]), o5b([0.6, -0.1, -1.0]), 36),
  // S5c：地球与 GPS 轨道，绕地球
  K(ORB_IN + 20, o5c([-3.2, 2.0, 11.6]), o5c([0, -0.5, 0]), 36),
  K(O_AT + 40, o5c([0.2, 3.0, 12.6]), o5c([0, -0.6, 0]), 36),
  K(SC.end - 64, o5c([2.8, 3.4, 11.8]), o5c([0, -0.7, 0]), 36),
  // S6：问题 → NASA 框 → 巨大的圆 → 高潮 → 为什么 → 好奇 → 升入星空
  K(NASA_AT + 20, o6([0.4, 1.0, 12.4]), o6([0, 0.55, 0]), 36),
  K(L(28) - 20, o6([-0.4, 0.9, 12.0]), o6([0, 0.55, 0]), 36),
  K(VOY_AT + 40, o6([-1.0, 1.6, 6.5]), o6([0.3, -2.6, -30]), 42),
  K(ERR_AT - 10, o6([0.6, 1.2, 3.0]), o6([0.6, -2.6, -32]), 42),
  K(BREATH0 + 20, o6([0.4, 0.6, 0.0]), o6([0.2, -2.0, -30]), 42),
  K(CLIMAX - 4, o6([0, -0.6, -12.0]), o6([0, -1.2, -24]), 42),
  K(CLIMAX + 70, o6([0, -0.6, -14.5]), o6([0, -1.2, -26]), 42),
  K(WHY_AT + 30, o6([0.2, -0.4, -15.0]), o6([0, -1.2, -28]), 38),
  K(CURIOUS_AT, o6([-0.4, -0.5, -15.4]), o6([0, -1.3, -28]), 38),
  K(FINAL_AT, o6([0.0, -0.6, -15.0]), o6([0.4, -1.0, -29]), 38),
  K(FINAL_AT + FINAL_DUR, o6([1.4, 1.0, -17.5]), o6([5.0, 4.0, -33]), 40),
  K(FRAMES, o6([2.0, 2.0, -18.5]), o6([6.0, 7.0, -37]), 40),
];
/** 单分量的单调三次 Hermite（Fritsch–Carlson）：不过冲、C1 连续 */
const monotone = (ts: number[], ys: number[]) => {
  const n = ts.length, d: number[] = [], m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (ts[i + 1] - ts[i]));
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * (ts[i + 1] - ts[i]) + (ts[i] - ts[i - 1]), w2 = (ts[i + 1] - ts[i]) + 2 * (ts[i] - ts[i - 1]); m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  return (t: number) => {
    if (t <= ts[0]) return ys[0];
    if (t >= ts[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i], s = (t - ts[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1];
  };
};
let CAMF: ((f: number) => CamS) | null = null;
/** 镜头"呼吸"：很慢的小幅漂移，文字密集时更小（但不为零，背景始终有 3D 视差） */
export const calmAt = (f: number) => {
  const dense: [number, number][] = [[REVEAL - 10, REVEAL + 80], [STEP3[0].at, EQ2_AT + 90], [L(18) - 20, SC.life - 40], [NASA_DIG0 - 20, NASA_DIG0 + 70], [CLIMAX + 10, CLIMAX + 90]];
  let k = 1;
  for (const [a, b] of dense) k = Math.min(k, 1 - 0.7 * Math.min(ss((f - a + 20) / 20), 1 - ss((f - b) / 20)));
  return k;
};
const buildCam = () => {
  const keys = [...KEYS];
  keys.sort((a, b) => a.f - b.f);
  const ts = keys.map((k) => k.f);
  const comp = (g: (k: Key) => number) => monotone(ts, keys.map(g));
  const px = comp((k) => k.pos[0]), py = comp((k) => k.pos[1]), pz = comp((k) => k.pos[2]);
  const tx = comp((k) => k.tgt[0]), ty = comp((k) => k.tgt[1]), tz = comp((k) => k.tgt[2]);
  const fv = comp((k) => k.fov);
  // 飞行时的跟拍相机：在笔头后上方，看向笔头前方；与关键帧相机用平滑权重混合（两端权重为 0，所以进出都无缝）
  const follow = FLIGHTS.map((fl) => {
    const br = S3ID['bridge-' + fl.to];
    const pts = br.pts as V3[];
    const e = (f: number) => eio(clamp((f - br.at) / br.dur));
    return {a: br.at, b: br.at + br.dur, pts, e, wmax: clamp((br.dur - 30) / 50, 0.35, 0.8)};
  });
  const followCam = (fw: (typeof follow)[number], f: number): {pos: V3; tgt: V3} => {
    let pos: V3 = [0, 0, 0], tgt: V3 = [0, 0, 0];
    for (let i = -6; i <= 6; i++) {
      const u = fw.e(f + i);
      const p = headOf(fw.pts, u), a = headOf(fw.pts, clamp(u - 0.06)), b = headOf(fw.pts, clamp(u + 0.06));
      const dir = sub(b, a), l = len3(dir) || 1;
      pos = add(pos, add(sub(p, mul(dir, 4.5 / l)), [0, 1.4, 0]));
      tgt = add(tgt, add(p, mul(dir, 2.0 / l)));
    }
    return {pos: mul(pos, 1 / 13), tgt: mul(tgt, 1 / 13)};
  };
  CAMF = (f: number): CamS => {
    const c = calmAt(f);
    for (const fw of follow) {
      if (f > fw.a && f < fw.b) {
        const u = (f - fw.a) / (fw.b - fw.a); const w = fw.wmax * ss(u / 0.45) * (1 - ss((u - 0.55) / 0.45));
        if (w > 0) {
          const k = {pos: [px(f), py(f), pz(f)] as V3, tgt: [tx(f), ty(f), tz(f)] as V3};
          const fc = followCam(fw, f);
          return {pos: lerp3(k.pos, fc.pos, w), tgt: lerp3(k.tgt, fc.tgt, w), fov: fv(f), roll: 0};
        }
      }
    }
    const a = 0.14 * c, b = 0.05 * c;
    const sw: V3 = [a * Math.sin(f * 0.0123 + 0.4) + 0.4 * a * Math.sin(f * 0.031), 0.6 * a * Math.sin(f * 0.0097 + 1.3), 0.5 * a * Math.cos(f * 0.0081)];
    const sv: V3 = [b * Math.sin(f * 0.0071 + 2.0), b * Math.sin(f * 0.0089), 0];
    return {pos: add([px(f), py(f), pz(f)], sw), tgt: add([tx(f), ty(f), tz(f)], sv), fov: fv(f), roll: 0.012 * c * Math.sin(f * 0.006)};
  };
};
export const camAt = (f: number): CamS => {
  if (!CAMF) {
    // 第一次调用时：先用不含飞行插值的关键帧建一个临时相机（数字布局需要），再建笔画表，再建完整相机
    const keys = [...KEYS].sort((a, b) => a.f - b.f);
    const ts = keys.map((k) => k.f);
    const comp = (g: (k: Key) => number) => monotone(ts, keys.map(g));
    const px = comp((k) => k.pos[0]), py = comp((k) => k.pos[1]), pz = comp((k) => k.pos[2]);
    const tx = comp((k) => k.tgt[0]), ty = comp((k) => k.tgt[1]), tz = comp((k) => k.tgt[2]), fv = comp((k) => k.fov);
    CAMF = (ff) => ({pos: [px(ff), py(ff), pz(ff)], tgt: [tx(ff), ty(ff), tz(ff)], fov: fv(ff)});
    BASECAM = CAMF;
    buildStrokes();
    buildCam();
  }
  return CAMF!(f);
};
camAt(0);
