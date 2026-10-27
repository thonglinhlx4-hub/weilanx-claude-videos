// ep58 音效表（纯模块）：帧号全部来自 scene3 / timing 的同一批常量，画面和声音永远对得上。
// 由 audio/episodes/ep58-rice-sfx.py（= ep57 的合成器 + 新增 grain / hitHuge）合成成单独的 SFX 总线：
// 转场 whoosh、揭示 hit（ô 40 / ô 50 / ô 64 / 高潮）、数字滚动 tick、高潮前 riser + 高潮重拍（帧 CLIMAX，"mười tám tỷ tỷ" 的 "mười"）。
import {
  BACK0, BACK1, CLIMAX, EARTH0, EARTHC0, FINAL0, FINALT, FRAME0, FRAME1, FRAMES, HALF_TXT0, HOP0, KING_OK, L, LE, MCARD0, ORBIT0, ORBIT1, PREV0, PREV1,
  PROOF0, PROOF1, RING0, RULE0, SC, SQ1_0, SQ2_1, TAGS, TITLE0, TOT0, VNC0, WEIGHT_T, X2, X63, sAt, wd,
} from './scene3';

export type Sfx = {f: number; k: string; g: number; d?: number};
const out: Sfx[] = [];
const add = (f: number, k: string, g: number, d?: number) => out.push({f: Math.round(f), k, g, d});
/** 笔头落到第 n 格的帧（sAt 第一次 ≥ n） */
const landF = (n: number) => { for (let f = HOP0; f < FRAMES; f++) if (sAt(f) >= n - 0.02) return f; return FRAMES; };

// 转场：每个场景起点前一个 whoosh + 起点的低频
for (const k of ['legend', 'half1', 'half2', 'total', 'end']) { add(SC[k] - 16, 'whoosh', 0.9, 0.8); add(SC[k], 'boomS', 0.5); }
// hook
add(4, 'swell', 0.35, 1.6);
add(RING0, 'shimmer', 0.45, 1.0);
add(X2 - 1, 'pluck', 0.6);
add(X63 - 1, 'hitMed', 0.7);
add(TITLE0 - 2, 'hitBig', 0.95);
// legend
add(FRAME0 + 4, 'shimmer', 0.4, (FRAME1 - FRAME0) / 30);
add(MCARD0 + 6, 'shimmer', 0.4, 1.1);
add(SQ1_0 + 6, 'ding', 0.55);
add(SQ2_1 - 6, 'pluck', 0.55);
add(PREV0, 'zip', 0.35, (PREV1 - PREV0) / 30);
add(BACK0, 'whooshS', 0.6, (BACK1 - BACK0) / 30);
// half1：ô 2–6 米粒落下（grain），ô 7–32 tick；10 / 20 / 32 一声 ding
for (let n = 2; n <= 32; n++) {
  const f = landF(n);
  if (n <= 6) add(f - 2, 'grain', 0.55 + 0.05 * n);
  else add(f, 'tick', n % 2 ? 0.42 : 0.36);
  if (n === 10 || n === 20) add(f + 2, 'ding', 0.6);
}
add(landF(32) + 2, 'hitMed', 0.75);
add(HALF_TXT0 + 2, 'pluck', 0.5);
add(KING_OK + 4, 'ding', 0.55);
// half2：快速跳格 = 一串更密的 tick（和数字滚动同步）+ ô 40 / ô 50 / ô 64 重击
add(RULE0, 'pluck', 0.45);
add(landF(33), 'hitMed', 0.6);
for (let n = 34; n <= 64; n++) if (n !== 40 && n !== 50 && n !== 64) add(landF(n), 'tick', 0.38 + 0.004 * (n - 34));
add(landF(33) + 4, 'roll', 0.45, (landF(40) - landF(33)) / 30);
add(landF(40) + 4, 'roll', 0.5, (landF(50) - landF(40) - 8) / 30);
add(landF(50) + 4, 'roll', 0.55, (landF(64) - landF(50) - 8) / 30);
add(landF(40), 'hitBig', 0.9);
add(landF(50), 'hitBig', 1.0);
add(landF(64), 'hitHuge', 1.05);
// total：证明链（每行一下 tick）→ riser → 高潮
add(TOT0, 'hitMed', 0.6);
add(wd(16, 'hai') - 2, 'ding', 0.55);
{
  const step = (PROOF1 - PROOF0 - 24) / 5;
  for (let i = 0; i < 6; i++) add(PROOF0 + 8 + i * step, i === 5 ? 'tickHi' : 'tick', i === 5 ? 0.6 : 0.45);
}
add(CLIMAX - 92, 'riser', 1.0, 86 / 30); // ends ≈ CLIMAX−6 incl. its fade; ~0.2 s of breath, then the hit lands on "mười"
add(CLIMAX, 'climax', 1.15);
add(CLIMAX + 6, 'shimmer', 0.5, 1.8);
for (let k = 0; k < 10; k++) add(CLIMAX + 4 + k * 1.4, 'tick', 0.3); // LED fills to 18.446.744.073.709.551.615
add(WEIGHT_T - 2, 'hitMed', 0.7);
// earth：相机升空（crane）→ 地球框 → 计年 → 越南
add(LE(17) + 2, 'whoosh', 1.0, 2.2);
add(EARTH0 + 6, 'boomS', 0.45);
add(EARTHC0 + 4, 'shimmer', 0.45, 1.4);
add(wd(18, 'khoảng'), 'hitMed', 0.65);
add(ORBIT0, 'roll', 0.45, (ORBIT1 - ORBIT0) / 30);
for (let k = 0; k < 14; k++) add(ORBIT0 + 4 + ((ORBIT1 - ORBIT0 - 14) * k) / 14, 'tick', 0.38);
add(ORBIT1 - 6, 'ding', 0.65);
add(VNC0 + 4, 'shimmer', 0.4, 1.1);
for (let k = 0; k < 8; k++) add(VNC0 + 14 + (34 * k) / 8, 'tick', 0.36);
add(VNC0 + 48, 'ding', 0.65);
// end：HÀM MŨ · đường cong · tags · kết
add(L(21) + 2, 'hitMed', 0.7);
add(L(21) + 4, 'swell', 0.5, 2.6);
add(wd(21, 'vượt') - 2, 'hitMed', 0.6);
for (const t of TAGS) add(t, 'pluck', 0.5);
add(FINAL0, 'whooshS', 0.5, 2.0);
add(FINALT + 10, 'shimmer', 0.45, 1.4);
add(FRAMES - 44, 'bellEnd', 0.7);
export const SFX = out.sort((a, b) => a.f - b.f);
