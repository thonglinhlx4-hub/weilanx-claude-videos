// ep57 时间表：全部来自 script.vi.json（edge-tts 实测；场景起点卡 130 BPM 小节线）+ words.json（WordBoundary）。纯模块。
import J from './script.vi.json';
import WJ from './words.json';

export const FPS = 30;
export const FRAMES: number = J.frames;
export const SC = J.scenes as Record<string, number>;
export const CLIMAX: number = SC.climax;
export const L = (i: number): number => J.lines[i].f0;
export const LE = (i: number): number => J.lines[i].f1;
export const LINES = J.lines;
const WD = WJ as unknown as Record<string, [number, string][]>;
/** 第 i 句里第 n 次出现的词 word 的开始帧（找不到直接抛错） */
export const wd = (i: number, word: string, n = 0): number => {
  const hits = WD[String(i)].filter(([, w]) => w.toLowerCase() === word.toLowerCase());
  if (!hits[n]) throw new Error(`word not found: ${i} ${word} ${n}`);
  return L(i) + Math.max(0, hits[n][0]);
};
export const words = (i: number) => WD[String(i)];
