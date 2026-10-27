// ep55-pi「Số Pi từ đâu ra」— 金线一笔风，越南语原创文案 + edge-tts（vi-VN-NamMinhNeural, +6%）。
// 层次：星空/散景 → 世界层（随相机推近：图形 + 唯一笔头）→ 屏幕文字层（整数像素、固定字号）→ 字幕 → 暗场/闪白/颗粒。
// 时间表全部来自 script.vi.json；场景起点卡 130 BPM 小节线；高潮 = SC.climax（第 69 小节重拍），前 3 帧静止。
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, GrainVignette, H, Pen, Space, Sub, Svg, W, clamp} from './kit55';
import {cam55, camG, makePJ} from './cam55';
import './ink55';
import {DefScreen, DefWorld, HookScreen, HookWorld} from './scenesA';
import {ArchScreen, ArchWorld, IrrScreen, IrrWorld} from './scenesB';
import {EndScreen, EndWorld, LifeScreen, LifeWorld} from './scenesC';
import {BREATH0} from './ink55';
import {CLIMAX, CUES, FRAMES} from './timing';

export const EP55_FRAMES = FRAMES;
export const EP55_W = W, EP55_H = H;

export const Ep55Pi: React.FC = () => {
  const raw = useCurrentFrame();
  const freeze = raw >= CLIMAX - 3 && raw < CLIMAX;
  const f = freeze ? CLIMAX - 4 : raw;
  const dark = raw < CLIMAX ? (freeze ? 0.6 : clamp((raw - BREATH0) / (CLIMAX - 3 - BREATH0)) * 0.38) : 0;
  const cam = cam55(f);
  const pj = makePJ(f);
  const p = {f, pj};
  const warm = f >= CLIMAX ? 0.95 : 0.6;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Space f={f} warm={warm} band={0.75} />
      <Svg>
        <g transform={camG(cam)}>
          <HookWorld {...p} />
          <DefWorld {...p} />
          <ArchWorld {...p} />
          <IrrWorld {...p} />
          <LifeWorld {...p} />
          <EndWorld {...p} />
          <Pen f={f} />
        </g>
      </Svg>
      <Svg>
        <HookScreen {...p} />
        <DefScreen {...p} />
        <ArchScreen {...p} />
        <IrrScreen {...p} />
        <LifeScreen {...p} />
        <EndScreen {...p} />
      </Svg>
      <Sub f={raw} cues={CUES} />
      <AbsoluteFill style={{background: '#000', opacity: dark, pointerEvents: 'none'}} />
      {raw >= CLIMAX && raw < CLIMAX + 6 ? <AbsoluteFill style={{background: '#fff4e0', opacity: 0.3 * (1 - (raw - CLIMAX) / 6), mixBlendMode: 'screen'}} /> : null}
      <AbsoluteFill style={{background: '#000', opacity: clamp((raw - (FRAMES - 30)) / 28), pointerEvents: 'none'}} />
      <GrainVignette f={raw} grain={0.09} />
      <Audio src={staticFile('audio/ep55-pi/mix.wav')} />
    </AbsoluteFill>
  );
};
