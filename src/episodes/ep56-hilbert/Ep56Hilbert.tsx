// ep56「Khách sạn vô cực của Hilbert」— 9:16 竖屏 · 真 3D（three.js，沿用 ep55 v2 管线）：
// 一条贯穿全片的金线 + 唯一笔头；走廊（单号左墙 / 双号右墙）向上退进雾里；相机在场景之间推、升、飞。
// 文字 / 数字 / 公式全部在屏幕层（整数像素、固定字号）；字幕一行、在 ~72% 高度、最宽 860 px。
import React from 'react';
import {AbsoluteFill, Audio, getInputProps, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../ep55-pi/kit55';
import {GrainVignette, Svg} from './kit56';
import {FONT} from '../ep54-hamso/fx';
import {GLStage} from './Stage';
import {buildWorld} from './world';
import {ScreenText} from './screen';
import {CLIMAX, FRAMES, camAt, clamp, fogK, pen3, prog} from './scene3';
import {H, W, project} from './gl';
import {MAXW, SUBS, SUB_LS, SUB_SIZE} from './subs';

export const EP56_FRAMES = FRAMES;
// 调试：--props='{"hide":"pawn,panel"}' 可隐藏同名物体（只用于排查）
(globalThis as {EP56_HIDE?: string}).EP56_HIDE = (getInputProps() as {hide?: string}).hide;
export const EP56_W = W, EP56_H = H;

/** 唯一笔头（屏幕层；位置由 3D 投影得到；随雾变淡） */
const Pen3: React.FC<{f: number}> = ({f}) => {
  const pp = pen3(f);
  const c = camAt(f);
  const [x, y, d] = project(c, pp.p);
  const o = pp.o * fogK(f, d);
  if (d <= 0.2 || o <= 0.01) return null;
  const fl = 1 + 0.04 * Math.sin(f * 0.9) + (pp.moving ? 0 : 0.05 * Math.sin(f * 0.21));
  const s = 0.6 * fl * clamp(9 / d, 0.45, 1.3);
  return (
    <Svg>
      <g transform={`translate(${x.toFixed(2)},${y.toFixed(2)})`} opacity={o} style={{mixBlendMode: 'screen'}}>
        <circle r={110 * s} fill="url(#halo2)" opacity={0.24} />
        <circle r={42 * s} fill="url(#halo2)" opacity={0.58} />
        <rect x={-160 * s} y={-1.2 * s} width={320 * s} height={2.4 * s} fill="url(#streak)" opacity={0.36} />
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

export const Ep56Hilbert: React.FC = () => {
  const f = useCurrentFrame();
  const dark = f < CLIMAX ? clamp((f - (CLIMAX - 90)) / 86) * 0.3 : 0;
  return (
    <AbsoluteFill style={{background: '#030308'}}>
      <GLStage f={f} build={buildWorld} />
      <Pen3 f={f} />
      <Svg><ScreenText f={f} /></Svg>
      <Sub f={f} />
      <AbsoluteFill style={{background: '#000', opacity: dark, pointerEvents: 'none'}} />
      {f >= CLIMAX && f < CLIMAX + 8 ? <AbsoluteFill style={{background: '#fff4e0', opacity: 0.22 * (1 - (f - CLIMAX) / 8), mixBlendMode: 'screen'}} /> : null}
      <AbsoluteFill style={{background: '#000', opacity: clamp((f - (FRAMES - 30)) / 28), pointerEvents: 'none'}} />
      <GrainVignette f={f} grain={0.045} />
      <Audio src={staticFile('audio/ep56-hilbert/mix.wav')} />
    </AbsoluteFill>
  );
};
