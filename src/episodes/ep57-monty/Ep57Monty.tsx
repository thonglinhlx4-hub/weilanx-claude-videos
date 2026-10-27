// ep57「Ba cánh cửa · Monty Hall」— 9:16 竖屏 · 真 3D（three.js，沿用 ep56 管线）：
// 一条贯穿全片的金线 + 唯一笔头；暗色无尽舞台 + 玻璃地面倒影 + 暖雾；门板 = 液体光容器（液面 = 概率）。
// 文字 / 数字全部在屏幕层（整数像素、固定字号）；字幕一行、顶在 y 1362、最宽 860 px。
// 音轨：public/audio/ep57-monty/mix.wav（人声 + BGM + SFX，audio/episodes/ep57-monty-tts/mix.py）。
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../ep55-pi/kit55';
import {GrainVignette, Svg} from './kit57';
import {FONT} from '../ep54-hamso/fx';
import {GLStage} from './Stage';
import {buildWorld} from './world';
import {ScreenText} from './screen';
import {CLIMAX, FRAMES, camAt, clamp, fogK, pen3, prog} from './scene3';
import {H, W, project} from './gl';
import {MAXW, SUBS, SUB_LS, SUB_SIZE} from './subs';

export const EP57_FRAMES = FRAMES;
export const EP57_W = W, EP57_H = H;

/** 唯一笔头（屏幕层；位置由 3D 投影得到；随雾变淡） */
const Pen3: React.FC<{f: number}> = ({f}) => {
  const pp = pen3(f);
  const c = camAt(f);
  const [x, y, d] = project(c, pp.p);
  const o = pp.o * Math.max(0.35, fogK(f, d));
  if (d <= 0.2 || o <= 0.01) return null;
  const fl = 1 + 0.04 * Math.sin(f * 0.9) + (pp.moving ? 0 : 0.05 * Math.sin(f * 0.21));
  const s = 0.6 * fl * clamp(9 / d, 0.4, 1.3);
  return (
    <Svg>
      <g transform={`translate(${x.toFixed(2)},${y.toFixed(2)})`} opacity={o} style={{mixBlendMode: 'screen'}}>
        <circle r={110 * s} fill="url(#halo2)" opacity={0.22} />
        <circle r={42 * s} fill="url(#halo2)" opacity={0.55} />
        <rect x={-160 * s} y={-1.2 * s} width={320 * s} height={2.4 * s} fill="url(#streak)" opacity={0.34} />
        <path d={`M${-36 * s},0 Q0,${-4 * s} ${36 * s},0 Q0,${4 * s} ${-36 * s},0 Z M0,${-20 * s} Q${4 * s},0 0,${20 * s} Q${-4 * s},0 0,${-20 * s} Z`} fill="#fff3dc" opacity={0.5} />
        <circle r={Math.max(3.0, 5.2 * s / 0.6)} fill="#fff8ec" opacity={0.92} />
      </g>
    </Svg>
  );
};

let _ctx: CanvasRenderingContext2D | null = null;
const measure = (t: string) => {
  if (typeof document === 'undefined') return 0;
  _ctx ??= document.createElement('canvas').getContext('2d');
  if (!_ctx) return 0;
  _ctx.font = `300 ${SUB_SIZE}px ${FONT.serif}`;
  return _ctx.measureText(t).width + SUB_LS * t.length;
};
const Sub: React.FC<{f: number}> = ({f}) => {
  const c = SUBS.find(([a, b]) => f >= a && f < b);
  if (!c) return null;
  const [a, b, s] = c;
  const o = Math.min(prog(f, a, 4), 1 - prog(f, b - 4, 4));
  const w = measure(s);
  const size = w > MAXW + 20 ? Math.floor((SUB_SIZE * (MAXW + 20)) / w) : SUB_SIZE;
  return (
    <div style={{position: 'absolute', left: 0, width: W, top: 1362, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: FONT.serif, fontWeight: 300, fontSize: size, lineHeight: 1.3, letterSpacing: SUB_LS, color: C.white, opacity: o, textShadow: '0 1px 10px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.8)'}}>{s}</div>
  );
};

export const Ep57Monty: React.FC = () => {
  const f = useCurrentFrame();
  // 高潮前 0.6 s 的静默：画面收暗，"hai phần ba" 落拍时一闪
  const dark = f < CLIMAX ? clamp((f - (CLIMAX - 34)) / 30) * 0.32 : 0;
  return (
    <AbsoluteFill style={{background: '#030308'}}>
      <GLStage f={f} build={buildWorld} />
      <Pen3 f={f} />
      <Svg><ScreenText f={f} /></Svg>
      {/* 字幕区的柔和压暗带（y 1330–1440）：亮物体不和字幕抢 */}
      <div style={{position: 'absolute', left: 0, top: 1300, width: W, height: 180, background: 'linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)', pointerEvents: 'none'}} />
      <Sub f={f} />
      <AbsoluteFill style={{background: '#000', opacity: dark, pointerEvents: 'none'}} />
      {f >= CLIMAX && f < CLIMAX + 8 ? <AbsoluteFill style={{background: '#fff4e0', opacity: 0.2 * (1 - (f - CLIMAX) / 8), mixBlendMode: 'screen'}} /> : null}
      <AbsoluteFill style={{background: '#000', opacity: clamp((f - (FRAMES - 30)) / 28), pointerEvents: 'none'}} />
      <GrainVignette f={f} grain={0.045} />
      <Audio src={staticFile('audio/ep57-monty/mix.wav')} />
    </AbsoluteFill>
  );
};
