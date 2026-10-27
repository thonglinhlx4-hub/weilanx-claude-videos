// ep55 一笔光：全片所有"光笔描出来的线"都登记在这里（纯模块）。
// 规则：笔画按时间排好、互不重叠；全片只有一个笔头（penAt），它要么正在描某一笔，要么在两笔之间平滑滑行（≤ 60 帧，稍微变暗），
// 要么在原地淡出 / 淡入——不会跳、不会同时出现两个笔头。场景组件用同一份定义画线，所以线的进度和笔头位置永远一致。
import {CLIMAX, L, SC, wd} from './timing';
import {P, atLen, circlePts, clamp, cumLen, eio, ellipsePts, eo, lerpP, lin, partial, polyPts, prog, roundRectPts, smooth, ss} from './geo55';
import {Punch, setPunches} from './cam55';

export type Stroke = {
  id: string; at: number; dur: number;
  pts: P[] | ((f: number) => P[]);
  ease?: (t: number) => number; progF?: (f: number) => number;
  tail?: number; w?: number; color?: string; core?: string;
};
export const ptsOf = (s: Stroke, f: number): P[] => (typeof s.pts === 'function' ? s.pts(f) : s.pts);
export const progOf = (s: Stroke, f: number): number => (s.progF ? s.progF(f) : (s.ease ?? eo)(prog(f, s.at, s.dur)));

/* ---------- 转场丝带（也是笔画：笔头沿丝带飞进来，落在下一场第一笔的起点） ---------- */
const ribbon = (scene: number, land: P, id: string): Stroke => ({
  id, at: scene - 14, dur: 22, ease: eio, tail: 0.5, w: 2.4,
  pts: smooth([[2040, 300], [1300, 150], [760, 640], [(land[0] + 760) / 2, land[1] - 140], land], 20),
});

/* ---------- S1 钩子：一圈滚出 3,14 个直径 ---------- */
export const FLOOR = 720, WR = 130, WX0 = 430, CIRC = 2 * Math.PI * WR;
export const WHEEL_AT = wd(0, 'bánh') - 2, WHEEL_DUR = 44;
export const ROLL0 = L(1) + 8, ROLL_DUR = 100;
export const rollE = (f: number) => eio(prog(f, ROLL0, ROLL_DUR));
export const wheelX = (f: number) => WX0 + CIRC * rollE(f);
export const wheelRot = (f: number) => (CIRC * rollE(f)) / WR;
export const BR = [wd(2, 'Một'), wd(2, 'hai'), wd(2, 'ba')];
export const REM_AT = wd(2, 'dư');
export const REVEAL = wd(3, 'ba');
export const HOOK_OUT = SC.define - 16;

/* ---------- S2 定义 ---------- */
export const DC: P = [700, 470], DR = 230;
export const D_CIRC = SC.define + 10, D_DIAM = D_CIRC + 48;
export const PI_AT = wd(4, 'Pi'), FORM_AT = L(5);
export const OBJ_IN = L(6) - 14;
export const OBJ = [
  {c: [400, 470] as P, r: 95, at: wd(6, 'nắp') - 2, dur: 20, name: 'nắp nồi'},
  {c: [860, 470] as P, r: 150, at: wd(6, 'bánh') - 2, dur: 22, name: 'bánh xe đạp'},
  {c: [1440, 470] as P, r: 230, at: wd(6, 'Trái') - 4, dur: 26, name: 'Trái Đất'},
];
export const RATIO_AT = [0, 1, 2].map((i) => wd(7, 'tỉ') + i * 12);
export const Q_AT = L(8);
export const DEF_OUT = SC.arch - 16;

/* ---------- S3 阿基米德 ---------- */
export const AC: P = [600, 500], AR = 300;
export const A_CIRC = SC.arch + 10;
export const A_FRAME = A_CIRC + 52;
export const FRAME_R = {x: 1130, y: 170, w: 640, h: 130, r: 24};
export const STEPS: {n: number; at: number; dur: number}[] = [
  {n: 6, at: wd(10, 'bên'), dur: 22},
  {n: 12, at: wd(12, 'Mười') - 4, dur: 20},
  {n: 24, at: wd(12, 'hai', 1) - 4, dur: 20},
  {n: 48, at: wd(12, 'bốn', 1) - 4, dur: 20},
  {n: 96, at: wd(14, 'chín') - 4, dur: 20},
];
export const outerAt = (i: number) => (i === 0 ? wd(10, 'bao') : STEPS[i].at + 21);
export const stepDone = (i: number) => outerAt(i) + STEPS[i].dur;
export const NUM = {x0: 1150, x1: 1770, y: 640, v0: 2.9, v1: 3.6};
export const numX = (v: number) => NUM.x0 + ((v - NUM.v0) / (NUM.v1 - NUM.v0)) * (NUM.x1 - NUM.x0);
export const FINE = {x0: 1150, x1: 1770, y: 795, v0: 3.14, v1: 3.1435};
export const fineX = (v: number) => FINE.x0 + ((v - FINE.v0) / (FINE.v1 - FINE.v0)) * (FINE.x1 - FINE.x0);
export const NUM_AT = L(11) + 4;
export const EQ_AT = L(15) + 2, EQ2_AT = L(16) + 4;
export const ARCH_OUT = SC.irr - 16;
export const lowB = (n: number) => n * Math.sin(Math.PI / n);
export const upB = (n: number) => n * Math.tan(Math.PI / n);

/* ---------- S4 无理数：金线上的数字流 ---------- */
export const PI_DIGITS = '3,14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196';
const threadP = (s: number): P => [140 + 1840 * s, 700 - 150 * s + 60 * Math.sin(2 * Math.PI * 1.5 * s + 0.3) * (1 - 0.3 * s)];
export const THREAD: P[] = Array.from({length: 801}, (_, i) => threadP(i / 800));
const TL = cumLen(THREAD), TTOT = TL[TL.length - 1];
const sizeAt = (d: number) => 52 * (1 - 0.55 * (d / TTOT));
export type Glyph = {ch: string; x: number; y: number; size: number; t: number; d: number};
export const T_LEAD = L(17) + 40;
const SPOKEN = ['Ba', 'phẩy', 'một', 'bốn', 'một', 'năm', 'chín', 'hai', 'sáu', 'năm', 'ba', 'năm'];
export const GLYPHS: Glyph[] = (() => {
  const out: Glyph[] = [];
  let d = TTOT * 0.06, t = 0, gap = 6;
  const seen: Record<string, number> = {};
  for (let k = 0; k < PI_DIGITS.length; k++) {
    const ch = PI_DIGITS[k];
    const size = sizeAt(d);
    const w = ch === ',' ? size * 0.3 : size * 0.6;
    if (d + w > TTOT * 0.975) break;
    if (k < SPOKEN.length) { const word = SPOKEN[k]; const n = seen[word.toLowerCase()] ?? 0; seen[word.toLowerCase()] = n + 1; t = wd(18, word, n); }
    else { gap = Math.max(1.6, gap * 0.93); t += gap; }
    const p = atLen(THREAD, TL, d + w / 2);
    if (p[0] > 1866) break;
    out.push({ch, x: p[0], y: p[1] - 16 * (size / 52) - 6, size, t: Math.round(t), d: d + w / 2});
    d += w + 5 * (size / 52);
  }
  return out;
})();
const G_LAST = GLYPHS[GLYPHS.length - 1];
export const T_END = G_LAST.t + 30;
const threadProg = (f: number): number => {
  const g0 = GLYPHS[0];
  if (f <= T_LEAD) return 0;
  if (f < g0.t) return (eo(prog(f, T_LEAD, g0.t - T_LEAD)) * g0.d) / TTOT;
  for (let k = 1; k < GLYPHS.length; k++) {
    const a = GLYPHS[k - 1], b = GLYPHS[k];
    if (f < b.t) return (a.d + ((b.d - a.d) * (f - a.t)) / Math.max(1, b.t - a.t)) / TTOT;
  }
  return (G_LAST.d + (TTOT - G_LAST.d) * lin(prog(f, G_LAST.t, 30))) / TTOT;
};
export const ROW_AT = L(20) + 2, BOX_AT = wd(20, 'lặp'), PIROW_AT = wd(20, 'Pi');
export const VOTI_AT = wd(21, 'vô');
export const IRR_OUT = SC.life - 16;

/* ---------- S5 生活 ---------- */
export const LWR = 80, LFLOOR = 640, LX0 = 200, LDIST = 2 * 2 * Math.PI * LWR;
export const LW_AT = SC.life + 10;
export const LROLL0 = wd(23, 'vòng'), LROLL_DUR = 100;
export const lrollE = (f: number) => eio(prog(f, LROLL0, LROLL_DUR));
export const LFORM_AT = wd(23, 'Pi');
export const SINE_IN = L(24) - 8, SINE_DRAW = SINE_IN + 6, SINE_GO = SINE_DRAW + 54, PERIOD_AT = wd(24, 'hai');
export const ORB_IN = L(25) - 4;
export const EARTH: P = [960, 540], ER = 150;
export const ORB = {a: 520, b: 170, rot: -0.17};
export const E_AT = ORB_IN + 4, O_AT = Math.max(wd(25, 'vòng'), E_AT + 36), SAT_GO = O_AT + 40, GPSF_AT = wd(25, 'Tính');
export const LIFE_A_OUT = SINE_IN - 2, LIFE_B_OUT = ORB_IN - 6;
// 3D 正弦丝：固定相机
export const SN = 14;
const SF = 1900, SCX = 960, SCY = 600;
const SCAM = {th: 0.38, ph: 0.3, D: 25};
export const sproj = (x: number, y: number, z: number): P => {
  const c = SCAM;
  const x1 = x * Math.cos(c.th) - z * Math.sin(c.th), z1 = x * Math.sin(c.th) + z * Math.cos(c.th);
  const y2 = y * Math.cos(c.ph) + z1 * Math.sin(c.ph), z2 = -y * Math.sin(c.ph) + z1 * Math.cos(c.ph);
  const d = c.D + z2;
  return [SCX + (SF * x1) / d, SCY - (SF * y2) / d];
};
export const SK = 1.2; // 波数：一个周期 = 2π / 1.2
export const sphase = (f: number) => 0.07 * Math.max(0, f - SINE_GO) * ss(prog(f, SINE_GO, 30));
export const sinePts = (u: number, f: number, n = 150): P[] =>
  Array.from({length: n + 1}, (_, i) => {
    const x = -7.5 + (15 * i) / n;
    return sproj(x, 1.5 * Math.sin(SK * x - sphase(f) + 0.55 * u) * (1 - 0.25 * u), -1.8 + 5.2 * u);
  });

/* ---------- S6 结尾 ---------- */
export const Q2_AT = L(26) + 2;
export const NF = {x: 410, y: 240, w: 1100, h: 380, r: 28};
export const NASA_AT = L(27);
export const NASA_DIG0 = wd(27, 'mười');
export const NASA_DIGITS = '3.141592653589793';
export const nasaShown = (f: number) => clamp(Math.floor((f - NASA_DIG0) / 2.5) + 1, 0, 16); // 16 位数字（含 3）
export const NASA_LABEL = NASA_DIG0 + 44;
export const NASA_OUT = L(28) - 6;
export const VC: P = [960, 2700], VR = 2300;
export const VOY_AT = L(28) + 4, VOY_LABEL = wd(28, 'Voi-ơ-giơ'), ERR_AT = wd(28, 'sai');
export const VOY_P: P = [VC[0] + VR * Math.sin(0.25), VC[1] - VR * Math.cos(0.25)];
export const BREATH0 = L(28) + 160;
export const WHY_AT = L(30) + 2;
export const CHIP_CX = [560, 960, 1360];
const chipStarts = (() => {
  const a = wd(31, 'siêu') - 4, b = Math.max(wd(31, 'thuật') - 4, a + 14 + 12), c = Math.max(wd(31, 'phần') - 4, b + 14 + 12);
  return [a, b, c];
})();
export const CHIP_AT = chipStarts;
export const CHIP_NAMES = ['siêu máy tính', 'thuật toán', 'phần cứng'];
export const CURIOUS_AT = wd(32, 'tò');
export const QMARK_AT = wd(32, 'tiếp') - 2;
export const FINAL_AT = L(33) + 2, FINAL_DUR = 100;
export const FINAL_PATH: P[] = smooth([[240, 800], [640, 800], [1000, 790], [1320, 700], [1580, 520], [1760, 300], [1840, 170]], 16);
export const TITLE_AT = FINAL_AT + 32;
export const END_OUT = FINAL_AT - 12;

/* ---------- 全片笔画表 ---------- */
export const STROKES: Stroke[] = [
  // S1
  {id: 'wheel', at: WHEEL_AT, dur: WHEEL_DUR, ease: eio, w: 2.2, pts: (f) => circlePts(wheelX(f), FLOOR - WR, WR, Math.PI / 2 + wheelRot(f), 120, 1)},
  {id: 'unroll', at: ROLL0, dur: ROLL_DUR, ease: eio, w: 2.4, pts: [[WX0, FLOOR], [WX0 + CIRC, FLOOR]]},
  ribbon(SC.define, [DC[0] - DR, DC[1]], 'rib-define'),
  // S2
  {id: 'dcirc', at: D_CIRC, dur: 46, ease: ss, w: 2.2, pts: circlePts(DC[0], DC[1], DR, Math.PI, 140, 1)},
  {id: 'ddiam', at: D_DIAM, dur: 16, w: 1.8, pts: [[DC[0] - DR, DC[1]], [DC[0] + DR, DC[1]]]},
  ...OBJ.map((o, i) => ({id: 'obj' + i, at: o.at, dur: o.dur, ease: ss, w: 2, pts: circlePts(o.c[0], o.c[1], o.r, -Math.PI / 2, 120, 1)} as Stroke)),
  ribbon(SC.arch, [AC[0], AC[1] - AR], 'rib-arch'),
  // S3
  {id: 'acirc', at: A_CIRC, dur: 40, ease: ss, w: 2.2, pts: circlePts(AC[0], AC[1], AR, -Math.PI / 2, 160, 1)},
  {id: 'aframe', at: A_FRAME, dur: 30, ease: ss, w: 1.8, pts: roundRectPts(FRAME_R.x, FRAME_R.y, FRAME_R.w, FRAME_R.h, FRAME_R.r)},
  {id: 'in6', at: STEPS[0].at, dur: STEPS[0].dur, ease: ss, w: 1.8, color: '#9fb4ff', core: '#eef2ff', pts: polyPts(AC[0], AC[1], AR, 6)},
  {id: 'out6', at: outerAt(0), dur: STEPS[0].dur, ease: ss, w: 1.8, color: '#ff8a5a', core: '#fff0e6', pts: polyPts(AC[0], AC[1], AR / Math.cos(Math.PI / 6), 6)},
  {id: 'numline', at: NUM_AT, dur: 24, ease: ss, w: 1.6, pts: [[NUM.x0 - 20, NUM.y], [NUM.x1 + 20, NUM.y]]},
  ...STEPS.slice(1).flatMap((s, j) => [
    {id: 'in' + s.n, at: s.at, dur: s.dur, ease: ss, w: 1.6, color: '#9fb4ff', core: '#eef2ff', pts: polyPts(AC[0], AC[1], AR, s.n)} as Stroke,
    {id: 'out' + s.n, at: outerAt(j + 1), dur: s.dur, ease: ss, w: 1.6, color: '#ff8a5a', core: '#fff0e6', pts: polyPts(AC[0], AC[1], AR / Math.cos(Math.PI / s.n), s.n)} as Stroke,
  ]),
  {id: 'fine', at: EQ2_AT + 2, dur: 22, ease: ss, w: 1.6, pts: [[FINE.x0 - 20, FINE.y], [FINE.x1 + 20, FINE.y]]},
  ribbon(SC.irr, THREAD[0], 'rib-irr'),
  // S4
  {id: 'thread', at: T_LEAD, dur: T_END - T_LEAD, progF: threadProg, w: 2.0, pts: THREAD},
  ribbon(SC.life, [LX0, LFLOOR], 'rib-life'),
  // S5
  {id: 'lwheel', at: LW_AT, dur: 26, ease: eio, w: 2, pts: (f) => circlePts(LX0 + LDIST * lrollE(f), LFLOOR - LWR, LWR, Math.PI / 2 + (LDIST * lrollE(f)) / LWR, 100, 1)},
  {id: 'lunroll', at: LROLL0, dur: LROLL_DUR, ease: eio, w: 2.2, pts: [[LX0, LFLOOR], [LX0 + LDIST, LFLOOR]]},
  {id: 'sine', at: SINE_DRAW, dur: 46, ease: ss, w: 2.0, pts: (f) => sinePts(0, f)},
  {id: 'earth', at: E_AT, dur: 30, ease: ss, w: 1.8, color: '#8fb0ff', core: '#eef4ff', pts: circlePts(EARTH[0], EARTH[1], ER, -Math.PI / 2, 120, 1)},
  {id: 'orbit', at: O_AT, dur: 40, ease: ss, w: 1.8, pts: ellipsePts(EARTH[0], EARTH[1], ORB.a, ORB.b, ORB.rot, Math.PI / 2)},
  ribbon(SC.end, [NF.x + NF.r, NF.y], 'rib-end'),
  // S6
  {id: 'nframe', at: NASA_AT, dur: 34, ease: ss, w: 1.8, pts: roundRectPts(NF.x, NF.y, NF.w, NF.h, NF.r)},
  {id: 'voy', at: VOY_AT, dur: 54, ease: ss, w: 2, pts: circlePts(VC[0], VC[1], VR, -Math.PI / 2 - 0.43, 200, 1, 0.86 / (2 * Math.PI))},
  ...CHIP_CX.map((cx, i) => ({id: 'chip' + i, at: CHIP_AT[i], dur: 14, ease: ss, w: 1.6, pts: roundRectPts(cx - 170, 650, 340, 84, 20)} as Stroke)),
  {id: 'qmark', at: QMARK_AT, dur: 22, ease: ss, w: 2, pts: smooth([[1420, 688], [1428, 662], [1452, 650], [1478, 660], [1486, 684], [1470, 706], [1456, 722], [1455, 742]], 10)},
  {id: 'final', at: FINAL_AT, dur: FINAL_DUR, ease: ss, w: 2, pts: FINAL_PATH},
];
STROKES.sort((a, b) => a.at - b.at);
export const STROKE: Record<string, Stroke> = Object.fromEntries(STROKES.map((s) => [s.id, s]));

/** 唯一笔头：位置 + 亮度（0..1） */
export const penAt = (f: number): {p: P; o: number} | null => {
  let prev: Stroke | null = null, next: Stroke | null = null;
  for (const s of STROKES) {
    if (f >= s.at && f < s.at + s.dur) {
      const {head} = partial(ptsOf(s, f), progOf(s, f));
      return {p: head, o: 1};
    }
    if (s.at + s.dur <= f) prev = s;
    else if (s.at > f && !next) next = s;
  }
  const ea = prev ? prev.at + prev.dur : -1e9;
  const pa = prev ? partial(ptsOf(prev, ea), 1).head : null;
  const pb = next ? ptsOf(next, next.at)[0] : null;
  if (prev && next && pa && pb && next.at - ea <= 60) {
    const u = (f - ea) / (next.at - ea);
    return {p: lerpP(pa, pb, ss(u)), o: 1 - 0.45 * Math.sin(Math.PI * u)};
  }
  if (prev && pa && f - ea < 12) return {p: pa, o: 1 - (f - ea) / 12};
  if (next && pb && next.at - f <= 10) return {p: pb, o: 1 - (next.at - f) / 10};
  return null;
};

/* ---------- 推近（只在这里登记） ---------- */
export const PUNCHES: Punch[] = [
  {at: REM_AT - 12, att: 20, hold: REVEAL + 14 - (REM_AT + 8), dec: 30, z: 1.3, F: [WX0 + CIRC - 10, FLOOR + 20], S: [1150, 620]},
  {at: L(13) + 4, att: 36, hold: L(15) - 12 - (L(13) + 40), dec: 30, z: 2.0, F: [600, 214], S: [560, 330]},
];
setPunches(PUNCHES);
export {CLIMAX};
