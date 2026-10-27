// ep58 上屏数字（纯模块，测试里逐条重算）。全部用 BigInt 精确计算，再按越南写法格式化（千分位 "."，小数 ","）。
// 假设：1 hạt gạo ≈ 25 mg（千粒重 15–43 g，取 ~25 g）。
// 世界产量：546,6 triệu tấn (gạo xay) 2024/25 — FAO Food Outlook 6/2025, Table 1.4
//   https://openknowledge.fao.org/server/api/core/bitstreams/4db8954b-ed66-4e7a-a945-3f35dcccaf1d/content
// Việt Nam：26,2 triệu tấn (gạo xay) 2025/26 — USDA FAS PSD (World Rice Production, Consumption, and Stocks, 10/2026)
//   https://apps.fas.usda.gov/psdonline/reporthandler.ashx?fileName=World+Rice+Production%2C+Consumption%2C+and+Stocks&format=html&reportId=681&templateId=7

export const MG_PER_GRAIN = 25;
export const WORLD_T = 546.6e6;
export const VN_T = 26.2e6;

/** ô n (1..64) 上的粒数 = 2^(n−1) */
export const grains = (n: number): bigint => 1n << BigInt(n - 1);
/** 前 n 格总数 = 2^n − 1 */
export const sumTo = (n: number): bigint => (1n << BigInt(n)) - 1n;
export const TOTAL = sumTo(64); // 18.446.744.073.709.551.615
/** 粒数 → 吨（浮点足够：只用于近似值） */
export const tonnes = (g: bigint) => (Number(g) * MG_PER_GRAIN) / 1e9;

/** 越南千分位：12345678 → "12.345.678" */
export const vn = (x: bigint | number) => (typeof x === 'bigint' ? x.toString() : String(Math.round(x))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
/** 小数用逗号 */
export const dec = (x: number, d = 1) => x.toFixed(d).replace('.', ',');

/** 一格的重量，选合适的单位（g / kg / tấn），≈ 近似 */
export const weightTxt = (g: bigint): string => {
  const mg = Number(g) * MG_PER_GRAIN;
  if (mg < 1000) return `${mg} mg`;
  if (mg < 1e6) return `${dec(mg / 1000, mg < 1e5 ? 1 : 0)} g`;
  if (mg < 1e9) return `${dec(mg / 1e6, mg < 1e8 ? 1 : 0)} kg`;
  const t = mg / 1e9;
  if (t < 1e6) return `${t < 100 ? dec(t, 1) : vn(Math.round(t))} tấn`;
  if (t < 1e9) return `${dec(t / 1e6, 1)} triệu tấn`;
  return `${dec(t / 1e9, 1)} tỷ tấn`;
};

/* 关键数字（上屏，测试里重算） */
export const SQ10 = vn(grains(10));            // 512
export const SQ10_G = dec(tonnes(grains(10)) * 1e6, 1); // 12,8 (g)
export const SQ20 = vn(grains(20));            // 524.288
export const SQ20_KG = dec(tonnes(grains(20)) * 1000, 1); // 13,1
export const HALF = vn(sumTo(32));             // 4.294.967.295
export const HALF_T = Math.round(tonnes(sumTo(32))); // 107
export const SQ40 = vn(grains(40));            // 549.755.813.888
export const SQ40_T = vn(Math.round(tonnes(grains(40)))); // 13.744
export const SQ50 = vn(grains(50));            // 562.949.953.421.312
export const SQ50_MT = dec(tonnes(grains(50)) / 1e6, 2); // 14,07 (triệu tấn)
export const SQ64 = vn(grains(64));            // 9.223.372.036.854.775.808
export const SQ64_TT = dec(Number(grains(64)) / 1e18, 2); // 9,22 (tỷ tỷ)
export const TOTAL_TXT = vn(TOTAL);            // 18.446.744.073.709.551.615
export const TOTAL_TT = dec(Number(TOTAL) / 1e18, 1); // 18,4 (tỷ tỷ)
export const TOTAL_T = tonnes(TOTAL);          // ≈ 4,61e11 tấn
export const TOTAL_TYT = Math.round(TOTAL_T / 1e9); // 461 (tỷ tấn)
export const YEARS_WORLD = Math.round(TOTAL_T / WORLD_T); // 844
export const YEARS_VN = Math.round(TOTAL_T / VN_T / 100) * 100; // 17.600
