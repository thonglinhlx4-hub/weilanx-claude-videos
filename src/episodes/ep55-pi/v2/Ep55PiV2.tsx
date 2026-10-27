// ep55-pi v2「Số Pi từ đâu ra」— 真 3D 版：three.js 世界（玻璃物件、网格地面、远处金丝、景深浮尘、雾）+ 一条贯穿全片的金线和唯一笔头，
// 相机在 3D 里推、绕、升降，沿金线从一场飞到下一场；文字 / 数字仍在屏幕层（整数像素、固定字号）。口播、字幕、混音沿用 v1。
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, GrainVignette, Svg, clamp} from '../kit55';
import {FONT} from '../../ep54-hamso/fx';
import {GLStage} from './Stage';
import {buildWorld} from './world';
import {ScreenText} from './screen';
import {BREATH0, CLIMAX, FRAMES, camAt, pen3, prog} from './scene3';
import {project} from './gl';
import {SUBS} from './subs';

export const EP55V2_FRAMES = FRAMES;

/** 唯一笔头（屏幕层，位置由 3D 投影得到；不取整——它是光点，不是文字） */
const Pen3: React.FC<{f: number}> = ({f}) => {
  const pp = pen3(f);
  const c = camAt(f);
  const [x, y, d] = project(c, pp.p);
  if (d <= 0.2 || pp.o <= 0.01) return null;
  const fl = 1 + 0.04 * Math.sin(f * 0.9) + (pp.moving ? 0 : 0.05 * Math.sin(f * 0.21));
  const s = 0.6 * fl * clamp(11 / d, 0.5, 1.35);
  return (
    <Svg>
      <g transform={`translate(${x.toFixed(2)},${y.toFixed(2)})`} opacity={pp.o} style={{mixBlendMode: 'screen'}}>
        <circle r={120 * s} fill="url(#halo2)" opacity={0.26} />
        <circle r={44 * s} fill="url(#halo2)" opacity={0.6} />
        <rect x={-180 * s} y={-1.2 * s} width={360 * s} height={2.4 * s} fill="url(#streak)" opacity={0.4} />
        <path d={`M${-38 * s},0 Q0,${-4 * s} ${38 * s},0 Q0,${4 * s} ${-38 * s},0 Z M0,${-21 * s} Q${4 * s},0 0,${21 * s} Q${-4 * s},0 0,${-21 * s} Z`} fill="#fff3dc" opacity={0.55} />
        <circle r={Math.max(3.2, 5.5 * s / 0.6)} fill="#fff8ec" opacity={0.95} />
      </g>
    </Svg>
  );
};

const Sub2: React.FC<{f: number}> = ({f}) => {
  const c = SUBS.find(([a, b]) => f >= a && f < b);
  if (!c) return null;
  const [a, b, s] = c;
  const o = Math.min(prog(f, a, 5), 1 - prog(f, b - 4, 4));
  return <div style={{position: 'absolute', left: 0, right: 0, bottom: 56, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: FONT.serif, fontWeight: 300, fontSize: 40, lineHeight: 1.3, letterSpacing: 1.5, color: C.white, opacity: o, textShadow: '0 1px 10px rgba(0,0,0,0.95)'}}>{s}</div>;
};

export const Ep55PiV2: React.FC = () => {
  const raw = useCurrentFrame();
  const freeze = raw >= CLIMAX - 3 && raw < CLIMAX;
  const f = freeze ? CLIMAX - 4 : raw;
  const dark = raw < CLIMAX ? (freeze ? 0.6 : clamp((raw - BREATH0) / (CLIMAX - 3 - BREATH0)) * 0.38) : 0;
  return (
    <AbsoluteFill style={{background: '#030308'}}>
      <GLStage f={f} build={buildWorld} />
      <Pen3 f={f} />
      <Svg><ScreenText f={f} /></Svg>
      <Sub2 f={raw} />
      <AbsoluteFill style={{background: '#000', opacity: dark, pointerEvents: 'none'}} />
      {raw >= CLIMAX && raw < CLIMAX + 6 ? <AbsoluteFill style={{background: '#fff4e0', opacity: 0.3 * (1 - (raw - CLIMAX) / 6), mixBlendMode: 'screen'}} /> : null}
      <AbsoluteFill style={{background: '#000', opacity: clamp((raw - (FRAMES - 30)) / 28), pointerEvents: 'none'}} />
      <GrainVignette f={raw} grain={0.08} />
      <Audio src={staticFile('audio/ep55-pi/mix.wav')} />
    </AbsoluteFill>
  );
};
