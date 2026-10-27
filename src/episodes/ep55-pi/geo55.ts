// ep55 纯几何小工具（无 React），与 ep53 kit 同名函数行为一致。
export type P = [number, number];
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const prog = (f: number, a: number, d: number) => clamp((f - a) / d);
export const eo = (t: number) => 1 - Math.pow(1 - t, 3);
export const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const lin = (t: number) => t;
export const ss = (t: number) => { const u = clamp(t); return u * u * u * (u * (6 * u - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpP = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const smooth = (pts: P[], seg = 14): P[] => {
  if (pts.length < 3) return pts;
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < seg; k++) {
      const t = k / seg, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
export const circlePts = (cx: number, cy: number, r: number, a0 = -Math.PI / 2, n = 120, dir = 1, turns = 1): P[] =>
  Array.from({length: n + 1}, (_, i) => { const a = a0 + dir * (i / n) * Math.PI * 2 * turns; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P; });
export const ellipsePts = (cx: number, cy: number, a: number, b: number, rot: number, t0 = 0, n = 160): P[] =>
  Array.from({length: n + 1}, (_, i) => {
    const t = t0 + (i / n) * Math.PI * 2, x = Math.cos(t) * a, y = Math.sin(t) * b, c = Math.cos(rot), s = Math.sin(rot);
    return [cx + x * c - y * s, cy + x * s + y * c] as P;
  });
export const polyPts = (cx: number, cy: number, r: number, n: number, a0 = -Math.PI / 2): P[] =>
  Array.from({length: n + 1}, (_, k) => { const a = a0 + (2 * Math.PI * k) / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P; });
/** 圆角矩形（从左上圆角之后的上边起点开始，顺时针，闭合） */
export const roundRectPts = (x: number, y: number, w: number, h: number, r: number): P[] => {
  const out: P[] = [];
  const arc = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 10; i++) { const a = a0 + (i / 10) * (Math.PI / 2); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  out.push([x + r, y]);
  out.push([x + w - r, y]); arc(x + w - r, y + r, -Math.PI / 2);
  out.push([x + w, y + h - r]); arc(x + w - r, y + h - r, 0);
  out.push([x + r, y + h]); arc(x + r, y + h - r, Math.PI / 2);
  out.push([x, y + r]); arc(x + r, y + r, Math.PI);
  out.push([x + r, y]);
  return out;
};
export const cumLen = (pts: P[]) => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; };
export const atLen = (pts: P[], L: number[], d: number): P => {
  if (d <= 0) return pts[0];
  let lo = 1, hi = L.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (L[m] < d) lo = m + 1; else hi = m; }
  const i = Math.min(lo, L.length - 1);
  const s = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * clamp(s), pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * clamp(s)];
};
/** 画到 t（按长度 0..1）为止的子路径 + 笔头；from 让尾巴也收走 */
export const partial = (pts: P[], t: number, from = 0) => {
  const L = cumLen(pts);
  const total = L[L.length - 1] || 1;
  const a = clamp(from) * total, b = clamp(t) * total;
  const head = atLen(pts, L, b);
  if (b <= a) return {d: '', head, total};
  const seg: P[] = [atLen(pts, L, a)];
  for (let i = 0; i < pts.length; i++) if (L[i] > a && L[i] < b) seg.push(pts[i]);
  seg.push(head);
  return {d: 'M' + seg.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L'), head, total};
};
export const ptsD = (pts: P[], close = false) => 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + (close ? 'Z' : '');
