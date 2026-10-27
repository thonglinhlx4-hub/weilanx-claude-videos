// ep54 v4：一次/分段函数段的相机 cam54，纯函数（无 React / remotion 依赖，可在 node 里数值检查）。
// v4 去抖：整条相机是处处连续、导数平滑的函数——
//  · 关键帧用三次 Hermite（Catmull-Rom 切线，首尾切线为 0）插值，不再每段 ease 到停；
//  · 跟点权重用 smootherstep 在 ≥30 帧内淡入淡出（不再因 headWorld 返回 null 而跳变），
//    跟随目标是过去 N 帧笔头位置的 Hann 加权平均（确定性低通，分段处 30 的下落也被抹平）；
//  · 节拍推近：16–20 帧 smootherstep 起势，幅度 ≤ 3%（跳点那下 10%）；
//  · 漂移 / 晃动幅度减半；总包络 env 在 SC.linear 处与 MORPH1−10 处为 0 且导数为 0（与钩子、变形无缝）。
import {L, SC} from './timing';

export type P = [number, number];
export type Cam = {z: number; fx: number; fy: number; rx: number; ry: number};
const W = 1920, H = 1080;
export const CAM0: Cam = {z: 1, fx: W / 2, fy: H / 2, rx: 0, ry: 0};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (f: number, a: number, d: number) => clamp((f - a) / d);
const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** smootherstep：一阶、二阶导在两端都为 0 */
export const ss = (t: number) => {
  const u = clamp(t);
  return u * u * u * (u * (6 * u - 15) + 10);
};

/* ---------- 图表坐标 ---------- */
export type Cfg = {ox: number; oy: number; w: number; h: number; xMax: number; yMax: number; xTicks: number[]; yTicks: number[]; xName: string; yName: string};
export const px = (c: Cfg, x: number, y: number): P => [c.ox + (x / c.xMax) * c.w, c.oy - (y / c.yMax) * c.h];
export const CL: Cfg = {ox: 360, oy: 850, w: 1180, h: 560, xMax: 5, yMax: 80, xTicks: [1, 2, 3, 4, 5], yTicks: [15, 30, 45, 60, 75], xName: 'x (kg)', yName: 'y (nghìn đồng)'};
export const CP: Cfg = {ox: 306, oy: 850, w: 1080, h: 660, xMax: 400, yMax: 400, xTicks: [100, 200, 300, 400], yTicks: [100, 200, 300, 400], xName: 'x (nghìn)', yName: 'y · phải trả (nghìn)'};

/* ---------- 光点走法 ---------- */
export const linX = (f: number) =>
  f < L(4) ? 0 : f < L(5) ? eio(prog(f, L(4) + 4, 30)) : f < L(5) + 60 ? 1 + eio(prog(f, L(5), 30)) : f < L(6) ? 2 + eio(prog(f, L(5) + 62, 30)) : 3 + 2 * eio(prog(f, L(6), 60));
export const pieceX = (f: number) =>
  f < L(9) ? 120 * eio(prog(f, SC.piece + 30, 60)) : f < L(10) ? 120 + 70 * eio(prog(f, L(9), 40)) : f < L(11) ? 190 + 10 * eio(prog(f, L(10) + 6, 14)) : 200 + 200 * eio(prog(f, L(11) + 10, 70));
export const pay = (x: number) => (x < 200 ? x : x - 30);

export const JUMP = L(10) + 20; // x 到 200 的那一帧
export const MORPH0 = SC.wave - 34, MORPH1 = SC.wave; // 直线 → 波浪
export const STAMP = L(11) + 56;
export const BRACE = L(11) + 6;
const CAM_END = MORPH1 - 10; // 此帧起相机回到恒等
const STILL0 = 240; // v5：相机静止段起点（f270 = 9 s 时已完全静止）

/** 读数量化：数码管 / 坐标值每 2 帧才变一次 */
export const fq2 = (f: number) => 2 * Math.floor(f / 2);
/** 光点"运动中"的平滑程度 0..1（代替 moving ? 1 : 0 的硬切） */
export const hotness = (xf: (f: number) => number, f: number, thr: number) => ss(Math.abs(xf(f + 3) - xf(f - 3)) / thr);

/* ---------- 相机关键帧（旋转幅度较 v3 减半） ---------- */
type K = [number, number, number, number, number, number]; // f, z, fx, fy, rx, ry
const RS = 0.5;
const KEYS: K[] = ([
  [SC.linear, 1, 960, 540, 0, 0],
  [300, 1.07, 950, 565, 7, -4],
  [455, 1.12, 920, 600, 8, -2],
  [560, 1.09, 1010, 510, 6, 2],
  [665, 1.07, 990, 520, 5, 3],
  [720, 1.05, 960, 520, 7, -3],
  [860, 1.1, 960, 540, 8, -2],
  [990, 1.08, 1010, 500, 6, 2],
  [1070, 1.06, 1020, 540, 5, 3],
  [MORPH0 + 2, 1.03, 990, 545, 2, 1],
  [CAM_END, 1, 960, 540, 0, 0],
] as K[]).map((k) => [k[0], k[1], k[2], k[3], k[4] * RS, k[5] * RS] as K);
/** 三次 Hermite：Catmull-Rom（非均匀）切线，首尾切线 0 → C1 连续，不在关键帧处停顿 */
const tangents: number[][] = KEYS.map((k, i) => {
  if (i === 0 || i === KEYS.length - 1) return [0, 0, 0, 0, 0];
  const a = KEYS[i - 1], b = KEYS[i + 1];
  return [1, 2, 3, 4, 5].map((j) => (b[j] - a[j]) / (b[0] - a[0]));
});
export const keyAt = (f: number): number[] => {
  if (f <= KEYS[0][0]) return KEYS[0].slice(1);
  for (let i = 1; i < KEYS.length; i++) {
    if (f < KEYS[i][0]) {
      const a = KEYS[i - 1], b = KEYS[i];
      const h = b[0] - a[0], t = (f - a[0]) / h;
      const t2 = t * t, t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
      return [1, 2, 3, 4, 5].map((j) => h00 * a[j] + h10 * h * tangents[i - 1][j - 1] + h01 * b[j] + h11 * h * tangents[i][j - 1]);
    }
  }
  return KEYS[KEYS.length - 1].slice(1);
};

/* ---------- 跟点：权重平滑进出 + 笔头位置低通 ---------- */
const headAny = (f: number): P => {
  if (f < SC.piece) {
    const x = linX(f);
    return px(CL, x, 15 * x);
  }
  const x = pieceX(Math.min(f, MORPH0));
  return px(CP, x, x < 200 ? x : pay(x));
};
const HN = 36;
const HW = Array.from({length: HN}, (_, i) => 1 - Math.cos((2 * Math.PI * (i + 1)) / (HN + 1)));
const HWS = HW.reduce((s, v) => s + v, 0);
/** 过去 HN 帧的 Hann 加权平均（确定性，任何帧都可单独求值） */
export const headSmooth = (f: number): P => {
  let x = 0, y = 0;
  for (let i = 0; i < HN; i++) {
    const p = headAny(f - i);
    x += p[0] * HW[i];
    y += p[1] * HW[i];
  }
  return [x / HWS, y / HWS];
};
const followW = (f: number) =>
  0.2 * ss(prog(f, L(4), 36)) * (1 - ss(prog(f, SC.piece - 46, 36))) +
  0.15 * ss(prog(f, SC.piece + 30, 36)) * (1 - ss(prog(f, MORPH0 - 50, 36)));

/* ---------- 节拍推近 ---------- */
const PUNCH: [number, number, number, number, number][] = [ // at, dz, attack, hold, decay
  [L(5) + 24, 0.025, 16, 6, 36], [L(5) + 86, 0.025, 16, 6, 36], [L(6) + 34, 0.03, 16, 10, 40], [L(7) - 6, 0.03, 16, 10, 40],
  [JUMP - 12, 0.1, 20, 30, 52], [STAMP - 6, 0.03, 16, 8, 36], [L(12) - 2, 0.025, 16, 10, 36],
];
const BREAK = px(CP, 200, 235);

/** 总包络：两端为 0，一、二阶导也为 0 */
const envAt = (f: number) => ss(prog(f, SC.linear, 44)) * (1 - ss(prog(f, CAM_END - 40, 40)));

export const cam54 = (f: number): Cam => {
  if (f <= SC.linear || f >= CAM_END) return CAM0;
  const env = envAt(f);
  const [z0, fx0, fy0, rx0, ry0] = keyAt(f);
  let z = z0, fx = fx0, fy = fy0;
  const w = followW(f);
  if (w > 0) {
    const h = headSmooth(f);
    fx += (h[0] - fx0) * w;
    fy += (h[1] - fy0) * w;
  }
  for (const [at, dz, att, hold, dec] of PUNCH) {
    const k = ss(prog(f, at, att)) * (1 - ss(prog(f, at + att + hold, dec)));
    if (k <= 0) continue;
    z += dz * k;
    if (at === JUMP - 12) { fx += (BREAK[0] - fx) * 0.45 * k; fy += (BREAK[1] - fy) * 0.45 * k; }
  }
  // 漂移（v3 的一半）
  fx += 8 * Math.sin(f / 83) + 3.5 * Math.sin(f / 37);
  fy += 5 * Math.sin(f / 101 + 1);
  const rx = rx0 + 0.7 * Math.sin(f / 71);
  const ry = ry0 + 0.9 * Math.sin(f / 97 + 0.5);
  // v5：9 s（f270）起相机静止——关键帧慢推/平移、跟点、漂移、旋转全部淡出，只保留缓动节拍推近（含跳点那下对断口的拉近）。
  // 240→270 用 smootherstep 过渡；一直保持到 CAM_END（35 s 后若再"醒来"只会在变形前多一次无谓的漂移再归零）。
  const st = ss(prog(f, STILL0, 30));
  let zs = 1, sx = CAM0.fx, sy = CAM0.fy;
  for (const [at, dz, att, hold, dec] of PUNCH) {
    const k = ss(prog(f, at, att)) * (1 - ss(prog(f, at + att + hold, dec)));
    if (k <= 0) continue;
    zs += dz * k;
    if (at === JUMP - 12) { sx += (BREAK[0] - sx) * 0.45 * k; sy += (BREAK[1] - sy) * 0.45 * k; }
  }
  const mix = (a: number, b: number) => a + (b - a) * st;
  return {
    z: 1 + (mix(z, zs) - 1) * env,
    fx: CAM0.fx + (mix(fx, sx) - CAM0.fx) * env,
    fy: CAM0.fy + (mix(fy, sy) - CAM0.fy) * env,
    rx: mix(rx, 0) * env,
    ry: mix(ry, 0) * env,
  };
};

/* ---------- v5：文字放到屏幕空间 ---------- */
// camCss = perspective(2300px) rotateX(rx) rotateY(ry)，transform-origin 50% 55%；camG = SVG 缩放平移。
const TOY = 0.55 * H, PERSP = 2300;
/** 世界点 → 屏幕（完整：SVG 缩放平移 + CSS 透视旋转） */
export const camProj = (c: Cam, p: P): P => {
  const qx = (p[0] - c.fx) * c.z, qy = H / 2 + (p[1] - c.fy) * c.z - TOY;
  const ax = (c.rx * Math.PI) / 180, ay = (c.ry * Math.PI) / 180;
  const x1 = qx * Math.cos(ay), z1 = -qx * Math.sin(ay);
  const y2 = qy * Math.cos(ax) - z1 * Math.sin(ax), z2 = qy * Math.sin(ax) + z1 * Math.cos(ax);
  const w = 1 - z2 / PERSP;
  return [W / 2 + x1 / w, TOY + y2 / w];
};
/** 第 f 帧的文字锚点投影器：对 f−4..f+3 共 8 帧相机的投影取平均（锚点用当前帧），再取整像素 */
export const makePJ = (f: number) => {
  const cams: Cam[] = [];
  for (let i = -4; i <= 3; i++) cams.push(cam54(f + i));
  return (p: P): P => {
    let x = 0, y = 0;
    for (const c of cams) {
      const q = camProj(c, p);
      x += q[0];
      y += q[1];
    }
    return [Math.round(x / cams.length), Math.round(y / cams.length)];
  };
};
