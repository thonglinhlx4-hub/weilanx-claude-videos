// ep54 v2：所有人物都用同一种半透明 3D 合成（fx.tsx 的 Figure）：screen 叠加、羽化、金色轮廓光、轻模糊 + 颗粒、透视慢推 + 视差。
// 历史段：每个人物在旁白念到名字时柔和溶入（NAME = 句首到名字的帧数，来自 edge-tts WordBoundary 实测），下一位出现前淡出。
// 卖菜大叔段：同样的合成，代替原来的硬切。
// 肖像：Wikimedia Commons 公有领域油画/版画（见 NOTES.md）；巴比伦书吏为 AI 生成的示意人物。
import React from 'react';
import {Fig, Figure} from './fx';
import {L, L_BERNOULLI, L_FERMAT, SC} from './timing';

const NAME: Record<number, number> = {21: 71, [L_FERMAT]: 59, 24: 56, 26: 55, [L_BERNOULLI]: 48, 27: 76, 28: 60};
const at = (i: number) => L(i) + NAME[i] - 8;
const X = 520, Y = 540, HH = 860;
export const HIST_FIGS: (Fig & {key: string})[] = [
  {key: 'babylon', src: 'ep54/fig-babylon.png', at: at(21), out: L(L_FERMAT) - 2, x: X - 40, y: Y, h: 820, o: 0.62},
  {key: 'fermat', src: 'ep54/fig-fermat.png', at: at(L_FERMAT), out: L(24) - 2, x: X, y: Y, h: HH, o: 0.7},
  {key: 'descartes', src: 'ep54/fig-descartes.png', at: at(24), out: L(26) - 2, x: X, y: Y, h: HH, o: 0.66, side: -1},
  {key: 'leibniz', src: 'ep54/fig-leibniz.png', at: at(26), out: L(L_BERNOULLI) - 2, x: X, y: Y, h: HH, o: 0.66},
  {key: 'bernoulli', src: 'ep54/fig-bernoulli.png', at: at(L_BERNOULLI), out: L(27) - 2, x: X, y: Y, h: HH, o: 0.68, side: -1},
  {key: 'euler', src: 'ep54/fig-euler.png', at: at(27), out: L(28) - 2, x: X, y: Y, h: HH, o: 0.64},
  {key: 'dirichlet', src: 'ep54/fig-dirichlet.png', at: at(28), out: SC.rule - 6, x: X, y: Y, h: HH, o: 0.6, side: -1},
];
export const VENDOR_FIG: Fig = {src: 'ep54/fig-vendor.png', at: SC.vendor - 4, out: SC.history + 4, x: 450, y: 500, h: 780, o: 0.75};

export const FigureLayer: React.FC<{f: number}> = ({f}) => {
  if (f >= SC.vendor - 4 && f < SC.history + 4) return <Figure fig={VENDOR_FIG} f={f} fadeIn={18} fadeOut={14} />;
  if (f < SC.history || f >= SC.rule) return null;
  return <>{HIST_FIGS.map((g) => (f >= g.at && f < g.out ? <Figure key={g.key} fig={g} f={f} fadeIn={22} fadeOut={14} /> : null))}</>;
};
