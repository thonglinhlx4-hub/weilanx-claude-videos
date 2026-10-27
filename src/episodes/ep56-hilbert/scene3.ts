// ep56「Khách sạn vô cực của Hilbert」· 9:16 竖屏 · 纯模块（无 React、无 GL 状态）：
// 3D 布局（走廊：单号在左墙、双号在右墙，沿 -z 退向远处的雾）、客人时间线（n→n+1、n→2n、上车乘客、素数幂）、
// 唯一金线（全部笔画 + 自动连线）+ 唯一笔头 + 相机路径 + 雾。时间常量全部来自 timing（口播实测）。
import * as THREE from 'three';
import {CLIMAX, FRAMES, L, LE, SC, wd} from './timing';
import type {CamS, V3} from './gl';
import {H, W} from './gl';

export {CLIMAX, FRAMES, L, LE, SC, wd};

/* ---------------- 小工具 ---------------- */
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const prog = (f: number, a: number, d: number) => clamp((f - a) / d);
export const ss = (t: number) => { const u = clamp(t); return u * u * u * (u * (6 * u - 15) + 10); };
export const eo = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const eio = (t: number) => { const u = clamp(t); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
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
const CUMS = new WeakMap<V3[], number[]>();
const cumOf = (pts: V3[]) => { let c = CUMS.get(pts); if (!c) { c = cum3(pts); CUMS.set(pts, c); } return c; };
export const headOf = (pts: V3[], t: number): V3 => { const c = cumOf(pts); return at3(pts, c, clamp(t) * c[c.length - 1]); };
export const densify = (pts: V3[], step = 0.08): V3[] => {
  const out: V3[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(len3(sub(b, a)) / step));
    for (let k = 1; k <= n; k++) out.push(lerp3(a, b, k / n));
  }
  return out;
};
export const rrect3 = (c: V3, w: number, h: number, r: number, ex: V3 = [1, 0, 0], ey: V3 = [0, 1, 0]): V3[] => {
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
/** 抛物线跳跃（a→b，最高点比两端高 h） */
export const hop = (a: V3, b: V3, h: number, n = 40): V3[] => Array.from({length: n + 1}, (_, i) => { const t = i / n; const p = lerp3(a, b, t); return [p[0], p[1] + 4 * h * t * (1 - t), p[2]] as V3; });
export const hopAt = (a: V3, b: V3, h: number, t: number): V3 => { const p = lerp3(a, b, t); return [p[0], p[1] + 4 * h * t * (1 - t), p[2]]; };

/* ---------------- 数学（所有上屏的数都从这里算，测试里断言） ---------------- */
export const PRIMES: number[] = (() => { const ps: number[] = []; for (let n = 2; ps.length < 40; n++) if (ps.every((p) => n % p)) ps.push(n); return ps; })();
/** 第 c 辆车（c≥1）用第 c 个奇素数 */
export const busPrime = (c: number) => PRIMES[c];
export const DIAG_LIST = ['1415926', '5000000', '7182818', '3333333', '4142135', '5772156', '6180339'];
export const DIAG_NEW = DIAG_LIST.map((s, i) => (s[i] === '5' ? '4' : '5')).join('');

/* ---------------- 走廊（酒店）：房间 m 在左（单号）/ 右（双号）墙，深度 z = -(m-1)·DS ---------------- */
export const DS = 1.25, HW = 1.4, DOOR_W = 0.95, DOOR_H = 1.9, NDOOR = 90;
export const side = (m: number) => (m % 2 ? -1 : 1);
export const roomZ = (m: number) => Math.max(-260, -(m - 1) * DS);
export const roomPos = (m: number): V3 => [side(m) * 1.02, 0, roomZ(m)];
export const doorC = (m: number): V3 => [side(m) * HW, DOOR_H / 2, roomZ(m)];
export const ENTR: V3 = [0, 0.02, 2.4];       // 入口：新客人站的地方
export const THREAD_Z0 = 3.2;
export const tpt = (z: number): V3 => [0, 0.02, z];
const HEADY = 0.62;
export const head = (p: V3): V3 => [p[0], HEADY, p[2]];

/* ---------------- 其他场景的原点 ---------------- */
export const OC: V3 = [0, 16, -70];      // Cantor：两条轨道
export const OT: V3 = [0, 5.4, 4.5];     // 对角线表格（悬在入口上方）
export const OE: V3 = [0, 0, -44];       // 结尾：一扇开着的门（走廊尽头）

/* ================= 时间常量（帧） ================= */
// hook
export const T_DRAW0 = 18, T_DRAW1 = 150;           // 金线从入口画到 THREAD_Z1
export const THREAD_Z1 = -27;
export const RET0 = 156, RET1 = 238;                 // 回到入口的弧
export const NEWG = L(2);                            // 新客人出现
export const HCARD = L(4) + 8, GCARD = L(5) + 4;     // 照片卡
// one：n → n+1
export const SH0 = wd(6, 'hãy'), SH_NEAR = SH0 + 84; // 笔头沿走廊走：入口 → 房 18（SH_NEAR）→ 雾里
export const SH_Z1 = -21.5, SH_END = LE(7) + 10, SH_ZF = -62;
export const WALKIN = wd(8, 'vào') - 10;
// bus
export const BUS0 = SC.bus - 30, BUS1 = L(10) + 62;  // 车从雾里开进来（笔头在车头）
export const BUS_FRONT = 1.6;
export const ARC1 = wd(11, 'Một'), ARC2 = wd(11, 'hai', 2), ARC3 = wd(11, 'ba');
export const DBL_REST = LE(11) - 6;                  // 其余房间的 n→2n 波
export const BOARD0 = L(12) + 4, BOARD1 = L(12) + 70; // 乘客进单号房（笔头沿线走）
export const BOARD_Z1 = -13;
export const CURB0 = L(13) + 2, CURB1 = LE(13) + 6;  // 横穿无数车道
export const NLANE = 12, LANE_X0 = 1.8, LANE_DX = 1.3;
export const laneX = (c: number) => LANE_X0 + LANE_DX * c;
export const CURB_Z = -6, CURB_X1 = laneX(NLANE) + 1;
export const CH2_0 = wd(14, 'Khách') - 10, CH2_1 = LE(14) + 8;
export const CH3_0 = L(15) - 2, CH3_1 = wd(15, 'xe', 1) - 2;
export const CH5_0 = wd(15, 'xe', 1) + 4, CH5_1 = wd(15, 'cứ') - 6;
export const CH7_0 = wd(15, 'cứ') + 2, CH7_1 = L(16) + 60;
// cantor
export const CCARD0 = L(18) + 6, CCARD1 = CCARD0 + 44;
export const ZIG0 = wd(19, 'ghép') - 8, ZIG1 = LE(19) + 14;
export const ALEPH = wd(20, 'a-lép');
export const EQ1 = wd(21, 'Thêm'), EQ2 = wd(21, 'thêm', 1), EQ3 = wd(21, 'kích');
// twist
export const TFRAME0 = L(23) + 2, TFRAME1 = L(23) + 52;
export const Y1891 = wd(24, 'Năm');
export const ROWS0 = L(25) + 6;
export const DIAG_T = [wd(26, 'nhất') - 2, wd(26, 'hai') - 2, wd(26, 'cứ') - 4, wd(26, 'thế'), wd(26, 'mãi') + 2, LE(26) + 2, LE(26) + 8];
export const NOHOME0 = L(27) + 4, PASS0 = L(27) + 30, PASS1 = CLIMAX - 6, PASS_Z1 = -24;
// end
export const HC2_0 = L(29) + 2, HC2_1 = HC2_0 + 44;
export const DOOR0 = L(31) - 20, DOOR1 = L(31) + 36;
export const FINAL0 = wd(31, 'mở') - 4, FINAL1 = FRAMES - 40;

/* ---------------- 相机（基本关键帧，先建，照片卡 / 表格要用它摆位置） ---------------- */
export type Key = {f: number; pos: V3; tgt: V3; fov: number};
const K = (f: number, pos: V3, tgt: V3, fov = 56): Key => ({f: Math.round(f), pos, tgt, fov});
const oc = (p: V3) => add(OC, p), ot = (p: V3) => add(OT, p), oe = (p: V3) => add(OE, p);
export const KEYS: Key[] = [
  // hook：从入口外低机位看走廊（消失点在画面中央偏上）→ 跟着笔往里推 → 升起看全景
  K(0, [0, 1.25, 9.5], [0, 1.6, -12], 56),
  K(T_DRAW1 - 20, [0.1, 1.45, 6.4], [0, 1.45, -14], 56),
  K(RET1, [0.2, 3.3, 8.6], [0, 0.6, -12], 56),
  K(L(3) + 30, [-0.25, 2.2, 7.4], [0, 0.8, -10], 56),
  K(L(4) - 10, [-0.2, 2.3, 7.8], [0, 0.9, -10], 56),
  K(LE(5), [-0.15, 2.35, 8.0], [0, 0.95, -10], 56),
  // one：n→n+1，跟着波往里推；"没有最后一间"——升起看向雾
  K(SH0 - 8, [0.1, 2.0, 7.4], [0, 0.85, -12], 56),
  K(SH_NEAR, [0.0, 2.7, 3.5], [0, 0.7, -16], 56),
  K(L(7) + 60, [0.0, 3.6, 1.6], [0, 1.2, -30], 52),
  K(L(8) - 10, [0.15, 2.0, 6.2], [-0.3, 0.6, -6], 56),
  K(LE(9) + 10, [0.3, 2.4, 7.6], [0, 0.7, -10], 56),
  // bus
  K(BUS1 - 10, [0.5, 2.6, 7.4], [0, 0.6, -10], 56),
  K(ARC1 - 6, [0.35, 2.7, 5.6], [0, 0.4, -4.6], 56),
  K(LE(11), [0.25, 2.9, 5.4], [0, 0.3, -6.5], 56),
  K(BOARD1, [0.3, 3.0, 6.4], [-0.2, 0.3, -9], 56),
  // 无数辆车：升高往远看，车道扇形收向地平线
  K(CURB0 + 30, [5.0, 9.5, 12.0], [8, 0, -26], 52),
  K(CURB1 + 8, [6.0, 10.5, 13.0], [9, 0, -28], 52),
  // 素数幂：回到走廊上方，右后方看
  K(CH2_0 - 6, [0.6, 8.0, 7.0], [0.6, 0, -12], 56),
  K(CH5_0, [0.9, 8.4, 6.6], [0.8, 0, -13], 56),
  K(LE(16), [0.8, 9.0, 7.6], [0.7, 0, -14], 56),
  K(L(17) - 6, [1.2, 4.2, 6.5], [0, 1.0, -30], 56),
  K(LE(17) + 14, [0.4, 8.0, -22], [0, 8.0, -66], 56),
  // cantor
  K(CCARD0 + 26, oc([0, 2.4, 9.5]), oc([0, 0.6, -6]), 56),
  K(ZIG0, oc([0.2, 3.0, 7.2]), oc([0, -0.2, -8]), 56),
  K(ZIG1 - 20, oc([0.1, 3.6, 4.0]), oc([0, -0.3, -12]), 56),
  K(EQ1 - 20, oc([0, 4.2, 5.8]), oc([0, 0.2, -10]), 56),
  K(L(22) + 40, oc([0, 4.6, 7.0]), oc([0, 0.4, -10]), 56),
  // twist：对角线表格正面
  K(TFRAME0 + 34, ot([0, 0.3, 10.5]), ot([0, 0.1, 0]), 52),
  K(ROWS0 + 20, ot([0.2, 0.2, 9.6]), ot([0, 0, 0]), 52),
  K(DIAG_T[6] + 10, ot([0.1, 0.0, 9.4]), ot([0, -0.2, 0]), 52),
  K(PASS0 + 20, [0, 2.4, 9.4], [0, 0.8, -10], 56),
  K(PASS1, [0, 1.6, 2.0], [0, 0.9, -26], 56),
  K(CLIMAX + 60, [0, 1.6, 1.0], [0, 1.0, -28], 58),
  // end：Hilbert 卡 + 引语 → 一扇门
  K(HC2_0 + 10, oe([0, 2.4, 13]), oe([0, 1.9, 0]), 56),
  K(L(31) - 10, oe([0, 2.0, 10.5]), oe([0, 1.6, 0]), 56),
  K(FINAL0 + 20, oe([0, 1.8, 8.0]), oe([0, 1.7, 0]), 56),
  K(FRAMES, oe([0, 3.6, 5.6]), oe([0, 6.0, -10]), 58),
];
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
const keyCam = (() => {
  const keys = [...KEYS].sort((a, b) => a.f - b.f);
  const ts = keys.map((k) => k.f);
  const comp = (g: (k: Key) => number) => monotone(ts, keys.map(g));
  const px = comp((k) => k.pos[0]), py = comp((k) => k.pos[1]), pz = comp((k) => k.pos[2]);
  const tx = comp((k) => k.tgt[0]), ty = comp((k) => k.tgt[1]), tz = comp((k) => k.tgt[2]), fv = comp((k) => k.fov);
  return (f: number): CamS => ({pos: [px(f), py(f), pz(f)], tgt: [tx(f), ty(f), tz(f)], fov: fv(f)});
})();
export const baseCam = keyCam;

/* ---------- 屏幕位置 + 深度 → 世界（照片卡 / 表格也活在 3D 里，有视差） ---------- */
const _uc = new THREE.PerspectiveCamera();
export const camBasis = (c: CamS) => {
  _uc.fov = c.fov; _uc.aspect = W / H; _uc.position.set(c.pos[0], c.pos[1], c.pos[2]); _uc.up.set(0, 1, 0); _uc.lookAt(c.tgt[0], c.tgt[1], c.tgt[2]);
  _uc.updateProjectionMatrix(); _uc.updateMatrixWorld(true);
  const e = _uc.matrixWorld.elements;
  return {right: [e[0], e[1], e[2]] as V3, up: [e[4], e[5], e[6]] as V3, back: [e[8], e[9], e[10]] as V3, pxK: (2 * Math.tan((c.fov * Math.PI) / 360)) / H};
};
export const unproj = (c: CamS, sx: number, sy: number, depth: number): V3 => {
  const b = camBasis(c);
  const x = (sx - W / 2) * b.pxK * depth, y = -(sy - H / 2) * b.pxK * depth;
  return add(add(add(c.pos, mul(b.back, -depth)), mul(b.right, x)), mul(b.up, y));
};
export type Rect3 = {c: V3; w: number; h: number; r: number; ex: V3; ey: V3; pts: V3[]; k: number};
export const hudRect = (f: number, sx: number, sy: number, wpx: number, hpx: number, depth: number, rpx = 22): Rect3 => {
  const c = baseCam(f);
  const b = camBasis(c);
  const ctr = unproj(c, sx, sy, depth);
  const k = b.pxK * depth;
  return {c: ctr, w: wpx * k, h: hpx * k, r: rpx * k, ex: b.right, ey: b.up, k, pts: densify(rrect3(ctr, wpx * k, hpx * k, rpx * k, b.right, b.up), 0.06)};
};
/** 卡片 / 面板里的一个点（以卡片中心为原点、单位：该卡的像素） */
export const rectPt = (r: Rect3, px: number, py: number): V3 => add(r.c, add(mul(r.ex, px * r.k), mul(r.ey, -py * r.k)));

// 照片卡：竖着叠放（Hilbert 上、Gamow 下）
let _cards: Record<string, Rect3> | null = null;
export const CARDS = () => (_cards ??= {
  hilbert: hudRect(HCARD + 20, 540, 470, 330, 448, 7.5, 16),
  gamow: hudRect(GCARD + 20, 540, 1010, 196, 286, 7.0, 12),
  cantor: hudRect(CCARD0 + 20, 540, 600, 360, 472, 8.5, 16),
  hilbert2: hudRect(HC2_0 + 20, 540, 520, 300, 406, 9, 16),
});
// 对角线表格：面板（屏幕 1080 宽，面板 900×820，中心 y 900）
export const TAB = {cx: 540, cy: 880, w: 940, h: 900, rowY0: 560, rowDY: 92, col0: 300, colW: 70, newY: 1250};
let _tab: Rect3 | null = null;
export const TABLE = () => (_tab ??= hudRect(TFRAME0 + 20, TAB.cx, TAB.cy, TAB.w, TAB.h, 10.5, 26));
/** 表格单元（行 k=1..7、列 j=1..7 → 小数第 j 位）的世界坐标；行 8 = 新数 */
export const cellPt = (k: number, j: number): V3 => {
  const t = TABLE();
  const y = k <= 7 ? TAB.rowY0 + (k - 1) * TAB.rowDY : TAB.newY;
  return rectPt(t, TAB.col0 + (j - 1) * TAB.colW - TAB.cx, y - 14 - TAB.cy);
};

/* ---------------- Cantor 轨道：左轨 = 1,2,3,…；右轨 = 2,4,6,… ---------------- */
export const RAIL_X = 0.95, BEAD_DZ = 1.7, NBEAD = 16;
export const beadL = (j: number): V3 => oc([-RAIL_X, 0, 1.5 - (j - 1) * BEAD_DZ]);
export const beadR = (j: number): V3 => oc([RAIL_X, 0, 1.5 - (j - 1) * BEAD_DZ]);
export const ZIG_N = 9;
export const ZIG_PTS: V3[] = (() => {
  // 梯子：L1→R1（横档）→沿右轨到 R2→R2→L2（横档）→沿左轨到 L3→…
  const out: V3[] = [];
  for (let j = 1; j <= ZIG_N; j++) {
    const [a, b] = j % 2 ? [beadL(j), beadR(j)] : [beadR(j), beadL(j)];
    out.push(...densify([a, b], 0.1).slice(out.length ? 1 : 0));
    if (j < ZIG_N) { const nb = j % 2 ? beadR(j + 1) : beadL(j + 1); out.push(...densify([b, nb], 0.1).slice(1)); }
  }
  return out;
})();
/** 第 j 道横档画完的进度（用于点亮对应的一对珠子 / 数字） */
export const ZIG_RUNG_T: number[] = (() => {
  const c = cum3(ZIG_PTS), tot = c[c.length - 1], out: number[] = [];
  const per = 2 * RAIL_X, step = BEAD_DZ;
  for (let j = 1; j <= ZIG_N; j++) out.push(((j - 1) * (per + step) + per) / tot);
  return out;
})();

/* ================= 客人时间线 ================= */
export type Move = {t: number; d: number; a: V3; b: V3; h: number};
export type Guest = {id: string; kind: 'old' | 'new' | 'bus' | 'lane'; p0: V3 | ((f: number) => V3); appear: number; moves: Move[]; dim?: number};
export const guestPos = (g: Guest, f: number): V3 => {
  let p = typeof g.p0 === 'function' ? g.p0(f) : g.p0;
  for (const m of g.moves) {
    if (f < m.t) return p;
    if (f < m.t + m.d) return hopAt(m.a, m.b, m.h, eio((f - m.t) / m.d));
    p = m.b;
  }
  return p;
};
const hopH = (a: V3, b: V3) => Math.min(2.6, 0.35 + 0.09 * len3(sub(a, b)));
const mv = (t: number, a: V3, b: V3, d?: number): Move => ({t: Math.round(t), d: d ?? Math.round(clamp(14 + 0.9 * len3(sub(a, b)), 16, 46)), a, b, h: hopH(a, b)});

// —— 笔头经过的时刻（hook 画线 / n→n+1 波 / 上车）
const drawZ = (f: number) => lerp(THREAD_Z0, THREAD_Z1, glide(prog(f, T_DRAW0, T_DRAW1 - T_DRAW0)));
/** 门 m 出现：笔头到达它的深度时；画线终点之后的门沿走廊一路接力亮到雾里 */
export const doorAppear = (m: number) => {
  const z = roomZ(m);
  if (z >= THREAD_Z1) { for (let f = T_DRAW0; f <= T_DRAW1; f++) if (drawZ(f) <= z) return f; return T_DRAW1; }
  return Math.round(T_DRAW1 + (THREAD_Z1 - z) * 0.9);
};
export const shiftZ = (f: number) => (f < SH_NEAR ? lerp(ENTR[2] + 0.6, SH_Z1, glide(prog(f, SH0, SH_NEAR - SH0))) : lerp(SH_Z1, SH_ZF, eio(prog(f, SH_NEAR, SH_END - SH_NEAR))));
const passTime = (zfn: (f: number) => number, a: number, b: number, z: number, vFar: number) => {
  for (let f = a; f <= b; f++) if (zfn(f) <= z) return f;
  return Math.round(b + (zfn(b) - z) / vFar);
};
export const busFront = (f: number) => lerp(SH_ZF, BUS_FRONT, glide(prog(f, BUS0, BUS1 - BUS0)));
export const seatPos = (j: number, f: number): V3 => [0, 0.32, busFront(f) - 1.2 - (2 * j - 2) * DS];
export const boardZ = (f: number) => lerp(BUS_FRONT - 1.0, BOARD_Z1, glide(prog(f, BOARD0, BOARD1 - BOARD0)));
export const laneSeat = (c: number, n: number, f: number): V3 => {
  const arr = CURB_ARR[c - 1];
  return [laneX(c), 0.32, lerp(-90, 0, eo(prog(f, arr, 40))) - 1.0 - (n - 1) * 2.0];
};
// 车道 c 的车在笔头横穿它时开进来
export const curbX = (f: number) => lerp(0, CURB_X1, glide(prog(f, CURB0, CURB1 - CURB0)));
export const CURB_ARR: number[] = Array.from({length: NLANE}, (_, i) => { for (let f = CURB0; f <= CURB1; f++) if (curbX(f) >= laneX(i + 1)) return f - 12; return CURB1; });

// —— 素数幂：房间 m 的客人 → 2^m；车 c 第 n 位 → p_c^n
export const CH2_ROOMS = [2, 4, 8, 16], CH3_ROOMS = [3, 9, 27], CH5_ROOMS = [25, 5], CH7_ROOMS = [7, 49];
const chainTimes = (rooms: number[], a: number, b: number) => rooms.map((_r, i) => Math.round(a + ((i + 1) / rooms.length) * (b - a)));
const T2 = chainTimes(CH2_ROOMS, CH2_0, CH2_1), T3 = chainTimes(CH3_ROOMS, CH3_0, CH3_1);
const T5r = chainTimes(CH5_ROOMS, CH5_0, CH5_1), T7 = chainTimes(CH7_ROOMS, CH7_0, CH7_1);
/** 房间 m 的客人搬去 2^m 的时刻 */
const ppOld = (m: number) => (m <= 4 ? T2[m - 1] - 16 : CH2_1 + 4 + (m - 5) * 2);
const ppLane = (c: number, n: number) => {
  if (c === 1 && n <= 3) return T3[n - 1] - 16;
  if (c === 2 && n <= 2) return T5r[2 - n] - 16;
  if (c === 3 && n <= 2) return T7[n - 1] - 16;
  return CH7_1 + 2 + (c - 1) * 3 + (n - 1) * 5;
};
const pz = (m: number) => roomPos(Math.min(m, 400));
export const GUESTS: Guest[] = (() => {
  const out: Guest[] = [];
  // 新客人 G0：入口 → 房 1 → 房 2 → 房 4（2^2）
  const g0: Guest = {id: 'g0', kind: 'new', p0: ENTR, appear: NEWG, moves: [mv(WALKIN, ENTR, roomPos(1), 26), mv(ARC1 - 4, roomPos(1), roomPos(2), 24), mv(ppOld(2), roomPos(2), pz(4))]};
  out.push(g0);
  const h1 = (k: number) => passTime(shiftZ, SH0, SH_END, roomZ(k), 0.5) - 6;
  const h2 = (m: number) => (m === 1 ? ARC1 - 4 : m === 2 ? ARC2 - 4 : m === 3 ? ARC3 - 4 : DBL_REST + (m - 4) * 3);
  for (let k = 1; k <= NDOOR; k++) {
    const r1 = k + 1, r2 = 2 * r1;
    const moves = [mv(h1(k), roomPos(k), roomPos(r1), 18), mv(h2(r1), roomPos(r1), pz(r2))];
    moves.push(mv(Math.max(ppOld(r2), moves[1].t + moves[1].d + 2), pz(r2), pz(2 ** Math.min(r2, 9))));
    out.push({id: 'o' + k, kind: 'old', p0: roomPos(k), appear: doorAppear(k), moves});
  }
  const hb = (j: number) => passTime(boardZ, BOARD0, BOARD1, seatPos(j, BUS1 + 99)[2], 0.4) - 4;
  for (let j = 1; j <= 40; j++) {
    const r = 2 * j - 1;
    const s = seatPos(j, BUS1 + 99);
    const b1 = mv(hb(j), s, roomPos(r), 22);
    const b2 = mv(Math.max(ppOld(r), b1.t + b1.d + 2), roomPos(r), pz(2 ** Math.min(r, 9)));
    out.push({id: 'b' + j, kind: 'bus', p0: (f) => seatPos(j, f), appear: BUS0, moves: [b1, b2]});
  }
  for (let c = 1; c <= 6; c++) for (let n = 1; n <= 6; n++) {
    const s = laneSeat(c, n, CURB1 + 200);
    const room = busPrime(c) ** n;
    out.push({id: `l${c}-${n}`, kind: 'lane', p0: (f) => laneSeat(c, n, f), appear: CURB_ARR[c - 1], moves: [mv(ppLane(c, n), s, pz(room))]});
  }
  return out;
})();
/** 房间 m 此刻是否有人（0..1，用距离平滑） */
export const occupied = (m: number, f: number, gp: V3[]) => {
  const p = roomPos(m);
  let o = 0;
  for (const q of gp) { const d = Math.abs(q[0] - p[0]) + Math.abs(q[2] - p[2]) + Math.abs(q[1]) * 0.8; if (d < 0.7) o = Math.max(o, 1 - d / 0.7); }
  return o;
};

/* ================= 笔画表 ================= */
export type Kind = 'draw' | 'link' | 'trace';
export type S3 = {id: string; at: number; dur: number; kind: Kind; pts: V3[]; ease?: (t: number) => number; progF?: (f: number) => number; r?: number; color?: string; core?: string; bridge?: boolean; keep?: boolean};
export const progOf = (s: S3, f: number): number => (s.progF ? s.progF(f) : (s.ease ?? ss)(prog(f, s.at, s.dur)));

const THREAD_PTS = densify([tpt(THREAD_Z0), tpt(THREAD_Z1)], 0.1);
const THREAD_FAR = densify([tpt(THREAD_Z1), tpt(-150)], 0.3);
const zProg = (z0: number, z1: number, zfn: (f: number) => number) => (f: number) => clamp((z0 - zfn(f)) / (z0 - z1));
const hopChain = (pts: V3[]): V3[] => { const out: V3[] = []; for (let i = 0; i < pts.length - 1; i++) out.push(...hop(pts[i], pts[i + 1], hopH(pts[i], pts[i + 1]) * 0.9, 40).slice(i ? 1 : 0)); return out; };
const HC = (m: number) => head(roomPos(m));
const laneHead = (c: number) => head(laneSeat(c, 1, CURB1 + 200));

const D: S3[] = [
  // hook
  {id: 'thread', kind: 'draw', at: T_DRAW0, dur: T_DRAW1 - T_DRAW0, progF: zProg(THREAD_Z0, THREAD_Z1, drawZ), pts: THREAD_PTS, r: 0.02, keep: true},
  {id: 'ret', kind: 'link', at: RET0, dur: RET1 - RET0, ease: eio, pts: bez(tpt(THREAD_Z1), [0, 3.6, THREAD_Z1 + 6], [0, 3.2, ENTR[2] - 6], add(ENTR, [0, 0, 0.6]), 160), r: 0.014},
  // one：沿线走（已有的线 → trace）
  {id: 'shift', kind: 'trace', at: SH0, dur: SH_END - SH0, progF: zProg(ENTR[2] + 0.6, SH_ZF, shiftZ), pts: densify([add(ENTR, [0, 0, 0.6]), tpt(SH_ZF)], 0.1)},
  // bus：笔头在车头，从雾里回到入口
  {id: 'busin', kind: 'trace', at: BUS0, dur: BUS1 - BUS0, progF: zProg(SH_ZF, BUS_FRONT, busFront), pts: densify([tpt(SH_ZF), tpt(BUS_FRONT)], 0.1)},
  {id: 'arc1', kind: 'draw', at: ARC1 - 4, dur: 24, ease: ss, pts: hop(HC(1), HC(2), 0.55), r: 0.016},
  {id: 'arc2', kind: 'draw', at: ARC2 - 4, dur: 20, ease: ss, pts: hop(HC(2), HC(4), 0.6), r: 0.016},
  {id: 'arc3', kind: 'draw', at: ARC3 - 4, dur: 26, ease: ss, pts: hop(HC(3), HC(6), 0.7), r: 0.016},
  {id: 'board', kind: 'trace', at: BOARD0, dur: BOARD1 - BOARD0, progF: zProg(BUS_FRONT - 1.0, BOARD_Z1, boardZ), pts: densify([tpt(BUS_FRONT - 1.0), tpt(BOARD_Z1)], 0.1)},
  {id: 'curb', kind: 'draw', at: CURB0, dur: CURB1 - CURB0, progF: (f) => curbX(f) / CURB_X1, pts: densify([tpt(CURB_Z), [CURB_X1, 0.02, CURB_Z]], 0.1), r: 0.02, keep: true},
  // 素数幂链
  {id: 'ch2', kind: 'draw', at: CH2_0, dur: CH2_1 - CH2_0, ease: glide, pts: hopChain([head(add(ENTR, [0, 0, -1.4])), ...CH2_ROOMS.map(HC)]), r: 0.016},
  {id: 'ch3', kind: 'draw', at: CH3_0, dur: CH3_1 - CH3_0, ease: glide, pts: hopChain([laneHead(1), ...CH3_ROOMS.map(HC)]), r: 0.016, color: '#ffc27a'},
  {id: 'ch5', kind: 'draw', at: CH5_0, dur: CH5_1 - CH5_0, ease: glide, pts: hopChain([...CH5_ROOMS.map(HC), laneHead(2)]), r: 0.016, color: '#f0a060'},
  {id: 'ch7', kind: 'draw', at: CH7_0, dur: CH7_1 - CH7_0, ease: glide, pts: hopChain([laneHead(3), ...CH7_ROOMS.map(HC)]), r: 0.016, color: '#ffd9a6'},
  // cantor
  {id: 'ccard', kind: 'draw', at: CCARD0, dur: CCARD1 - CCARD0, ease: ss, pts: [], r: 0.012},
  {id: 'zig', kind: 'draw', at: ZIG0, dur: ZIG1 - ZIG0, ease: glide, pts: ZIG_PTS, r: 0.016},
  // twist
  {id: 'tframe', kind: 'draw', at: TFRAME0, dur: TFRAME1 - TFRAME0, ease: ss, pts: [], r: 0.012},
  {id: 'diag', kind: 'draw', at: DIAG_T[0] - 10, dur: DIAG_T[6] - DIAG_T[0] + 10, pts: [], r: 0.014},
  {id: 'pass', kind: 'trace', at: PASS0, dur: PASS1 - PASS0, ease: (t) => glide(t), pts: densify([tpt(ENTR[2] + 0.6), tpt(PASS_Z1)], 0.1)},
  // end
  {id: 'hcard2', kind: 'draw', at: HC2_0, dur: HC2_1 - HC2_0, ease: ss, pts: [], r: 0.012},
  {id: 'door', kind: 'draw', at: DOOR0, dur: DOOR1 - DOOR0, ease: ss, pts: [], r: 0.02},
  {id: 'final', kind: 'draw', at: FINAL0, dur: FINAL1 - FINAL0, ease: ss, pts: [], r: 0.02},
];
// 依赖相机 / 卡片的笔画点位，第一次调用时补上
export const DOOR_W2 = 1.7, DOOR_H2 = 3.3;
const fillLate = () => {
  const byId = (id: string) => D.find((s) => s.id === id)!;
  byId('ccard').pts = CARDS().cantor.pts;
  byId('tframe').pts = TABLE().pts;
  byId('hcard2').pts = CARDS().hilbert2.pts;
  // 对角线：从 (1,1) 往下到 (7,7)，每格都穿过；进度按口播的时刻分段
  const cells = Array.from({length: 7}, (_, i) => cellPt(i + 1, i + 1));
  const start = add(cells[0], mul(sub(cells[0], cells[1]), 0.6));
  const dpts = densify([start, ...cells], 0.04);
  const dg = byId('diag'); dg.pts = dpts;
  const cc = cum3(dpts), tot = cc[cc.length - 1];
  const tAt = [0, ...cells.map((c) => { let i = 0; for (; i < dpts.length; i++) if (len3(sub(dpts[i], c)) < 1e-6) break; return cc[Math.min(i, dpts.length - 1)] / tot; })];
  const ts = [DIAG_T[0] - 10, ...DIAG_T];
  dg.progF = (f) => { if (f <= ts[0]) return 0; for (let i = 1; i < ts.length; i++) if (f < ts[i]) return lerp(tAt[i - 1], tAt[i], ss((f - ts[i - 1]) / (ts[i] - ts[i - 1]))); return 1; };
  // 门：从左下角起，顺着门框画一圈（底边留空 = 门口）
  const dx = DOOR_W2 / 2;
  byId('door').pts = densify([oe([-dx, 0, 0]), oe([-dx, DOOR_H2 - 0.3, 0]), oe([-dx + 0.3, DOOR_H2, 0]), oe([dx - 0.3, DOOR_H2, 0]), oe([dx, DOOR_H2 - 0.3, 0]), oe([dx, 0, 0])], 0.06);
  byId('final').pts = cr3([oe([dx, 0.02, 0.4]), oe([0.5, 0.02, 0.9]), oe([0, 0.02, 0.6]), oe([0, 0.2, -1.0]), oe([0.2, 1.4, -4]), oe([0.6, 4.0, -9]), oe([1.4, 8.5, -16]), oe([2.2, 14, -24])], 16);
};

/* ---------- 场间长金线（相机沿它飞）与场内细连线：自动补在相邻两笔之间 ---------- */
export const FLIGHTS: {from: string; to: string; a: number; lift: V3; wmax?: number}[] = [
  {from: 'ch7', to: 'ccard', a: L(17) - 10, lift: [0, 6, -6], wmax: 0.3},
  {from: 'zig', to: 'tframe', a: L(22) + 50, lift: [0, 8, 10], wmax: 0.4},
  {from: 'pass', to: 'hcard2', a: CLIMAX + 40, lift: [0, 3, -4]},
];
const endOf = (s: S3) => headOf(s.pts, progOf(s, s.at + s.dur));
const startOf = (s: S3) => headOf(s.pts, progOf(s, s.at));
const tanOf = (pts: V3[], end: boolean): V3 => {
  const n = pts.length;
  const a = end ? pts[Math.max(0, n - 4)] : pts[0], b = end ? pts[n - 1] : pts[Math.min(n - 1, 3)];
  const d = sub(b, a), l = len3(d) || 1;
  return mul(d, 1 / l);
};
export let STROKES3: S3[] = [];
export const S3ID: Record<string, S3> = {};
const buildStrokes = () => {
  fillLate();
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
      const ta = tanOf(s.pts, true), tb = tanOf(nx.pts, false);
      const span = len3(sub(pb, pa));
      const c1 = add(add(pa, mul(ta, span * 0.2)), fl.lift), c2 = add(sub(pb, mul(tb, span * 0.3)), mul(fl.lift, 0.35));
      out.push({id: 'bridge-' + nx.id, kind: 'link', bridge: true, at: Math.max(fl.a, e), dur: nx.at - Math.max(fl.a, e), ease: eio, pts: bez(pa, c1, c2, pb, 220), r: 0.02});
      continue;
    }
    const gap = nx.at - e;
    const dist = len3(sub(pb, pa));
    if (dist < 1e-3) continue;
    if (gap <= 0) throw new Error(`stroke ${nx.id} starts away from ${s.id} without a gap (${dist.toFixed(2)})`);
    const dur = Math.min(gap, Math.max(10, Math.min(50, Math.round(dist * 2.4))));
    const ta = tanOf(s.pts, true), tb = tanOf(nx.pts, false);
    const k = Math.min(dist * 0.35, 2.5);
    out.push({id: 'link-' + nx.id, kind: 'link', at: nx.at - dur, dur, ease: ss, pts: bez(pa, add(pa, mul(ta, k)), sub(pb, mul(tb, k)), pb, 90), r: 0.01});
  }
  out.sort((a, b) => a.at - b.at);
  STROKES3 = out;
  for (const s of out) S3ID[s.id] = s;
};

/** 唯一笔头 */
export const pen3 = (f: number): {p: V3; o: number; moving: boolean} => {
  let last: S3 | null = null;
  for (const s of STROKES3) {
    if (f >= s.at && f < s.at + s.dur) return {p: headOf(s.pts, progOf(s, f)), o: s.kind === 'link' ? (s.bridge ? 0.95 : 0.85) : 1, moving: true};
    if (s.at + s.dur <= f) last = s;
  }
  if (!last) { const s0 = STROKES3[0]; return {p: startOf(s0), o: 0.85 * eo(prog(f, 0, 14)), moving: false}; }
  const e = last.at + last.dur;
  return {p: headOf(last.pts, progOf(last, e)), o: lerp(1, 0.88, prog(f, e, 20)) * (1 - prog(f, FRAMES - 34, 30)), moving: false};
};

/* ================= 相机（关键帧 + 飞行跟拍 + 轻微呼吸） ================= */
export const calmAt = (f: number) => {
  const dense: [number, number][] = [[EQ1 - 30, LE(22)], [ROWS0 - 20, DIAG_T[6] + 30], [L(30) - 20, LE(30) + 20], [CLIMAX, CLIMAX + 80]];
  let k = 1;
  for (const [a, b] of dense) k = Math.min(k, 1 - 0.7 * Math.min(ss((f - a + 20) / 20), 1 - ss((f - b) / 20)));
  return k;
};
let CAMF: ((f: number) => CamS) | null = null;
const buildCam = () => {
  const follow = FLIGHTS.map((fl) => {
    const br = S3ID['bridge-' + fl.to];
    const e = (f: number) => eio(clamp((f - br.at) / br.dur));
    return {a: br.at, b: br.at + br.dur, pts: br.pts, e, wmax: fl.wmax ?? clamp((br.dur - 30) / 50, 0.35, 0.8)};
  });
  const followCam = (fw: (typeof follow)[number], f: number): {pos: V3; tgt: V3} => {
    let pos: V3 = [0, 0, 0], tgt: V3 = [0, 0, 0];
    for (let i = -6; i <= 6; i++) {
      const u = fw.e(f + i);
      const p = headOf(fw.pts, u), a = headOf(fw.pts, clamp(u - 0.06)), b = headOf(fw.pts, clamp(u + 0.06));
      const dir = sub(b, a), l = len3(dir) || 1;
      pos = add(pos, add(sub(p, mul(dir, 4.5 / l)), [0, 1.2, 0]));
      tgt = add(tgt, add(p, mul(dir, 2.0 / l)));
    }
    return {pos: mul(pos, 1 / 13), tgt: mul(tgt, 1 / 13)};
  };
  CAMF = (f: number): CamS => {
    const k = keyCam(f);
    const c = calmAt(f);
    for (const fw of follow) {
      if (f > fw.a && f < fw.b) {
        const u = (f - fw.a) / (fw.b - fw.a); const w = fw.wmax * ss(u / 0.45) * (1 - ss((u - 0.55) / 0.45));
        if (w > 0) { const fc = followCam(fw, f); return {pos: lerp3(k.pos, fc.pos, w), tgt: lerp3(k.tgt, fc.tgt, w), fov: k.fov, roll: 0}; }
      }
    }
    const a = 0.1 * c, b = 0.04 * c;
    const sw: V3 = [a * Math.sin(f * 0.0123 + 0.4) + 0.4 * a * Math.sin(f * 0.031), 0.6 * a * Math.sin(f * 0.0097 + 1.3), 0.5 * a * Math.cos(f * 0.0081)];
    const sv: V3 = [b * Math.sin(f * 0.0071 + 2.0), b * Math.sin(f * 0.0089), 0];
    return {pos: add(k.pos, sw), tgt: add(k.tgt, sv), fov: k.fov, roll: 0.01 * c * Math.sin(f * 0.006)};
  };
};
export const camAt = (f: number): CamS => {
  if (!CAMF) { CAMF = keyCam; buildStrokes(); buildCam(); }
  return CAMF!(f);
};
/** 雾（世界和笔头共用） */
export const fogAt = (f: number) => {
  const cant = Math.min(ss((f - (L(17) + 40)) / 40), 1 - ss((f - (LE(22) + 30)) / 40));
  return {fog: lerp(0.034, 0.02, cant), near: lerp(9, 12, cant)};
};
export const fogK = (f: number, d: number) => { const g = fogAt(f); const x = Math.max(0, d - g.near) * g.fog; return Math.exp(-x * x); };
camAt(0);
