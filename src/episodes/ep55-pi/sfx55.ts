// ep55 音效表（纯模块）：帧号全部来自 ink55 / timing 的同一批常量，画面和声音永远对得上。
// 由 audio/episodes/ep55-pi-sfx.py 合成成单独的 SFX 总线（比 ep54 响：转场 whoosh、关键揭示 hit/boom、数字 tick、高潮前 riser）。
import {CLIMAX, SC} from './timing';
import {
  A_FRAME, BOX_AT, BR, BREATH0, CHIP_AT, CURIOUS_AT, EQ2_AT, EQ_AT, ERR_AT, FINAL_AT, FINAL_DUR, FORM_AT, GLYPHS, GPSF_AT, LFORM_AT, LROLL0, LROLL_DUR,
  NASA_AT, NASA_DIG0, NASA_LABEL, OBJ, O_AT, PERIOD_AT, PI_AT, PIROW_AT, Q_AT, QMARK_AT, RATIO_AT, REM_AT, REVEAL, ROLL0, ROLL_DUR, SINE_DRAW, STROKES, VOTI_AT,
  VOY_AT, WHEEL_AT, WHY_AT, stepDone, STEPS, outerAt, PUNCHES,
} from './ink55';

export type Sfx = {f: number; k: string; g: number; d?: number};
const out: Sfx[] = [];
const add = (f: number, k: string, g: number, d?: number) => out.push({f: Math.round(f), k, g, d});
// 转场
for (const s of STROKES) if (s.id.startsWith('rib-')) add(s.at - 2, 'whoosh', 1.0, 0.8);
for (const k of ['define', 'arch', 'irr', 'life', 'end']) add(SC[k], 'boomS', 0.7);
// S1
add(WHEEL_AT, 'shimmer', 0.45, 1.4);
add(ROLL0, 'roll', 0.8, ROLL_DUR / 30);
BR.forEach((f) => add(f, 'tickHi', 1.0));
add(REM_AT, 'ding', 0.85);
add(REVEAL, 'hitBig', 1.0);
// S2
add(PI_AT - 2, 'hitMed', 0.85);
add(FORM_AT, 'shimmer', 0.4, 1.0);
OBJ.forEach((o) => add(o.at, 'pluck', 0.55));
RATIO_AT.forEach((f) => add(f, 'tick', 0.85));
add(Q_AT, 'swell', 0.55, 1.2);
// S3
add(A_FRAME, 'shimmer', 0.4, 1.0);
STEPS.forEach((s, i) => { add(s.at, 'zip', 0.45, s.dur / 30); add(outerAt(i), 'zip', 0.45, s.dur / 30); add(stepDone(i), 'tick', 0.9); });
add(PUNCHES[1].at, 'whooshS', 0.6, 1.0);
add(EQ_AT, 'hitBig', 1.0);
add(EQ2_AT, 'hitMed', 0.75);
// S4：每个数字一下轻 tick（前 12 个跟口播，后面越来越密就隔一个、渐弱）
GLYPHS.forEach((g, k) => { if (k < 12) add(g.t, 'tick', 0.6); else if (k % 2 === 0) add(g.t, 'tick', Math.max(0.2, 0.5 - (k - 12) * 0.008)); });
[0, 1, 2].forEach((g) => add(BOX_AT + g * 6, 'tick', 0.7));
add(PIROW_AT, 'shimmer', 0.4, 1.0);
add(VOTI_AT, 'hitMed', 0.95);
// S5
add(LROLL0, 'roll', 0.65, LROLL_DUR / 30);
add(LFORM_AT, 'pluck', 0.6);
add(SINE_DRAW, 'shimmer', 0.45, 1.4);
add(PERIOD_AT, 'ding', 0.65);
add(O_AT, 'whooshS', 0.55, 1.2);
add(GPSF_AT, 'pluck', 0.6);
// S6
add(NASA_AT, 'shimmer', 0.4, 1.0);
for (let k = 0; k < 16; k++) add(NASA_DIG0 + k * 2.5, 'tick', 0.6);
add(NASA_LABEL, 'ding', 0.65);
add(VOY_AT, 'whooshS', 0.55, 1.4);
add(ERR_AT, 'hitMed', 0.85);
add(BREATH0, 'riser', 1.0, (CLIMAX - BREATH0) / 30);
add(CLIMAX, 'climax', 1.0);
add(WHY_AT, 'pluck', 0.6);
CHIP_AT.forEach((f) => add(f + 12, 'tick', 0.85));
add(CURIOUS_AT, 'shimmer', 0.45, 1.0);
add(QMARK_AT + 22, 'ding', 0.65);
add(FINAL_AT, 'whooshS', 0.45, 2.0);
add(FINAL_AT + FINAL_DUR, 'bellEnd', 0.7);
export const SFX = out.sort((a, b) => a.f - b.f);
