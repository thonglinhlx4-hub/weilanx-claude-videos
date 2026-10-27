// ep58「Hạt gạo trên bàn cờ」— 9:16 竖屏 · 真 3D（three.js，沿用 ep57 管线）：一条贯穿全片的金线 + 唯一笔头；
// 玻璃棋盘漂在暖色星空里 → 米堆 → 米山（指数拉远）→ 升空到地球 → 曲线 2^x。文字 / 数字全部在屏幕层（整数像素、固定字号）。
// 音轨：public/audio/ep58-rice/mix.wav（人声 + BGM + SFX 总线，audio/episodes/ep58-rice-tts/mix.py）。
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../ep55-pi/kit55';
import {GrainVignette, Svg} from './kit58';
import {FONT} from '../ep54-hamso/fx';
import {GLStage} from './Stage';
import {buildWorld} from './world';
import {ScreenText} from './screen';
import {CLIMAX, FRAMES, PROOF0, camAt, clamp, fogK, pen3, prog} from './scene3';
import {H, W, project} from './gl';
import {MAXW, SUBS, SUB_LS, SUB_SIZE} from './subs';

export const EP58_FRAMES = FRAMES;
export const EP58_W = W, EP58_H = H;
export const EP58_AUDIO = 'audio/ep58-rice/mix.wav';

/** 唯一笔头（屏幕层；位置由 3D 投影得到；大小按屏幕像素固定，随雾稍淡） */
const Pen3: React.FC<{f: number}> = ({f}) => {
  const pp = pen3(f);
  const c = camAt(f);
  const [x, y, d] = project(c, pp.p);
  const o = pp.o * Math.max(0.45, fogK(f, d));
  if (d <= 0.02 || o <= 0.01) return null;
  const fl = 1 + 0.04 * Math.sin(f * 0.9) + (pp.moving ? 0 : 0.05 * Math.sin(f * 0.21));
  const s = 0.55 * fl;
  return (
    <Svg>
      <g transform={`translate(${x.toFixed(2)},${y.toFixed(2)})`} opacity={o} style={{mixBlendMode: 'screen'}}>
        <circle r={100 * s} fill="url(#halo2)" opacity={0.2} />
        <circle r={40 * s} fill="url(#halo2)" opacity={0.5} />
        <rect x={-150 * s} y={-1.2 * s} width={300 * s} height={2.4 * s} fill="url(#streak)" opacity={0.3} />
        <path d={`M${-34 * s},0 Q0,${-4 * s} ${34 * s},0 Q0,${4 * s} ${-34 * s},0 Z M0,${-19 * s} Q${4 * s},0 0,${19 * s} Q${-4 * s},0 0,${-19 * s} Z`} fill="#fff3dc" opacity={0.45} />
        <circle r={4.6} fill="#fff8ec" opacity={0.9} />
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

export const Ep58Rice: React.FC = () => {
  const f = useCurrentFrame();
  // 证明段：3D 收暗，让算式站在前面；高潮（"mười tám tỷ tỷ"）落拍时一闪
  const dark = f < CLIMAX ? clamp((f - (PROOF0 - 16)) / 24) * 0.42 * (1 - clamp((f - (CLIMAX - 3)) / 3)) : 0;
  return (
    <AbsoluteFill style={{background: '#030308'}}>
      <GLStage f={f} build={buildWorld} />
      <AbsoluteFill style={{background: '#000', opacity: dark, pointerEvents: 'none'}} />
      <Pen3 f={f} />
      <Svg><ScreenText f={f} /></Svg>
      {/* 字幕区的柔和压暗带：亮物体不和字幕抢 */}
      <div style={{position: 'absolute', left: 0, top: 1300, width: W, height: 180, background: 'linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0.42) 30%, rgba(0,0,0,0.42) 70%, rgba(0,0,0,0) 100%)', pointerEvents: 'none'}} />
      <Sub f={f} />
      {f >= CLIMAX && f < CLIMAX + 8 ? <AbsoluteFill style={{background: '#fff4e0', opacity: 0.16 * (1 - (f - CLIMAX) / 8), mixBlendMode: 'screen'}} /> : null}
      <AbsoluteFill style={{background: '#000', opacity: clamp((f - (FRAMES - 30)) / 28), pointerEvents: 'none'}} />
      <GrainVignette f={f} grain={0.04} />
      <Audio src={staticFile(EP58_AUDIO)} />
    </AbsoluteFill>
  );
};
