// ep58 竖屏用的 SVG 外壳 / 颗粒暗角（ep53/ep54 的同名组件写死了 1920×1080）
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Defs} from '../ep53-compound/kit';
import {Defs2} from '../ep54-hamso/fx';
import {H, W} from './gl';

export const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <Defs />
    <Defs2 />
    {children}
  </svg>
);
/** 暗角 + 很轻的颗粒（颗粒很弱：背景不能"闪"） */
export const GrainVignette: React.FC<{f: number; grain?: number}> = ({f, grain = 0.045}) => (
  <>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: grain, mixBlendMode: 'screen'}}>
      <filter id="grain58"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={f % 23} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width={W} height={H} filter="url(#grain58)" />
    </svg>
  </>
);
