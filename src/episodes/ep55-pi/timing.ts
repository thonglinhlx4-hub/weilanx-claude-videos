// ep55-pi 时间表：全部来自 script.vi.json（edge-tts 实测时长；场景起点卡 130 BPM 小节线）+ words.json（WordBoundary）。
// 纯模块（无 React），sfx55.ts / ink55.ts / 检查脚本都可以在 node 里加载。
import J from './script.vi.json';
import WJ from './words.json';

export const FPS = 30;
export const FRAMES: number = J.frames;
export const BARF = J.bar * FPS;
export const SC = J.scenes as Record<string, number>;
export const CLIMAX: number = SC.climax;
export const L = (i: number): number => J.lines[i].f0;
export const LE = (i: number): number => J.lines[i].f1;
const WD = WJ as unknown as Record<string, [number, string][]>;
/** 第 i 句里第 n 次出现的词 word 的开始帧（找不到直接抛错） */
export const wd = (i: number, word: string, n = 0): number => {
  const hits = WD[String(i)].filter(([, w]) => w.toLowerCase() === word.toLowerCase());
  if (!hits[n]) throw new Error(`word not found: ${i} ${word} ${n}`);
  return L(i) + Math.max(0, hits[n][0]);
};
export const CUES: [number, number, string][] = J.lines.map((l, i) => {
  const next = i + 1 < J.lines.length ? J.lines[i + 1].f0 : l.f1 + 60;
  return [l.f0, Math.min(next - 3, l.f1 + 24), l.vi] as [number, number, string];
});
