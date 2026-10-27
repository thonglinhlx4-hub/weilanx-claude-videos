// ep56 音效表（纯模块）：帧号全部来自 scene3 / timing 的同一批常量，画面和声音永远对得上。
// 由 audio/episodes/ep56-hilbert-sfx.py（= ep55 的合成器）合成成单独的 SFX 总线：转场 whoosh、揭示 hit、数字 tick、高潮前 riser。
import {
  ALEPH, ARC1, ARC2, ARC3, BOARD0, BOARD1, BUS0, BUS1, CCARD0, CH2_0, CH2_1, CH3_0, CH3_1, CH5_0, CH5_1, CH7_0, CH7_1, CLIMAX, CURB0, CURB1, CURB_ARR,
  DIAG_T, DOOR1, EQ1, EQ2, FINAL0, FINAL1, GCARD, HC2_0, HCARD, L, LE, NEWG, PASS0, PASS1, RET0, ROWS0, SC, STROKES3, T_DRAW0, T_DRAW1, WALKIN, Y1891, ZIG0,
  ZIG1, doorAppear, wd,
} from './scene3';

export type Sfx = {f: number; k: string; g: number; d?: number};
const out: Sfx[] = [];
const add = (f: number, k: string, g: number, d?: number) => out.push({f: Math.round(f), k, g, d});
// 转场：每条场间长金线 + 几次大的横扫
for (const s of STROKES3) if (s.bridge) add(s.at - 2, 'whoosh', 1.0, Math.min(1.6, s.dur / 30));
add(RET0 + 10, 'whooshS', 0.7, 2.0);
for (const k of ['one', 'bus', 'cantor', 'twist', 'end']) add(SC[k], 'boomS', 0.65);
// hook
add(T_DRAW0, 'shimmer', 0.5, (T_DRAW1 - T_DRAW0) / 30);
for (let m = 1; m <= 14; m++) add(doorAppear(m), 'tick', 0.55 - m * 0.02);
add(wd(1, 'kín') - 4, 'hitMed', 0.85);
add(NEWG, 'pluck', 0.7);
add(wd(3, 'vẫn'), 'hitBig', 1.0);
add(HCARD, 'shimmer', 0.45, 1.0);
add(GCARD, 'shimmer', 0.4, 0.8);
add(wd(5, 'một'), 'ding', 0.7);
// one
add(L(6) + 26, 'hitMed', 0.7);
for (let k = 1; k <= 12; k++) add(L(6) + 62 + k * 7, 'tick', 0.5);
add(L(7), 'swell', 0.45, 1.6);
add(L(8), 'ding', 0.75);
add(WALKIN + 24, 'pluck', 0.7);
add(wd(9, 'không'), 'hitMed', 0.8);
// bus
add(BUS0 + 10, 'roll', 0.7, (BUS1 - BUS0 - 10) / 30);
add(L(11) + 10, 'hitMed', 0.85);
for (const a of [ARC1, ARC2, ARC3]) { add(a - 4, 'zip', 0.4, 0.6); add(a + 18, 'tickHi', 1.0); }
for (let k = 0; k < 8; k++) add(BOARD0 + 6 + k * ((BOARD1 - BOARD0) / 8), 'tick', 0.5);
add(wd(12, 'lẻ') - 4, 'ding', 0.6);
add(CURB0, 'whoosh', 0.9, (CURB1 - CURB0) / 30);
CURB_ARR.forEach((f, i) => { if (i < 8) add(f + 30, 'tick', 0.55 - i * 0.04); });
add(L(13) + 14, 'swell', 0.6, 1.4);
add(L(14), 'hitMed', 0.7);
for (const [a, b, n] of [[CH2_0, CH2_1, 4], [CH3_0, CH3_1, 3], [CH5_0, CH5_1, 2], [CH7_0, CH7_1, 2]] as const) {
  add(a, 'zip', 0.4, (b - a) / 30);
  for (let i = 1; i <= n; i++) add(a + ((b - a) * i) / n - 2, 'tickHi', 0.8);
}
add(wd(16, 'nên'), 'hitMed', 0.7);
add(L(17) + 4, 'shimmer', 0.5, 1.4);
// cantor
add(CCARD0, 'shimmer', 0.45, 1.2);
for (let j = 0; j < 9; j++) add(ZIG0 + ((ZIG1 - ZIG0) * (j + 0.6)) / 9.4, 'tick', 0.6);
add(ALEPH - 2, 'hitBig', 1.0);
add(EQ1, 'hitMed', 0.7); add(EQ2, 'hitMed', 0.7); add(wd(21, 'xe'), 'hitMed', 0.75);
add(wd(22, 'vô'), 'pluck', 0.6);
// twist
add(L(24), 'hitMed', 0.85);
add(Y1891, 'hitBig', 1.0);
for (let k = 0; k < 7; k++) add(ROWS0 + k * 7, 'tick', 0.55);
DIAG_T.forEach((f) => { add(f - 2, 'tickHi', 0.9); add(f + 3, 'tick', 0.6); });
add(L(27) + 2, 'hitMed', 0.75);
add(PASS0, 'whooshS', 0.6, 1.2);
for (let k = 0; k < 7; k++) add(PASS0 + 10 + k * 12, 'tick', 0.45);
add(CLIMAX - 105, 'riser', 1.0, 105 / 30);
add(CLIMAX, 'climax', 1.0);
// end
add(HC2_0, 'shimmer', 0.45, 1.2);
add(wd(30, 'không'), 'pluck', 0.6);
add(DOOR1, 'swell', 0.6, 1.8);
add(FINAL0, 'whooshS', 0.5, 2.0);
add(FINAL1 - 10, 'bellEnd', 0.75);
void LE; void PASS1;
export const SFX = out.sort((a, b) => a.f - b.f);
