// ep58「Hạt gạo trên bàn cờ」· 9:16 竖屏 · 纯模块（无 React、无 GL 状态）：玻璃棋盘布局、米堆尺寸模型、唯一金线（全部笔画 + 自动连线）、
// 唯一笔头、相机（目标点 + 对数距离的球坐标关键帧：后半盘的"指数拉远"在 log 空间插值）、按尺度缩放的雾。
// 时间常量全部来自 timing（口播实测 + WordBoundary）。通用小工具与 ep57 scene3.ts 相同（复制，每集独立）。
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
export const cumOf = (pts: V3[]) => { let c = CUMS.get(pts); if (!c) { c = cum3(pts); CUMS.set(pts, c); } return c; };
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
export const hopAt = (a: V3, b: V3, h: number, t: number): V3 => { const p = lerp3(a, b, t); return [p[0], p[1] + 4 * h * t * (1 - t), p[2]]; };

/* ================= 棋盘：64 格，ô 1 在近处左下角，蛇形（boustrophedon）排列，相邻两格永远相邻 ================= */
export const BH = 4.0; // 半边长（格子 1.0）
export const sqRC = (n: number) => { const r = Math.floor((n - 1) / 8); const c = r % 2 === 0 ? (n - 1) % 8 : 7 - ((n - 1) % 8); return {r, c}; };
export const sq = (n: number): V3 => { const {r, c} = sqRC(n); return [c - 3.5, 0, 3.5 - r]; };
export const isLight = (n: number) => { const {r, c} = sqRC(n); return (r + c) % 2 === 1; };

/* ================= 米堆尺寸模型（世界单位） =================
   ô 1–6：一粒一粒（2^(n−1) 粒）；ô 7–32：小米堆（锥体，高度/半径随 n 缓慢长）；ô 33+：米山 = 自相似锥体，
   体积 ∝ 2^(n−32)（半径、高度都 ∝ 2^((n−32)/3)），所以后半盘的米山大小是"诚实"的相对比例。 */
export const GRAIN_N = 6;
export const moundRH = (n: number): [number, number] => {
  if (n <= 32) { const t = clamp((n - 7) / 25); return [0.14 + 0.28 * Math.pow(t, 0.8), 0.06 + 0.44 * Math.pow(t, 1.3)]; }
  const k = Math.pow(2, (n - 32) / 3);
  return [0.42 * k, 0.5 * k];
};
export const topH = (n: number) => (n <= GRAIN_N ? 0.07 + 0.012 * n : moundRH(n)[1] * 1.04 + 0.03);
export const top = (n: number): V3 => add(sq(n), [0, topH(n), 0]);

/* ================= 时间常量（帧） ================= */
// hook
export const RING0 = wd(0, 'hạt') - 6, RING1 = wd(0, 'gạo') + 16;
export const X2 = wd(0, 'Gấp'), X63 = wd(0, 'sáu'), TITLE0 = wd(1, 'khánh') - 4;
// legend
export const FRAME0 = L(2) - 6, FRAME1 = wd(2, 'cờ') - 2;
export const MCARD0 = wd(2, 'vua') + 2, MCARD1 = MCARD0 + 34;
export const SQ1_0 = wd(4, 'ô') - 2, SQ1_1 = wd(4, 'gạo') + 6;
export const SQ2_0 = wd(4, 'sau') - 6, SQ2_1 = wd(4, 'trước') + 6;
export const PREV0 = wd(4, 'cứ') - 2, PREV1 = wd(4, 'tư') + 10;
export const BACK0 = wd(5, 'bật') - 4, BACK1 = L(6) - 6;
// half1 / half2：笔头所在的格子 s(f)（连续值）—— 关键帧（帧, 格）
export const HOP0 = wd(6, 'hạt') + 2;
export const S_KEYS: [number, number][] = [
  [HOP0, 1], [wd(7, 'mười'), 10],
  [wd(7, 'mười') + 24, 10], [wd(8, 'hai'), 20],
  [wd(8, 'hai') + 22, 20], [wd(9, 'cờ'), 32],
  [wd(12, 'cộng') - 6, 32], [wd(12, 'thêm'), 33],
  [wd(12, 'hạt') + 4, 33], [wd(13, 'bốn'), 40],
  [wd(13, 'tấn'), 40], [wd(14, 'năm'), 50],
  [wd(14, 'tấn') - 6, 50], [wd(15, 'cuối'), 64],
];
export const HOP1 = S_KEYS[S_KEYS.length - 1][0];
export const sAt = (f: number): number => {
  if (f <= S_KEYS[0][0]) return 1;
  for (let i = 0; i < S_KEYS.length - 1; i++) {
    const [fa, sa] = S_KEYS[i], [fb, sb] = S_KEYS[i + 1];
    if (f <= fb) return sa === sb ? sa : lerp(sa, sb, eio((f - fa) / (fb - fa)));
  }
  return 64;
};
/** 当前（已落地的）格子 */
export const curSq = (f: number) => Math.max(1, Math.min(64, Math.floor(sAt(f) + 0.02)));
/** 第 n 格米堆的出现量（笔头落下前 35% 跳跃时开始） */
export const appear = (n: number, f: number) => (n === 1 ? 1 : f < HOP0 ? 0 : ss((sAt(f) - (n - 0.38)) / 0.38));
/** 米山（后半盘）连续缩放系数：s ≥ 32 时 2^((s−32)/3) */
export const mountainK = (f: number) => Math.pow(2, (Math.max(32, sAt(f)) - 32) / 3);
export const HALF_TXT0 = wd(9, 'Hết') - 2;
export const KING_OK = wd(10, 'trả') - 4;
export const RULE0 = wd(12, 'Mỗi');
// total / proof / climax
export const TOT0 = L(16) - 2, PROOF0 = wd(16, 'hai') - 4, PROOF1 = L(17) - 10;
export const WEIGHT_T = wd(17, 'nặng');
// earth
export const EARTH0 = L(18) - 10, EARTHC0 = L(18) + 6, EARTHC1 = EARTHC0 + 40;
export const ORBIT0 = wd(19, 'gom') - 6, ORBIT1 = LE(19) + 4;
export const VNC0 = wd(20, 'Việt') - 12, VNC1 = VNC0 + 32;
// end
export const CURVE0 = L(21) + 2, CURVE1 = wd(21, 'tượng') + 4;
export const TAGS = [wd(22, 'Lãi'), wd(22, 'dịch'), wd(22, 'máy')];
export const FINAL0 = L(23) - 6, FINALT = wd(23, 'nhà') - 10;

/* ================= 相机：目标点 + 距离（log 插值）+ 方位角 + 俯仰角 ================= */
type Key = {f: number; t: V3; d: number; yaw: number; pitch: number; fov: number};
const K = (f: number, t: V3, d: number, yaw: number, pitch: number, fov = 46): Key => ({f: Math.round(f), t, d, yaw, pitch, fov});
const S1 = sq(1), S40 = sq(40), S50 = sq(50), S64 = sq(64);
const EY = 5200; // 地球场景：相机升到米山上方很高的地方（crane up）
export const KEYS: Key[] = [
  K(0, add(S1, [0.04, 0.06, 0]), 1.3, 0.62, 0.3, 36),
  K(X2 - 4, add(S1, [0.04, 0.07, 0]), 1.55, 0.5, 0.33, 36),
  K(L(1) + 22, [-1.6, 0.4, 2.0], 9, 0.36, 0.6, 44),
  K(SC.legend + 10, [0, 0.0, 0.5], 21, 0.3, 0.74, 46),
  K(L(4), [0, -0.2, 0.6], 21.5, 0.16, 0.8, 46),
  K(LE(5) + 10, [-0.4, -0.1, 1.2], 17, 0.2, 0.74, 46),
  K(L(6), [-2.2, -0.6, 2.6], 9, 0.25, 0.9, 46),
  K(HOP0 + 4, [-2.0, -0.6, 2.6], 9.2, 0.24, 0.9, 46),
  K(wd(7, 'mười') + 6, [1.1, -0.6, 2.2], 11.5, 0.12, 0.86, 46),
  K(wd(8, 'hai') + 6, [0, -0.5, 1.2], 14.5, 0.02, 0.8, 46),
  K(wd(9, 'cờ') + 6, [0, -0.1, 0.5], 20, -0.08, 0.76, 46),
  K(L(10), [0, -0.1, 0.3], 20.5, -0.12, 0.74, 46),
  K(SC.half2 + 10, [0, -0.5, -0.2], 21, -0.2, 0.6, 46),
  K(wd(12, 'thêm'), [0.4, -0.3, -0.4], 21.5, -0.22, 0.52, 46),
  K(wd(13, 'bốn') + 4, [lerp(0, S40[0], 0.5), 1.6, -0.5], 27, -0.26, 0.42, 46),
  K(wd(14, 'năm') + 4, [S50[0], 19, S50[2]], 120, -0.3, 0.3, 46),
  K(wd(15, 'cuối') + 6, [S64[0], 250, S64[2]], 3800, -0.34, 0.22, 46),
  K(TOT0, [S64[0], 380, S64[2]], 4400, -0.36, 0.2, 46),
  K(PROOF0 + 50, [S64[0], 620, S64[2]], 5400, -0.37, 0.18, 46),
  K(CLIMAX, [S64[0], 560, S64[2]], 5600, -0.38, 0.17, 46),
  K(LE(17) + 4, [S64[0], 600, S64[2]], 6000, -0.39, 0.16, 46),
  K(EARTH0 + 30, [S64[0], EY, S64[2]], 5000, -0.42, 0.12, 46),
  K(L(20), [S64[0], EY + 160, S64[2]], 4550, -0.45, 0.11, 46),
  K(L(21), [S64[0], EY + 300, S64[2]], 4450, -0.47, 0.1, 46),
  K(FRAMES, [S64[0], EY + 420, S64[2]], 4300, -0.5, 0.09, 46),
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
const keyFns = (() => {
  const ks = [...KEYS].sort((a, b) => a.f - b.f);
  const ts = ks.map((k) => k.f);
  const c = (g: (k: Key) => number) => monotone(ts, ks.map(g));
  return {tx: c((k) => k.t[0]), ly: c((k) => Math.log(k.t[1] + 1)), tz: c((k) => k.t[2]), ld: c((k) => Math.log(k.d)), yaw: c((k) => k.yaw), pitch: c((k) => k.pitch), fov: c((k) => k.fov)};
})();
/** 相机到目标点的距离（场景尺度） */
/* 40 → 50 的快速跳格：米山（k 增长 10 倍）比关键帧的拉远（4.4 倍）快，ô 49–50 时米山出画、压到字幕（f≈1625–1660）。
   这一段相机距离 / 目标高度取"关键帧"与"装下米山所需"的平滑最大值（log 空间 softmax），只在 1598–1700 生效（两端平滑过渡）。 */
const FIT0 = 1598, FIT1 = 1700;
const smax = (a: number, b: number, k = 8) => { const m = Math.max(a, b); return m + Math.log(Math.exp((a - m) * k) + Math.exp((b - m) * k)) / k; };
const fitW = (f: number) => ss(prog(f, FIT0, 14)) * (1 - ss(prog(f, FIT1 - 24, 24)));
const fitK = (f: number) => Math.pow(2, (Math.max(32, sAt(f)) - 32) / 3);
const ldAt = (f: number) => { const w = fitW(f), a = keyFns.ld(f); return w <= 0 ? a : lerp(a, smax(a, Math.log(2.6 * fitK(f))), w); };
const fitWy = (f: number) => ss(prog(f, 1600, 26)) * (1 - ss(prog(f, 1668, 40))); // gentler ramps for the target height (no fast tilt)
const lyAt = (f: number) => { const w = fitWy(f), a = keyFns.ly(f); return w <= 0 ? a : lerp(a, Math.log(0.1 * fitK(f) + 1), w); };
export const distAt = (f: number) => Math.exp(ldAt(f));
export const baseCam = (f: number): CamS => {
  const d = distAt(f), yaw = keyFns.yaw(f), pt = keyFns.pitch(f);
  const t: V3 = [keyFns.tx(f), Math.exp(lyAt(f)) - 1, keyFns.tz(f)];
  const pos = add(t, mul([Math.cos(pt) * Math.sin(yaw), Math.sin(pt), Math.cos(pt) * Math.cos(yaw)], d));
  return {pos, tgt: t, fov: keyFns.fov(f)};
};
/** 只按关键帧的相机（不含 1598–1700 的"装下米山"修正）：浮尘的生成位置用它，保证修正前后渲染的分段之间浮尘完全一致 */
export const camKeyAt = (f: number): CamS => {
  const d = Math.exp(keyFns.ld(f)), yaw = keyFns.yaw(f), pt = keyFns.pitch(f);
  const t: V3 = [keyFns.tx(f), Math.exp(keyFns.ly(f)) - 1, keyFns.tz(f)];
  const pos = add(t, mul([Math.cos(pt) * Math.sin(yaw), Math.sin(pt), Math.cos(pt) * Math.cos(yaw)], d));
  const dd = d * 0.006;
  const sw: V3 = [dd * Math.sin(f * 0.0123 + 0.4) + 0.4 * dd * Math.sin(f * 0.031), 0.6 * dd * Math.sin(f * 0.0097 + 1.3), 0.5 * dd * Math.cos(f * 0.0081)];
  return {pos: add(pos, sw), tgt: add(t, mul(sw, 0.3)), fov: keyFns.fov(f), roll: 0.006 * Math.sin(f * 0.006)};
};
export const distKeyAt = (f: number) => Math.exp(keyFns.ld(f));
/** 轻微呼吸（按尺度缩放）；后半盘的指数拉远段不加 */
export const camAt = (f: number): CamS => {
  const c = baseCam(f);
  const d = distAt(f) * 0.006;
  const sw: V3 = [d * Math.sin(f * 0.0123 + 0.4) + 0.4 * d * Math.sin(f * 0.031), 0.6 * d * Math.sin(f * 0.0097 + 1.3), 0.5 * d * Math.cos(f * 0.0081)];
  return {pos: add(c.pos, sw), tgt: add(c.tgt, mul(sw, 0.3)), fov: c.fov, roll: 0.006 * Math.sin(f * 0.006)};
};
/** 雾 / 景深随尺度缩放：近处清楚，远处淡出（远处重复几何不会叠成白点） */
export const fogAt = (f: number) => { const d = distAt(f); return {fog: 0.33 / d, near: 0.95 * d, coc: 0.45 / d, focus: d}; };
export const fogK = (f: number, dd: number) => { const g = fogAt(f); const x = Math.max(0, dd - g.near) * g.fog; return Math.exp(-x * x); };

/* ---------- 屏幕位置 + 深度 → 世界（卡片 / 曲线也活在 3D 里，有视差） ---------- */
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
  return {c: ctr, w: wpx * k, h: hpx * k, r: rpx * k, ex: b.right, ey: b.up, k, pts: densify(rrect3(ctr, wpx * k, hpx * k, rpx * k, b.right, b.up), Math.max(wpx, hpx) * k / 300)};
};
export const rectPt = (r: Rect3, px: number, py: number): V3 => add(r.c, add(mul(r.ex, px * r.k), mul(r.ey, -py * r.k)));
const circ = (r: Rect3, rad: number, a0: number, turns: number, grow = 0, n = 220): V3[] => Array.from({length: Math.round(n * turns) + 1}, (_, i) => {
  const t = i / (n * turns), a = a0 - t * turns * Math.PI * 2, rr = rad * (1 + grow * t);
  return rectPt(r, Math.cos(a) * rr, -Math.sin(a) * rr);
});
let _cards: Record<string, Rect3> | null = null;
export const CARDS = () => (_cards ??= {
  chess: hudRect(wd(2, 'vua', 1), 540, 480, 380, 480, distAt(wd(2, 'vua', 1)) * 0.62, 16),
  earth: hudRect(L(18) + 30, 540, 615, 500, 500, distAt(L(18) + 30) * 0.8, 250),
  vn: hudRect(L(20) + 20, 540, 1095, 460, 232, distAt(L(20) + 20) * 0.72, 16),
});
/** 曲线 y = 2^x（屏幕布局在参考帧定好，深度从左往右略微变近 → 有立体感） */
export const CURVE_REF = L(21) + 10;
export const curvePt = (u: number): V3 => {
  const c = baseCam(CURVE_REF), d = distAt(CURVE_REF);
  const x = 170 + 700 * u, y = 1150 - 760 * (Math.pow(2, 10 * u) - 1) / 1023;
  return unproj(c, x, y, d * (0.78 - 0.12 * u));
};
export const CURVE_PTS = (() => { const out: V3[] = []; for (let i = 0; i <= 240; i++) out.push(curvePt(i / 240)); return out; })();

/* ================= 笔画表 ================= */
export type Kind = 'draw' | 'link';
export type S3 = {id: string; at: number; dur: number; kind: Kind; pts: V3[]; ease?: (t: number) => number; progF?: (f: number) => number; r?: number; color?: string; core?: string; dash?: number};
export const progOf = (s: S3, f: number): number => (s.progF ? s.progF(f) : (s.ease ?? ss)(prog(f, s.at, s.dur)));

const floorEllipse = (c: V3, rx: number, rz: number, a0 = Math.PI / 2, turns = 1, y = 0.012): V3[] =>
  Array.from({length: Math.round(72 * turns) + 1}, (_, i) => { const a = a0 + (i / 72) * Math.PI * 2; return [c[0] + rx * Math.cos(a), y, c[2] + rz * Math.sin(a)] as V3; });
const sqOutline = (n: number, s = 0.86, y = 0.014): V3[] => { const c = sq(n); return densify(rrect3([c[0], y, c[2]], s, s, 0.08, [1, 0, 0], [0, 0, -1]), 0.03); };
/* 笔头一路的点 */
export const RING_PTS = floorEllipse(add(S1, [0, 0, 0]), 0.3, 0.2, Math.PI * 0.55, 1.08);
export const FRAME_PTS = (() => { const r = rrect3([0, 0.012, 0], 2 * BH + 0.3, 2 * BH + 0.3, 0.3, [1, 0, 0], [0, 0, -1]); const i0 = r.length - 9; return densify([...r.slice(i0 + 4), ...r.slice(0, i0 + 5)], 0.06); })();
const SQ1_PTS = sqOutline(1);
const SQ2_PTS = (() => { const a = SQ1_PTS[SQ1_PTS.length - 1], o = sqOutline(2); const h = Array.from({length: 31}, (_, i) => hopAt(a, o[0], 0.45, i / 30)); return [...h, ...o.slice(1)]; })();
export const PREV_PTS = (() => { const out: V3[] = []; for (let n = 2; n <= 64; n++) out.push(add(sq(n), [0, 0.016, 0])); return densify(out, 0.05); })();
const BACK_PTS = (() => { const a = add(sq(64), [0, 0.016, 0]), b = top(1); return bez(a, add(a, [0.5, 3.4, 1.2]), add(b, [0.3, 3.0, -1.0]), b, 160); })();
/** 跳格的金线：ô n 顶 → ô n+1 顶（抛物线）；后半盘爬上米山的山顶 */
export const NH = 24;
export const HOPS_PTS: V3[] = (() => {
  const out: V3[] = [top(1)];
  for (let n = 1; n < 64; n++) {
    const a = top(n), b = top(n + 1), dh = Math.abs(b[1] - a[1]);
    const h = n < 32 ? 0.32 + 0.4 * dh : 0.12 * dh + 0.25;
    for (let i = 1; i <= NH; i++) out.push(hopAt(a, b, h, i / NH));
  }
  return out;
})();
const HCUM = cum3(HOPS_PTS);
/** 格 s（连续）→ 金线进度（弧长比例） */
export const hopFrac = (s: number) => {
  const x = (clamp(s, 1, 64) - 1) * NH, i = Math.floor(x), t = x - i;
  const tot = HCUM[HCUM.length - 1];
  return (i >= HCUM.length - 1 ? tot : lerp(HCUM[i], HCUM[i + 1], t)) / tot;
};
export const EARTH_PTS = () => circ(CARDS().earth, 262, Math.PI * 0.75, 1.0);
export const ORBIT_PTS = () => { const e = EARTH_PTS(); const o = circ(CARDS().earth, 262, Math.PI * 0.75, 4.6, 0.13, 260); return [...o.slice(0)].map((p, i) => (i === 0 ? e[e.length - 1] : p)); };
export const FINAL_PTS = () => { const a = CURVE_PTS[CURVE_PTS.length - 1], c = baseCam(CURVE_REF), d = distAt(CURVE_REF); return cr3([a, unproj(c, 905, 180, d * 0.66), unproj(c, 960, -260, d * 0.6)], 30); };

const D: S3[] = [
  {id: 'ring', kind: 'draw', at: RING0, dur: RING1 - RING0, ease: glide, pts: RING_PTS, r: 0.004},
  {id: 'frame', kind: 'draw', at: FRAME0, dur: FRAME1 - FRAME0, ease: glide, pts: FRAME_PTS, r: 0.02},
  {id: 'mcard', kind: 'draw', at: MCARD0, dur: MCARD1 - MCARD0, ease: ss, pts: [], r: 0.02},
  {id: 'sq1', kind: 'draw', at: SQ1_0, dur: SQ1_1 - SQ1_0, ease: ss, pts: SQ1_PTS, r: 0.012},
  {id: 'sq2', kind: 'draw', at: SQ2_0, dur: SQ2_1 - SQ2_0, ease: glide, pts: SQ2_PTS, r: 0.012},
  {id: 'prev', kind: 'draw', at: PREV0, dur: PREV1 - PREV0, ease: glide, pts: PREV_PTS, r: 0.008, dash: 90},
  {id: 'back', kind: 'draw', at: BACK0, dur: BACK1 - BACK0, ease: glide, pts: BACK_PTS, r: 0.012},
  {id: 'hops', kind: 'draw', at: HOP0, dur: HOP1 - HOP0, progF: (f) => hopFrac(sAt(f)), pts: HOPS_PTS, r: 0.012},
  {id: 'earth', kind: 'draw', at: EARTHC0, dur: EARTHC1 - EARTHC0, ease: ss, pts: [], r: 1},
  {id: 'orbit', kind: 'draw', at: ORBIT0, dur: ORBIT1 - ORBIT0, ease: glide, pts: [], r: 1},
  {id: 'vn', kind: 'draw', at: VNC0, dur: VNC1 - VNC0, ease: ss, pts: [], r: 1},
  {id: 'curve', kind: 'draw', at: CURVE0, dur: CURVE1 - CURVE0, ease: (t) => glide(t), pts: CURVE_PTS, r: 1},
  {id: 'final', kind: 'draw', at: FINAL0, dur: FRAMES - 34 - FINAL0, ease: ss, pts: [], r: 1},
];
const fillLate = () => {
  const by = (id: string) => D.find((s) => s.id === id)!;
  by('mcard').pts = CARDS().chess.pts;
  by('earth').pts = EARTH_PTS();
  by('orbit').pts = ORBIT_PTS();
  by('vn').pts = CARDS().vn.pts;
  by('final').pts = FINAL_PTS();
  // 远景笔画（地球 / 曲线）的世界半径 = 屏幕上约 1.6 px 的尺度
  for (const id of ['earth', 'orbit', 'vn', 'curve', 'final']) by(id).r = distAt(by(id).at) * 0.0012;
};

const tanOf = (pts: V3[], end: boolean): V3 => {
  const n = pts.length;
  const a = end ? pts[Math.max(0, n - 4)] : pts[0], b = end ? pts[n - 1] : pts[Math.min(n - 1, 3)];
  const d = sub(b, a), l = len3(d) || 1;
  return mul(d, 1 / l);
};
const endOf = (s: S3) => headOf(s.pts, progOf(s, s.at + s.dur));
const startOf = (s: S3) => headOf(s.pts, progOf(s, s.at));
export let STROKES3: S3[] = [];
export const S3ID: Record<string, S3> = {};
/** 自动连线：相邻两笔之间补一条（远距离 = 长弧，相机正好在 crane） */
const LINK_DUR: Record<string, number> = {earth: 70};
const buildStrokes = () => {
  fillLate();
  const ds = [...D].sort((a, b) => a.at - b.at);
  const out: S3[] = [];
  for (let i = 0; i < ds.length; i++) {
    const s = ds[i];
    out.push(s);
    const nx = ds[i + 1];
    if (!nx) break;
    const pa = endOf(s), pb = startOf(nx);
    const e = s.at + s.dur, gap = nx.at - e, dist = len3(sub(pa, pb));
    if (dist < 1e-3 * Math.max(1, distAt(nx.at))) continue;
    if (gap <= 0) throw new Error(`stroke ${nx.id} starts away from ${s.id} without a gap (${dist.toFixed(2)})`);
    const dur = Math.min(gap, LINK_DUR[nx.id] ?? Math.max(12, Math.min(40, Math.round(12 + 6 * Math.log2(1 + dist)))));
    const ta = tanOf(s.pts, true), tb = tanOf(nx.pts, false);
    const k = dist < 7 ? Math.min(dist * 0.35, 2.5) : dist * 0.3;
    out.push({id: 'link-' + nx.id, kind: 'link', at: nx.at - dur, dur, ease: ss, pts: bez(pa, add(pa, mul(ta, k)), sub(pb, mul(tb, k)), pb, 120), r: Math.max(0.008, distAt(nx.at) * 0.0009)});
  }
  out.sort((a, b) => a.at - b.at);
  STROKES3 = out;
  for (const s of out) S3ID[s.id] = s;
};

/** 唯一笔头 */
export const pen3 = (f: number): {p: V3; o: number; moving: boolean} => {
  let last: S3 | null = null;
  for (const s of STROKES3) {
    if (f >= s.at && f < s.at + s.dur) return {p: headOf(s.pts, progOf(s, f)), o: s.kind === 'link' ? 0.85 : 1, moving: true};
    if (s.at + s.dur <= f) last = s;
  }
  if (!last) { const s0 = STROKES3[0]; return {p: startOf(s0), o: 0.85 * eo(prog(f, 0, 14)), moving: false}; }
  const e = last.at + last.dur;
  return {p: headOf(last.pts, progOf(last, Math.max(e, f))), o: lerp(1, 0.85, prog(f, e, 20)) * (1 - prog(f, FRAMES - 34, 30)), moving: false};
};
buildStrokes();
