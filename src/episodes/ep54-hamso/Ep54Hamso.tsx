// ep54-hamso「Học hàm số để làm gì?」— 金线一笔风，越南语原创文案 + AI 配音（vi-VN-NamMinhNeural）。
// 时间表全部来自 script.vi.json（TTS 实测）；场景起点卡在 130 BPM 小节线上；高潮 = 第 77 小节重拍（SC.climax），前 3 帧静止。
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, GrainVignette, H, P, Ribbon, Space, Sub, Svg, W, clamp, prog} from './fx';
import {SLinear, SPiece, cam54, gridState} from './scenes1';
import {GridStage} from './grid54';
import {SHook2, hookCam} from './hook54';
import {FigureLayer} from './figures';
import {SVendor, SWave} from './scenes2';
import {SHistory, SRule} from './scenes3';
import {SBack, SClimax, SCurve, SEnd, SMulti} from './scenes4';
import {CLIMAX, CUES, FRAMES, SC} from './timing';

export const EP54_FRAMES = FRAMES;
export const EP54_W = W, EP54_H = H;

export const Ep54Hamso: React.FC = () => {
  const raw = useCurrentFrame();
  const freeze = raw >= CLIMAX - 3 && raw < CLIMAX;
  const f = freeze ? CLIMAX - 4 : raw;
  const dark = raw < CLIMAX ? (freeze ? 0.62 : clamp((raw - (CLIMAX - 21)) / 18) * 0.35) : 0;
  const scene =
    f < SC.linear ? <SHook2 f={f} fadeAt={SC.linear} /> :
    f < SC.piece ? <SLinear f={f} /> :
    f < SC.wave ? <SPiece f={f} /> :
    f < SC.vendor ? <SWave f={f} /> :
    f < SC.history ? <SVendor f={f} /> :
    f < SC.rule ? <SHistory f={f} /> :
    f < SC.multi ? <SRule f={f} /> :
    f < SC.back ? <SMulti f={f} /> :
    f < SC.curve ? <SBack f={f} /> :
    f < SC.end ? <SCurve f={f} /> :
    f < CLIMAX ? <SEnd f={f} /> : <SClimax f={f} />;
  const ribbons: [number, P][] = [
    [SC.piece, [306, 850]],
    [SC.rule, [150, 640]],
    [SC.multi, [220, 620]],
    [SC.back, [620, 520]],
    [SC.curve, [300, 750]],
    [SC.end, [-20, 860]],
  ];
  const warm = f >= CLIMAX ? 1.5 : f < SC.linear ? 1.35 : 1;
  const hookOn = f < SC.linear + 24;
  // v3：一次/分段函数段的满屏发光网格（随相机），散景灯带同步淡出
  const gs = gridState(f);
  const pan = hookOn ? hookCam(Math.min(f, SC.linear)).pan : 0;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Space f={f} warm={warm} pan={pan} band={f >= SC.wave && f < SC.vendor ? prog(f, SC.vendor - 40, 40) : 1 - gs.reveal * gs.o} />
      {gs.reveal > 0 && gs.o > 0 ? <GridStage cam={cam54(f)} reveal={gs.reveal} cx={gs.cx} cy={gs.cy} o={gs.o} floorRx={gs.floorRx} f={f} /> : null}
      <FigureLayer f={f} />
      {scene}
      {f >= SC.linear && hookOn ? <SHook2 f={f} fadeAt={SC.linear} /> : null}
      <Svg>{ribbons.map(([end, land]) => <Ribbon key={end} f={f} end={end} land={land} />)}</Svg>
      <Sub f={raw} cues={CUES} />
      <AbsoluteFill style={{background: '#000', opacity: dark, pointerEvents: 'none'}} />
      {raw >= CLIMAX && raw < CLIMAX + 6 ? <AbsoluteFill style={{background: '#fff4e0', opacity: 0.45 * (1 - (raw - CLIMAX) / 6), mixBlendMode: 'screen'}} /> : null}
      <AbsoluteFill style={{background: '#000', opacity: clamp((raw - (FRAMES - 30)) / 28), pointerEvents: 'none'}} />
      <GrainVignette f={raw} grain={f < SC.linear + 24 ? 0.13 : 0.1} />
      <Audio src={staticFile('audio/ep54-hamso/mix.wav')} />
    </AbsoluteFill>
  );
};
