// ep57 音效表（纯模块）：帧号全部来自 scene3 / timing 的同一批常量，画面和声音永远对得上。
// 由 audio/episodes/ep57-monty-sfx.py（= ep56 的合成器）合成成单独的 SFX 总线：转场 whoosh、揭示 hit、数字 tick、高潮前 riser + 高潮重拍（帧 CLIMAX）。
import {
  ASK0, BRACE0, CAR_IN, CAR_OUT0, CLIMAX, COUNT0, DOORS0, DOORS1, DOTS0, ECARD0, FAR0, FAR1, FINAL0, FINAL1, GOAT_IN, KEEP_Q, L, LE, LET0, LET1,
  MCARD0, MINE0, MON0, M_TXT, OPEN2, OPEN3, OPEN3B, PHD0, PHD1, PICK0, POUR0, POUR1, RING1_0, RING2_0, SAI, SC, STAY_LBL, STRIKE0, STROKES3, T_CAR, T_OPEN,
  T_RES, TITLE0, WAVE0, WAVE1, wd,
} from './scene3';

export type Sfx = {f: number; k: string; g: number; d?: number};
const out: Sfx[] = [];
const add = (f: number, k: string, g: number, d?: number) => out.push({f: Math.round(f), k, g, d});
// 转场：场间长金线（相机沿它飞）+ 场景起点的低频
for (const s of STROKES3) if (s.bridge) add(s.at - 2, 'whoosh', 1.0, Math.min(2.4, s.dur / 30));
for (const k of ['fight', 'why', 'cases', 'million', 'end']) add(SC[k], 'boomS', 0.6);
// hook
add(DOORS0, 'shimmer', 0.5, (DOORS1 - DOORS0) / 30);
add(CAR_IN, 'swell', 0.45, 1.4);
add(GOAT_IN, 'pluck', 0.55);
add(PICK0 + 6, 'zip', 0.4, 0.5);
add(wd(1, 'chọn'), 'ding', 0.6);
add(L(2) + 10, 'shimmer', 0.4, 1.0);
add(OPEN3, 'hitMed', 0.8);
add(ASK0, 'zip', 0.35, 0.6);
add(wd(3, 'đổi') - 2, 'hitMed', 0.7);
// fight
add(STRIKE0 + 6, 'zip', 0.5, 0.4);
add(STRIKE0 + 8, 'hitMed', 0.6);
add(MCARD0 + 10, 'shimmer', 0.45, 1.2);
add(wd(5, 'hãy'), 'hitBig', 0.9);
add(LET0, 'roll', 0.5, (LET1 - LET0) / 30);
for (let k = 0; k < 10; k++) add(LET0 + 4 + ((LET1 - LET0 - 4) * k) / 10, 'tick', 0.5);
for (let k = 0; k < 7; k++) add(PHD0 + ((PHD1 - PHD0) * k) / 7, 'tick', 0.45);
add(SAI, 'hitMed', 0.9);
add(ECARD0 + 12, 'shimmer', 0.4, 1.0);
add(MON0 + 6, 'pluck', 0.5);
for (let k = 0; k < 12; k++) add(DOTS0 + k * 4, 'tick', 0.35);
// why
add(wd(8, 'đầu'), 'ding', 0.6);
add(RING1_0 + 10, 'pluck', 0.55);
add(RING2_0 + 10, 'pluck', 0.6);
add(OPEN3B, 'hitMed', 0.7);
add(POUR0, 'swell', 0.6, (POUR1 - POUR0) / 30 + 0.6);
add(POUR1 - 4, 'ding', 0.7);
// cases
for (const k of [1, 2, 3]) {
  add(T_CAR[k], 'pluck', 0.5);
  add(T_OPEN[k], 'tickHi', 0.7);
  add(T_RES[k], k === 1 ? 'boomS' : 'ding', k === 1 ? 0.45 : 0.7);
}
add(BRACE0 + 8, 'hitMed', 0.8);
// million
add(M_TXT, 'hitMed', 0.75);
add(MINE0 + 4, 'zip', 0.4, 0.8);
add(WAVE0, 'roll', 0.6, (WAVE1 - WAVE0) / 30);
for (let k = 0; k < 12; k++) add(WAVE0 + ((WAVE1 - WAVE0) * k) / 12, 'tick', 0.45);
add(FAR0, 'zip', 0.45, (FAR1 - FAR0) / 30);
add(FAR1, 'ding', 0.7);
add(KEEP_Q, 'hitMed', 0.75);
// end：计数 tick 越来越密 → riser → 0.6 s 静默 → 高潮重拍落在 CLIMAX（"hai phần ba" 的 "hai"）
for (let k = 0; k < 18; k++) { const u = (k + 1) / 19; add(COUNT0 + (CLIMAX - 24 - COUNT0) * Math.pow(u, 0.6), 'tick', 0.4); }
add(STAY_LBL, 'pluck', 0.55);
add(CLIMAX - 105, 'riser', 1.0, 97 / 30); // ends ~CLIMAX−8 incl. its 0.32 s fade → ~0.6 s of silence with the voice hold
add(CLIMAX, 'climax', 1.15);
add(CLIMAX + 6, 'shimmer', 0.5, 1.6);
add(wd(21, 'Nhưng'), 'pluck', 0.5);
add(OPEN2, 'swell', 0.6, 1.8);
add(CAR_OUT0, 'roll', 0.35, 2.4);
add(FINAL0, 'whooshS', 0.5, 2.0);
add(TITLE0, 'shimmer', 0.45, 1.4);
add(FINAL1 - 10, 'bellEnd', 0.75);
void LE;
export const SFX = out.sort((a, b) => a.f - b.f);
