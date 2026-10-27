// ep54-hamso 时间表：全部来自 script.vi.json（TTS 实测时长 + 场景起点卡 130 BPM 小节线）。
import J from './script.vi.json';

export const FPS = 30;
export const FRAMES: number = J.frames;
export const BARF = J.bar * FPS; // 一小节帧数 ≈ 55.38
export const SC = J.scenes as Record<string, number>;
/** 第 i 句开始帧 */
export const L = (i: number): number => J.lines[i].f0;
export const LE = (i: number): number => J.lines[i].f1;
export const CLIMAX: number = SC.climax;
/** 字幕：每句至少延到下一句前 3 帧（不超过结束后 24 帧） */
// v2：插入句（Fermat、Bernoulli）追加在数组末尾以保持 L(i) 下标不变，所以字幕先按 f0 排序
const BYT = [...J.lines].sort((a, b) => a.f0 - b.f0);
export const CUES: [number, number, string][] = BYT.map((l, i) => {
  const next = i + 1 < BYT.length ? BYT[i + 1].f0 : l.f1 + 60;
  return [l.f0, Math.min(next - 3, l.f1 + 24), l.vi] as [number, number, string];
});
/** v2 插入句：Fermat（1636）、Bernoulli（1718） */
export const L_FERMAT = 46, L_BERNOULLI = 47;
