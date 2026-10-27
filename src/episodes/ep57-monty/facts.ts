// ep57 上屏数字（纯模块，测试里逐条重算）：Monty Hall 模拟（固定种子）、一百万扇门、三种情况表。
// 来源：https://en.wikipedia.org/wiki/Monty_Hall_problem（Parade "Ask Marilyn" 1990-09；约 10,000 封信、近 1,000 位博士；
// Erdős 看到计算机模拟才信（Vazsonyi）；一百万扇门的例子出自 vos Savant）

/** mulberry32：小而确定的 PRNG */
export const mulberry32 = (seed: number) => () => {
  let t = (seed = (seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const SIM_SEED = 1990;
export const SIM_N = 10000;
export type Game = {car: number; pick: number; open: number; stayWin: boolean; switchWin: boolean};
/** 一局：车随机放、玩家随机选、主持人打开一扇"不是玩家选的、也没有车"的门（两扇都可以时随机） */
export const simulate = (n = SIM_N, seed = SIM_SEED): Game[] => {
  const r = mulberry32(seed);
  const out: Game[] = [];
  for (let i = 0; i < n; i++) {
    const car = Math.floor(r() * 3), pick = Math.floor(r() * 3);
    const can = [0, 1, 2].filter((d) => d !== pick && d !== car);
    const open = can[can.length === 1 ? 0 : Math.floor(r() * 2)];
    const sw = [0, 1, 2].find((d) => d !== pick && d !== open)!;
    out.push({car, pick, open, stayWin: pick === car, switchWin: sw === car});
  }
  return out;
};
export const GAMES = simulate();
/** 前 k 局里"giữ"/"đổi"各赢了几局（累计表，渲染时 O(1) 取） */
export const CUM_STAY: number[] = (() => { const c = [0]; for (const g of GAMES) c.push(c[c.length - 1] + (g.stayWin ? 1 : 0)); return c; })();
export const STAY_WINS = CUM_STAY[SIM_N];
export const SWITCH_WINS = SIM_N - STAY_WINS;
/** 屏幕上的数字：越南式千分位（10.000） */
export const vn = (x: number) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const pct = (a: number, n: number) => (n ? ((100 * a) / n).toFixed(1).replace('.', ',') + '%' : '0%');

/* 一百万扇门：你选一扇，主持人打开其余里除了一扇之外的全部 */
export const MILLION = 1_000_000;
export const OPENED = MILLION - 2; // 999.998
export const OPENED_TXT = vn(OPENED);
export const MILLION_TXT = vn(MILLION);

/* 三种情况（玩家选门 1；车在门 k）：主持人开哪扇、换门赢不赢 */
export type Case = {car: number; open: number; switchTo: number; switchWins: boolean};
export const CASES: Case[] = [1, 2, 3].map((car) => {
  const pick = 1;
  // 车在门 1 时主持人可开 2 或 3（画面上开门 3）；否则只能开唯一那扇有羊的门
  const open = car === 1 ? 3 : [2, 3].find((d) => d !== car)!;
  const switchTo = [1, 2, 3].find((d) => d !== pick && d !== open)!;
  return {car, open, switchTo, switchWins: switchTo === car};
});
export const CASE_WINS = CASES.filter((c) => c.switchWins).length; // 2（三种里赢两种）

/* fight 场景里的计数（来自 Wikipedia：约 10,000 封信，近 1,000 封来自博士） */
export const LETTERS = 10000, PHDS = 1000;
