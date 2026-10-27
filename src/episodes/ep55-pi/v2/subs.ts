// ep55 v2 字幕：同 v1 的时间，但长句在标点处拆成两条（第二条从该处第一个词的实测时间开始），保证永远一行。
import J from '../script.vi.json';
import WJ from '../words.json';

const WD = WJ as unknown as Record<string, [number, string][]>;
export const MAXC = 62;
const split = (i: number, text: string, f0: number, f1: number): [number, number, string][] => {
  if (text.length <= MAXC) return [[f0, f1, text]];
  // 候选断点：", " ". " ": " 之后
  let best = -1, bd = 1e9;
  for (let k = 0; k < text.length - 1; k++) {
    if ((text[k] === ',' || text[k] === '.' || text[k] === ':') && text[k + 1] === ' ') {
      const d = Math.abs(k - text.length / 2);
      if (d < bd && k > 12 && text.length - k > 12) { bd = d; best = k; }
    }
  }
  if (best < 0) return [[f0, f1, text]];
  const A = text.slice(0, best + 1).trim(), B = text.slice(best + 1).trim();
  const nA = A.split(/\s+/).length;
  const w = WD[String(i)];
  const fb = w && w[nA] ? f0 + Math.max(0, w[nA][0]) - 2 : Math.round((f0 + f1) / 2);
  return [[f0, fb, A], [fb, f1, B]];
};
export const SUBS: [number, number, string][] = J.lines.flatMap((l, i) => {
  const next = i + 1 < J.lines.length ? J.lines[i + 1].f0 : l.f1 + 60;
  return split(i, l.vi, l.f0, Math.min(next - 3, l.f1 + 24));
});
