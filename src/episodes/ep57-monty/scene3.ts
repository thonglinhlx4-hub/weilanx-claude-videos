// ep57「Ba cánh cửa Monty Hall」· 9:16 竖屏 · 纯模块（无 React、无 GL 状态）：3D 布局（三扇门的舞台、三层玻璃台、百万门阵、两根光柱）、
// 唯一金线（全部笔画 + 自动连线 / 场间长线）+ 唯一笔头 + 相机路径 + 雾。时间常量全部来自 timing（口播实测 + WordBoundary）。
// 通用小工具与 ep56 scene3.ts 相同（复制，不共享：每集独立）。
import * as THREE from 'three';
import {CLIMAX, FRAMES, L, LE, SC, wd} from './timing';
import type {CamS, V3} from './gl';
import {H, W} from './gl';
import {CUM_STAY} from './facts';

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

/* ================= 主舞台：三扇门（轻微弧形排开，两侧的门略朝向中间） ================= */
export const DW = 1.3, DH = 2.7;
export const DOORX = [0, -1.95, 0, 1.95], DOORZ = [0, 0.35, 0, 0.35], YAW = [0, 0.17, 0, -0.17];
/** 门 k（1..3）本地坐标 (lx 横向, ly 高, lz 朝外) → 世界 */
export const doorPt = (k: number, lx: number, ly: number, lz = 0): V3 => {
  const c = Math.cos(YAW[k]), s = Math.sin(YAW[k]);
  return [DOORX[k] + c * lx + s * lz, ly, DOORZ[k] - s * lx + c * lz];
};
/** 门框（左下 → 上 → 右下，圆角） */
export const doorFrame = (k: number, w = DW, h = DH, out = 0.02): V3[] => {
  const hw = w / 2, r = 0.16, pts: V3[] = [];
  pts.push(doorPt(k, -hw, 0, out), doorPt(k, -hw, h - r, out));
  for (let i = 1; i <= 6; i++) { const a = Math.PI - (i / 6) * (Math.PI / 2); pts.push(doorPt(k, -hw + r + Math.cos(a) * r, h - r + Math.sin(a) * r, out)); }
  pts.push(doorPt(k, hw - r, h, out));
  for (let i = 1; i <= 6; i++) { const a = Math.PI / 2 - (i / 6) * (Math.PI / 2); pts.push(doorPt(k, hw - r + Math.cos(a) * r, h - r + Math.sin(a) * r, out)); }
  pts.push(doorPt(k, hw, 0, out));
  return densify(pts, 0.05);
};
/** 地面上的椭圆（中心 c，半轴 rx / rz），从角度 a0 开始画 turns 圈 */
export const floorEllipse = (c: V3, rx: number, rz: number, a0 = Math.PI / 2, turns = 1, y = 0.012): V3[] =>
  Array.from({length: Math.round(64 * turns) + 1}, (_, i) => { const a = a0 + (i / 64) * Math.PI * 2; return [c[0] + rx * Math.cos(a), y, c[2] + rz * Math.sin(a)] as V3; });
/** 竖直平面里的椭圆（圈住门） */
export const vertEllipse = (c: V3, rx: number, ry: number, a0 = -Math.PI / 2, turns = 1.06): V3[] =>
  Array.from({length: Math.round(96 * turns) + 1}, (_, i) => { const a = a0 - (i / 96) * Math.PI * 2; return [c[0] + rx * Math.cos(a), c[1] + ry * Math.sin(a), c[2] + 0.05 * Math.sin(a * 2)] as V3; });

/* ================= 其他场景原点 ================= */
export const OC: V3 = [36, 0, -24];     // 三层玻璃台（三种情况）
export const OM: V3 = [-14, 0, -36];    // 一百万扇门
/* 三层台：第 k 层 = 车在门 k */
export const TIER_DY = 2.15, TW = 0.7, TH = 1.25, TDX = 1.0, TXS = -0.55;
export const tierY = (k: number) => OC[1] + (3 - k) * TIER_DY;
export const tierDoor = (k: number, j: number, lx = 0, ly = 0, lz = 0): V3 => [OC[0] + TXS + (j - 2) * TDX + lx, tierY(k) + ly, OC[2] + lz];
/* 门阵 */
export const MCOLS = 3, MROWS = 120, MDX = 1.7, MDZ = 2.2, MW = 1.0, MH = 2.0;
export const mDoor = (r: number, c: number): V3 => [OM[0] + c * MDX, 0, OM[2] - r * MDZ];
export const MINE = {r: 0, c: 0}, FAR = {r: 42, c: 1};
/* 结尾的两根光柱 */
export const COLX = [-1.0, 1.0], COLZ = 2.5, COLR = 0.3, COLH = 3.0;

/* ================= 时间常量（帧） ================= */
// hook
export const ENTER0 = 8, DOORS0 = wd(0, 'ba') - 2, DOORS1 = wd(0, 'ô') - 6;
export const CAR_IN = wd(0, 'ô') - 2, GOAT_IN = wd(0, 'hai') - 2, PRIZE_OUT = LE(0) - 8;
export const PICK0 = wd(1, 'chọn') - 6, PICK1 = LE(1) + 6;
export const OPEN3 = wd(2, 'mở') + 2, HOST0 = OPEN3 - 26;
export const ASK0 = wd(3, 'giữ') - 4, ASK_HALF = wd(3, 'đổi') + 6;
// fight
export const STRIKE0 = wd(4, 'đổi') - 6;
export const MCARD0 = L(5) + 10, MCARD1 = MCARD0 + 36;
export const FLOCK0 = L(6) - 2, FLOCK1 = wd(6, 'gần') + 6;
export const LET0 = L(6) + 4, LET1 = wd(6, 'về') + 4, PHD0 = wd(6, 'gần'), PHD1 = wd(6, 'sĩ') + 4, SAI = wd(6, 'sai') - 2;
export const ECARD0 = wd(7, 'Pôn') - 12, ECARD1 = ECARD0 + 30, MON0 = wd(7, 'máy') - 16, MON1 = MON0 + 22, DOTS0 = wd(7, 'xem') - 4;
// why
export const CLOSE3 = L(8) - 10, FILL0 = wd(8, 'chọn') - 4;
export const RING1_0 = wd(9, 'một', 1) - 8, RING2_0 = wd(9, 'Hai') - 6, RING2_1 = wd(9, 'hai', 1) - 2;
export const OPEN3B = wd(10, 'mở', 1) - 2, HOST2_0 = OPEN3B - 26;
export const POUR0 = wd(11, 'dồn') - 8, POUR1 = POUR0 + 44;
// cases
export const T_CAR = [0, wd(13, 'một'), wd(14, 'hai'), wd(15, 'ba')];
export const T_OPEN = [0, wd(13, 'đổi') - 10, wd(14, 'mở'), wd(15, 'mở')];
export const T_ARC0 = [0, L(13) + 2, wd(14, 'mở') + 6, wd(15, 'mở') + 6];
export const T_ARC1 = [0, wd(13, 'thua') - 2, wd(14, 'Đổi') + 10, wd(15, 'Đổi') + 10];
export const T_RES = [0, wd(13, 'thua'), wd(14, 'thắng'), wd(15, 'thắng')];
export const BRACE0 = L(16) + 4, BRACE1 = L(16) + 46;
// million
export const FIELD0 = SC.million - 50, M_TXT = wd(17, 'một');
export const MINE0 = wd(18, 'chọn') - 4, MINE1 = MINE0 + 26;
export const WAVE0 = wd(18, 'mở'), WAVE1 = wd(18, 'tám') + 10;
export const FAR0 = wd(18, 'chừa') - 4, FAR1 = LE(18) + 2, KEEP_Q = wd(19, 'giữ');
// end
export const BASE0 = L(20) - 4, BASE1 = L(20) + 20;
export const COUNT0 = L(20) + 8, COUNT1 = CLIMAX - 6, STAY_LBL = wd(20, 'một');
export const COLS_OUT = L(21) - 6;
export const DOOR2_0 = wd(21, 'Nhưng') - 10, DOOR2_1 = DOOR2_0 + 30, OPEN2 = DOOR2_1 + 2, CAR_OUT0 = OPEN2 + 14, CAR_OUT1 = CAR_OUT0 + 80;
export const FINAL0 = L(22) + 6, FINAL1 = FRAMES - 40, TITLE0 = wd(22, 'họ') - 30, MCARD_E = L(22) + 40;

/* 游戏计数（结尾）：0 → 10.000，先慢后快；到高潮前结束 */
export const gamesAt = (f: number) => Math.round(10000 * Math.pow(clamp((f - COUNT0) / (COUNT1 - COUNT0)), 2.2));

/* ---------------- 相机关键帧 ---------------- */
export type Key = {f: number; pos: V3; tgt: V3; fov: number};
const K = (f: number, pos: V3, tgt: V3, fov = 50): Key => ({f: Math.round(f), pos, tgt, fov});
const oc = (p: V3) => add(OC, p), om = (p: V3) => add(OM, p);
export const KEYS: Key[] = [
  // hook：从地面升起，轻轻绕一点弧，面对三扇门
  K(0, [0.9, 0.22, 16.0], [0, 1.0, 0]),
  K(DOORS0 + 40, [-0.7, 1.25, 13.8], [0, 1.4, 0]),
  K(PICK0, [0, 1.7, 12.7], [0, 1.45, 0]),
  K(OPEN3, [0.45, 1.8, 12.4], [0.1, 1.45, 0]),
  K(LE(3), [0.1, 1.9, 12.6], [0, 1.5, 0]),
  // fight：拉高拉远，门在画面下方变小
  K(SC.fight + 70, [0, 6.0, 22.5], [0, 3.6, 0]),
  K(LE(7) + 6, [0.7, 6.3, 22.0], [0, 3.7, 0]),
  // why：下降到门的高度，慢慢环绕
  K(SC.why + 50, [-1.4, 2.05, 12.8], [0, 1.4, 0]),
  K(L(10), [-0.2, 2.1, 12.6], [0.2, 1.4, 0]),
  K(POUR1 + 4, [1.2, 2.15, 12.5], [0.3, 1.4, 0]),
  // cases：三层玻璃台
  K(L(13) - 10, oc([0.6, 3.0, 13.2]), oc([-0.25, 2.2, 0])),
  K(LE(15), oc([-0.5, 3.1, 12.9]), oc([-0.25, 2.2, 0])),
  K(BRACE1 + 6, oc([-0.7, 3.2, 13.3]), oc([-0.2, 2.2, 0])),
  // million：退到门阵前，再升起看向地平线
  K(SC.million + 20, om([0.4, 3.2, 9.5]), om([0, 1.2, -20])),
  K(MINE0, om([0.6, 8.0, 14.5]), om([0, 0, -9])),
  K(WAVE1, om([0.7, 9.0, 16.0]), om([0, 0, -8])),
  K(LE(19), om([0.8, 9.2, 16.5]), om([0.1, 0, -8])),
  // end：回到三扇门，两根光柱
  K(L(20) + 6, [0, 2.2, 12.8], [0, 1.2, 0]),
  K(CLIMAX, [0.25, 2.2, 12.0], [0, 1.2, 0]),
  K(L(21) + 40, [0, 2.05, 11.4], [0, 1.0, 0]),
  K(CAR_OUT1, [0, 2.05, 11.3], [0, 1.0, 0]),
  K(FINAL0 + 30, [0, 2.1, 10.9], [0, 1.25, 0]),
  K(FRAMES, [0, 3.8, 6.8], [0, 6.5, -10], 52),
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

/* ---------- 屏幕位置 + 深度 → 世界（卡片也活在 3D 里，有视差） ---------- */
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
export const rectPt = (r: Rect3, px: number, py: number): V3 => add(r.c, add(mul(r.ex, px * r.k), mul(r.ey, -py * r.k)));
/** 从左上角开始描的矩形（rrect3 从上边左端开始，正好） */
let _cards: Record<string, Rect3> | null = null;
export const FIGHT_REF = L(6) + 20;
export const CARDS = () => (_cards ??= {
  marilyn: hudRect(FIGHT_REF, 540, 455, 680, 330, 10, 18),
  erdos: hudRect(FIGHT_REF + 120, 360, 870, 250, 332, 10, 14),
  monitor: hudRect(FIGHT_REF + 120, 742, 860, 330, 250, 10, 18),
  monty: hudRect(L(2) + 40, 540, 400, 196, 254, 8, 14),
});
/** "50% · 50%" 的删除线（屏幕 y 560 处，深度 10） */
export const STRIKE_Y = 600;
export const strikePts = () => { const c = baseCam(STRIKE0 + 10); return densify([unproj(c, 300, STRIKE_Y - 18, 10), unproj(c, 780, STRIKE_Y - 22, 10)], 0.05); };

/* ================= 笔画表 ================= */
export type Kind = 'draw' | 'link' | 'trace';
export type S3 = {id: string; at: number; dur: number; kind: Kind; pts: V3[]; ease?: (t: number) => number; progF?: (f: number) => number; r?: number; color?: string; core?: string; bridge?: boolean; keep?: boolean};
export const progOf = (s: S3, f: number): number => (s.progF ? s.progF(f) : (s.ease ?? ss)(prog(f, s.at, s.dur)));

const HW2 = DW / 2;
/** 一笔描三扇门：门 1 框 → 地面 → 门 2 框 → 地面 → 门 3 框 */
export const DOORS_PTS: V3[] = (() => {
  const out: V3[] = [];
  for (let k = 1; k <= 3; k++) {
    const fr = doorFrame(k);
    out.push(...fr.slice(out.length ? 1 : 0));
    if (k < 3) {
      const a = doorPt(k, HW2, 0, 0.02), b = doorPt(k + 1, -HW2, 0, 0.02);
      out.push(...bez(a, add(a, [0.1, 0.01, 0.45]), add(b, [-0.1, 0.01, 0.45]), b, 24).slice(1).map((p) => [p[0], 0.012, p[2]] as V3));
    }
  }
  return out;
})();
/** 每扇门框在 DOORS_PTS 里的进度区间（门板随笔头出现） */
export const DOOR_SPAN: [number, number][] = (() => {
  const c = cum3(DOORS_PTS), tot = c[c.length - 1];
  const n = doorFrame(1).length, gap = 24;
  const i0 = [0, n - 1 + gap, 2 * (n - 1 + gap)];
  return i0.map((i) => [c[i] / tot, c[Math.min(c.length - 1, i + n - 1)] / tot] as [number, number]);
})();
const ENTER_PTS = cr3([[0.6, 0.012, 7.5], [0.2, 0.012, 5.2], [-0.9, 0.012, 2.6], doorPt(1, -HW2, 0, 0.02)], 14);
const PICK_PTS = (() => {
  const c = doorPt(1, 0, 0, 0.45);
  const ring = floorEllipse(c, 0.85, 0.42, Math.PI * 0.5, 1.05);
  const lead = cr3([[0.6, 0.012, 3.9], [-0.1, 0.012, 3.2], [-1.0, 0.012, 2.3], ring[0]], 14);
  return [...lead, ...ring.slice(1)];
})();
const HOST_PTS = (() => { const a = add(doorPt(1, 0, 0, 0.45), [0, 0, 0.42]); const b = doorPt(3, 0.42, 1.3, 0.06); return bez(a, add(a, [0.8, 2.6, 0.6]), add(b, [-0.6, 2.4, 0.9]), b, 120); })();
export const ASK_PTS = (() => { const a = doorPt(1, 0.1, DH + 0.3, 0.1), b = doorPt(2, -0.1, DH + 0.3, 0.1); return bez(a, add(a, [0.3, 1.25, 0.2]), add(b, [-0.3, 1.25, 0.2]), b, 100); })();
// why
export const RING1_C: V3 = add(doorPt(1, 0, DH * 0.5, 0.3), [0, 0, 0]);
export const RING2_C: V3 = [(DOORX[2] + DOORX[3]) / 2, DH * 0.5, 0.45];
const RING1_PTS = vertEllipse(RING1_C, 0.86, 1.78);
const RING2_PTS = vertEllipse(RING2_C, 1.86, 1.95);
const HOST2_PTS = (() => { const a = RING2_PTS[RING2_PTS.length - 1]; const b = doorPt(3, 0.42, 1.3, 0.06); return bez(a, add(a, [0.8, 0.6, 0.6]), add(b, [0.4, -0.6, 0.6]), b, 60); })();
/** 液体光：门 3 → 门 2（从门 3 的液面上方流出，弧形落进门 2） */
export const POUR_PTS = (() => { const a = doorPt(3, 0.0, DH * 0.36, 0.25), b = doorPt(2, 0.15, DH * 0.42, 0.22); return bez(a, add(a, [-0.25, 1.5, 0.5]), add(b, [0.45, 1.6, 0.5]), b, 120); })();
// cases：每层一笔 —— 圈住门 1 的门脚 → 上到门 1 顶 → 弧线"换"到另一扇 → 落到它的门脚
export const tierPts = (k: number, to: number): V3[] => {
  const c = tierDoor(k, 1, 0, 0.012, 0.32);
  const ring = floorEllipse(c, 0.46, 0.22, Math.PI * 0.5, 1.0, tierY(k) + 0.012);
  const up = densify([ring[ring.length - 1], tierDoor(k, 1, 0, TH + 0.18, 0.12)], 0.05);
  const a = tierDoor(k, 1, 0, TH + 0.18, 0.12), b = tierDoor(k, to, 0, TH + 0.18, 0.12);
  const arc = bez(a, add(a, [0.15, 0.55 + 0.15 * Math.abs(to - 1), 0.2]), add(b, [-0.15, 0.55 + 0.15 * Math.abs(to - 1), 0.2]), b, 70);
  const down = densify([b, tierDoor(k, to, 0, 0.05, 0.3)], 0.05);
  return [...ring, ...up.slice(1), ...arc.slice(1), ...down.slice(1)];
};
export const TIER_TO = [0, 2, 2, 3];
const BRACE_PTS = (() => { const x = OC[0] + TXS + 1.75; const y3 = tierY(3) + 0.6, y2 = tierY(2) + 0.6; const z = OC[2] + 0.3; return cr3([[x - 0.1, y3 - 0.4, z], [x + 0.25, y3, z], [x + 0.32, (y2 + y3) / 2, z], [x + 0.25, y2, z], [x - 0.1, y2 + 0.4, z]], 16); })();
// million
const MINE_PTS = (() => { const b = mDoor(MINE.r, MINE.c); const hw = MW / 2; return densify([add(b, [-hw, 0.01, 0.05]), add(b, [-hw, MH, 0.05]), add(b, [hw, MH, 0.05]), add(b, [hw, 0.01, 0.05])], 0.05); })();
export const FAR_PTS = (() => { const a = add(mDoor(MINE.r, MINE.c), [MW / 2, 0.012, 0.3]); const b = add(mDoor(FAR.r, FAR.c), [0, 0.012, 0.6]); const m = lerp3(a, b, 0.5); return densify(cr3([a, [a[0] + 0.5, 0.012, a[2] - 4], [m[0], 0.012, m[2]], [b[0] - 0.2, 0.012, b[2] + 5], b], 20), 0.25); })();
// end
const BASE_PTS = densify([[COLX[0] - 0.7, 0.012, COLZ + 0.45], [COLX[1] + 0.7, 0.012, COLZ + 0.45]], 0.05);
export const RISE_PTS = densify([[COLX[1], 0.02, COLZ + COLR + 0.06], [COLX[1], COLH, COLZ + COLR + 0.06]], 0.03);
export const DOOR2_PTS = doorFrame(2, DW, DH, 0.05);

const D: S3[] = [
  {id: 'enter', kind: 'draw', at: ENTER0, dur: DOORS0 - ENTER0, ease: (t) => t, pts: ENTER_PTS, r: 0.016},
  {id: 'doors', kind: 'draw', at: DOORS0, dur: DOORS1 - DOORS0, ease: glide, pts: DOORS_PTS, r: 0.018, keep: true},
  {id: 'pick', kind: 'draw', at: PICK0, dur: PICK1 - PICK0, ease: glide, pts: PICK_PTS, r: 0.016},
  {id: 'host', kind: 'draw', at: HOST0, dur: OPEN3 - HOST0, ease: ss, pts: HOST_PTS, r: 0.012},
  {id: 'ask', kind: 'draw', at: ASK0, dur: ASK_HALF - ASK0, progF: (f) => 0.55 * ss(prog(f, ASK0, ASK_HALF - ASK0)), pts: ASK_PTS, r: 0.016},
  {id: 'strike', kind: 'draw', at: STRIKE0, dur: 14, ease: eo, pts: [], r: 0.012},
  {id: 'mcard', kind: 'draw', at: MCARD0, dur: MCARD1 - MCARD0, ease: ss, pts: [], r: 0.011},
  {id: 'flock', kind: 'draw', at: FLOCK0, dur: FLOCK1 - FLOCK0, ease: glide, pts: [], r: 0.012},
  {id: 'ecard', kind: 'draw', at: ECARD0, dur: ECARD1 - ECARD0, ease: ss, pts: [], r: 0.011},
  {id: 'mon', kind: 'draw', at: MON0, dur: MON1 - MON0, ease: ss, pts: [], r: 0.011},
  {id: 'ring1', kind: 'draw', at: RING1_0, dur: 26, ease: ss, pts: RING1_PTS, r: 0.016},
  {id: 'ring2', kind: 'draw', at: RING2_0, dur: RING2_1 - RING2_0, ease: ss, pts: RING2_PTS, r: 0.016},
  {id: 'host2', kind: 'draw', at: HOST2_0, dur: OPEN3B - HOST2_0, ease: ss, pts: HOST2_PTS, r: 0.012},
  {id: 'pour', kind: 'draw', at: POUR0, dur: POUR1 - POUR0, ease: glide, pts: POUR_PTS, r: 0.014},
  ...[1, 2, 3].map((k): S3 => ({id: 'tier' + k, kind: 'draw', at: T_ARC0[k], dur: T_ARC1[k] - T_ARC0[k], ease: glide, pts: tierPts(k, TIER_TO[k]), r: 0.014})),
  {id: 'brace', kind: 'draw', at: BRACE0, dur: BRACE1 - BRACE0, ease: ss, pts: BRACE_PTS, r: 0.016},
  {id: 'mine', kind: 'draw', at: MINE0, dur: MINE1 - MINE0, ease: ss, pts: MINE_PTS, r: 0.02},
  {id: 'far', kind: 'draw', at: FAR0, dur: FAR1 - FAR0, ease: glide, pts: FAR_PTS, r: 0.03},
  {id: 'base', kind: 'draw', at: BASE0, dur: BASE1 - BASE0, ease: ss, pts: BASE_PTS, r: 0.016},
  {id: 'rise', kind: 'draw', at: BASE1 + 2, dur: COUNT1 + 6 - BASE1 - 2, progF: (f) => (f < BASE1 + 2 ? 0 : riseFrac(f) * ss(prog(f, BASE1 + 2, 14))), pts: RISE_PTS, r: 0.012},
  {id: 'door2', kind: 'draw', at: DOOR2_0, dur: DOOR2_1 - DOOR2_0, ease: ss, pts: DOOR2_PTS, r: 0.018},
  {id: 'final', kind: 'draw', at: FINAL0, dur: FINAL1 - FINAL0, ease: ss, pts: [], r: 0.02},
];
/** 两根光柱的液面（0..1 = 柱高）= 到此刻为止的胜率（模拟数据），用 k = 30 局的 50/50 先验平滑：
 *  一开始两根一样高（"直觉：五五开"），随着局数增加分开到 ≈ 1/3 和 ≈ 2/3。笔头骑在 ĐỔI 的液面上。 */
export const rates = (f: number) => {
  const g = gamesAt(f), st = CUM_STAY[g], k = 30;
  const ramp = ss(prog(f, COUNT0 - 6, 36));
  const stay = (st + 0.5 * k) / (g + k), sw = (g - st + 0.5 * k) / (g + k);
  return {g, stayWins: st, switchWins: g - st, stay: stay * ramp, sw: sw * ramp};
};
const riseFrac = (f: number) => rates(f).sw;

const fillLate = () => {
  const byId = (id: string) => D.find((s) => s.id === id)!;
  byId('strike').pts = strikePts();
  byId('mcard').pts = CARDS().marilyn.pts;
  byId('ecard').pts = CARDS().erdos.pts;
  byId('mon').pts = CARDS().monitor.pts;
  // 信封群：从门的上方螺旋上升，穿过两张卡片之间
  {
    const c = baseCam(FIGHT_REF);
    const p0 = unproj(c, 300, 1150, 14), p1 = unproj(c, 820, 700, 12);
    const pts: V3[] = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160, a = t * Math.PI * 3.2;
      const base = lerp3(p0, p1, t);
      pts.push([base[0] + Math.cos(a) * 1.4 * (1 - 0.4 * t), base[1] + 2.5 * t, base[2] + Math.sin(a) * 1.4 * (1 - 0.4 * t)]);
    }
    byId('flock').pts = pts;
  }
  // 结尾：从门 2 门口出发，穿过门，升入星空
  byId('final').pts = cr3([doorPt(2, -0.2, 0.012, 1.4), doorPt(2, 0.2, 0.012, 0.8), doorPt(2, 0, 0.1, -0.4), [0, 0.6, -2.4], [0.2, 1.6, -4.6], [0.6, 4.0, -9], [1.4, 8.5, -16], [2.2, 14, -24]], 16);
};

/* ---------- 场间长金线（相机沿它飞）与场内细连线：自动补在相邻两笔之间 ---------- */
export const FLIGHTS: {from: string; to: string; a: number; lift: V3; wmax?: number}[] = [
  {from: 'pour', to: 'tier1', a: LE(11) + 6, lift: [0, 7, 4], wmax: 0.45},
  {from: 'brace', to: 'mine', a: LE(16) + 8, lift: [0, 8, 6], wmax: 0.4},
  {from: 'far', to: 'base', a: LE(19) - 6, lift: [0, 14, 10], wmax: 0.2},
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
      const c1 = add(add(pa, mul(ta, Math.min(span * 0.2, 6))), fl.lift), c2 = add(sub(pb, mul(tb, Math.min(span * 0.3, 6))), mul(fl.lift, 0.35));
      out.push({id: 'bridge-' + nx.id, kind: 'link', bridge: true, at: Math.max(fl.a, e), dur: nx.at - Math.max(fl.a, e), ease: eio, pts: bez(pa, c1, c2, pb, 260), r: 0.02});
      continue;
    }
    const gap = nx.at - e;
    const dist = len3(sub(pb, pa));
    if (dist < 0.03) continue;
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
  return {p: headOf(last.pts, progOf(last, Math.max(e, f))), o: lerp(1, 0.88, prog(f, e, 20)) * (1 - prog(f, FRAMES - 34, 30)), moving: false};
};

/* ================= 相机（关键帧 + 飞行跟拍 + 轻微呼吸） ================= */
export const calmAt = (f: number) => {
  const dense: [number, number][] = [[L(6) - 20, LE(7)], [L(13) - 20, LE(16)], [COUNT0, CLIMAX + 80]];
  let k = 1;
  for (const [a, b] of dense) k = Math.min(k, 1 - 0.6 * Math.min(ss((f - a + 20) / 20), 1 - ss((f - b) / 20)));
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
      pos = add(pos, add(sub(p, mul(dir, 5.5 / l)), [0, 1.4, 0]));
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
    return {pos: add(k.pos, sw), tgt: add(k.tgt, sv), fov: k.fov, roll: 0.008 * c * Math.sin(f * 0.006)};
  };
};
export const camAt = (f: number): CamS => {
  if (!CAMF) { CAMF = keyCam; buildStrokes(); buildCam(); }
  return CAMF!(f);
};
/** 雾：门阵场景雾更薄（要看到地平线） */
export const fogAt = (f: number) => {
  const mil = Math.min(ss((f - (SC.million - 40)) / 40), 1 - ss((f - (LE(19) + 10)) / 40));
  return {fog: lerp(0.03, 0.011, mil), near: lerp(12, 16, mil)};
};
export const fogK = (f: number, d: number) => { const g = fogAt(f); const x = Math.max(0, d - g.near) * g.fog; return Math.exp(-x * x); };
camAt(0);
