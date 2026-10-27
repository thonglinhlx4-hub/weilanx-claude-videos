// ep55 相机：只有缓动推近（punch-in），没有漂移、没有旋转。纯函数。
// 每个 punch：在 [at, at+att] 用 smootherstep 推入，hold 后 dec 帧推出；k=1 时世界点 F 落在屏幕点 S、缩放 z。
// 屏幕文字层用 makePJ 求锚点：前后 7 帧相机投影取平均再取整像素，字形固定缩放、不旋转。
export type P = [number, number];
export type Cam = {z: number; fx: number; fy: number; sx: number; sy: number};
const W = 1920, H = 1080;
export const CAM0: Cam = {z: 1, fx: W / 2, fy: H / 2, sx: W / 2, sy: H / 2};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ss = (t: number) => { const u = clamp(t); return u * u * u * (u * (6 * u - 15) + 10); };
export type Punch = {at: number; att: number; hold: number; dec: number; z: number; F: P; S: P};
let PUNCHES: Punch[] = [];
export const setPunches = (p: Punch[]) => { PUNCHES = p; };
export const punchK = (p: Punch, f: number) => ss((f - p.at) / p.att) * (1 - ss((f - p.at - p.att - p.hold) / p.dec));
export const cam55 = (f: number): Cam => {
  let best: Punch | null = null, bk = 0;
  for (const p of PUNCHES) { const k = punchK(p, f); if (k > bk) { bk = k; best = p; } }
  if (!best || bk <= 0) return CAM0;
  const k = bk;
  return {
    z: 1 + (best.z - 1) * k,
    fx: W / 2 + (best.F[0] - W / 2) * k, fy: H / 2 + (best.F[1] - H / 2) * k,
    sx: W / 2 + (best.S[0] - W / 2) * k, sy: H / 2 + (best.S[1] - H / 2) * k,
  };
};
export const camApply = (c: Cam, p: P): P => [c.sx + (p[0] - c.fx) * c.z, c.sy + (p[1] - c.fy) * c.z];
export const camG = (c: Cam) => `translate(${c.sx.toFixed(2)} ${c.sy.toFixed(2)}) scale(${c.z.toFixed(5)}) translate(${(-c.fx).toFixed(2)} ${(-c.fy).toFixed(2)})`;
export type PJ = (p: P) => P;
export const makePJ = (f: number): PJ => {
  const cams: Cam[] = [];
  for (let i = -3; i <= 3; i++) cams.push(cam55(f + i));
  return (p: P): P => {
    let x = 0, y = 0;
    for (const c of cams) { const q = camApply(c, p); x += q[0]; y += q[1]; }
    return [Math.round(x / cams.length), Math.round(y / cams.length)];
  };
};
