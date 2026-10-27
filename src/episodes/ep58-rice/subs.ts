// ep56 字幕（竖屏）：永远一行，最宽 MAXW px（字号 SUB_SIZE）。放不下就在词边界拆成连续的几条（优先在标点后断），
// 每条从它第一个词的实测时间（WordBoundary）开始。宽度按 Noto Serif 的字宽估算（渲染时还会用 canvas 实测再兜底缩放）。
import J from './script.vi.json';
import WJ from './words.json';

export const SUB_SIZE = 42, SUB_LS = 1.2, MAXW = 860;
const WD = WJ as unknown as Record<string, [number, string][]>;
const cw = (ch: string) => {
  if (ch === ' ') return 0.27;
  if (/[.,:;!?'’“”"|]/.test(ch)) return 0.3;
  if (/[—]/.test(ch)) return 1.0;
  if (/[…]/.test(ch)) return 0.9;
  if (/[0-9]/.test(ch)) return 0.57;
  if (/[A-ZĐÀ-ỸÂĂÊÔƠƯ]/.test(ch) && ch === ch.toUpperCase() && ch !== ch.toLowerCase()) return 0.7;
  if (/[mwMW]/.test(ch)) return 0.82;
  if (/[ilj]/.test(ch)) return 0.3;
  if (/[→⇔≠×∞ℵ]/.test(ch)) return 0.9;
  return 0.54;
};
export const subWidth = (t: string) => [...t].reduce((s, ch) => s + cw(ch) * SUB_SIZE + SUB_LS, 0);
const punct = (w: string) => /[,.:;?!…—]$/.test(w);
// 断句代价：标点后 0；在这些词之前断（新的短语开头）代价小；其余词边界代价大（避免"…cho / bạn"这种半截短语）
const SOFT = new Set(['đã', 'khi', 'và', 'nhưng', 'rồi', 'hãy', 'chừa']);
const breakCost = (ws: string[], i: number) => (punct(ws[i - 1]) ? 0 : SOFT.has(ws[i].toLowerCase()) ? 3 : 10);
/** 把一句拆成若干块（词下标区间），每块宽度 ≤ MAXW，尽量均匀、尽量在标点后断 */
export const chunk = (text: string): string[][] => {
  const ws = text.split(/\s+/).filter(Boolean);
  const n = ws.length;
  const width = (a: number, b: number) => subWidth(ws.slice(a, b).join(' '));
  const total = width(0, n);
  if (total <= MAXW) return [ws];
  const k0 = Math.ceil(total / MAXW);
  let best: string[][] | null = null, bestCost = Infinity;
  for (let k = k0; k <= k0 + 2; k++) {
    const target = total / k;
    // dp[i][c] = 最小代价：前 i 个词分成 c 块
    const dp: number[][] = Array.from({length: n + 1}, () => new Array(k + 1).fill(Infinity));
    const bk: number[][] = Array.from({length: n + 1}, () => new Array(k + 1).fill(-1));
    dp[0][0] = 0;
    for (let i = 1; i <= n; i++) for (let c = 1; c <= k; c++) for (let j = c - 1; j < i; j++) {
      if (dp[j][c - 1] === Infinity) continue;
      const w = width(j, i);
      if (w > MAXW) continue;
      if (i - j < 2 && n > 3) continue;
      const cost = dp[j][c - 1] + ((w - target) / 200) ** 2 + (i < n ? breakCost(ws, i) : 0);
      if (cost < dp[i][c]) { dp[i][c] = cost; bk[i][c] = j; }
    }
    // 多一块要付 3 的代价：只有能换来标点 / 短语处断开时才多拆
    if (dp[n][k] < Infinity && dp[n][k] + 3 * (k - k0) < bestCost) {
      bestCost = dp[n][k] + 3 * (k - k0);
      const out: string[][] = [];
      let i = n;
      for (let c = k; c > 0; c--) { const j = bk[i][c]; out.unshift(ws.slice(j, i)); i = j; }
      best = out;
    }
  }
  return best ?? [ws];
};
/** 多个空格 = 公式之间的分隔：先按它分段，能放进一行的相邻段合并，再对仍然太长的段按词拆 */
const lines1 = (text: string): string[][] => {
  const segs = text.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean);
  const out: string[][] = [];
  let cur: string[] = [];
  for (const sg of segs) {
    const ws = sg.split(/\s+/);
    const trial = [...cur, ...(cur.length ? ['\u2002'] : []), ...ws];
    if (subWidth(trial.join(' ')) <= MAXW) { cur = trial; continue; }
    if (cur.length) out.push(cur);
    cur = [];
    const ch = chunk(sg);
    out.push(...ch.slice(0, -1)); cur = ch[ch.length - 1];
  }
  if (cur.length) out.push(cur);
  return out;
};
const split = (i: number, text0: string, spoken: string, f0: number, f1: number): [number, number, string][] => {
  const parts = lines1(text0);
  const text = parts.flat().join(' ');
  if (parts.length === 1) return [[f0, f1, text]];
  const nV = parts.flat().filter((x) => x !== '\u2002').length;
  const w = WD[String(i)] ?? [];
  const same = spoken.split(/\s+/).filter(Boolean).length === nV && w.length === nV;
  const out: [number, number, string][] = [];
  let idx = 0, start = f0;
  parts.forEach((p, k) => {
    if (k > 0) {
      const wi = same ? idx : Math.round((idx / nV) * w.length);
      start = w[wi] ? f0 + Math.max(0, w[wi][0]) - 2 : Math.round(f0 + ((f1 - f0) * idx) / nV);
      out[k - 1][1] = start;
    }
    out.push([start, f1, p.join(' ')]);
    idx += p.filter((x) => x !== '\u2002').length;
  });
  return out;
};
export const SUBS: [number, number, string][] = J.lines.flatMap((l, i) => {
  const next = i + 1 < J.lines.length ? J.lines[i + 1].f0 : l.f1 + 60;
  return split(i, l.vi, l.spoken, l.f0, Math.min(next - 3, l.f1 + 24));
});
