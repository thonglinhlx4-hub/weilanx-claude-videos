// 真人插入（硬切，840–960 帧 = 第 14–15 小节）：左侧抠像人物（AI 生成的原创人物「Cô Lan」）+ 暖色轮廓光 + 缓慢推近，
// 下方小号衬线说明；右侧光笔画出发光圆角牌（带立柱），牌内对比「heo đất」与「gửi 8%/năm」。
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, Formula, GlowPath, Label, P, PenHead, Stroke, Svg, eio, eo, partial, prog, roundRectPts} from './kit';

const A = 840; // 场景起点（硬切）
const FR = {x: 800, y: 236, w: 960, h: 470, r: 42};
const POST: P[] = [[FR.x + FR.w / 2, FR.y + FR.h], [FR.x + FR.w / 2, FR.y + FR.h + 120]];
// 迷你图：20 年，heo đất 平线 vs 8% 复利
const MX0 = FR.x + 70, MX1 = FR.x + FR.w - 190, MY0 = FR.y + FR.h - 62, MH = 170;
const my = (v: number) => MY0 - ((v - 10) / 36.6) * MH;
const mx = (t: number) => MX0 + (t / 20) * (MX1 - MX0);
const COMP: P[] = Array.from({length: 41}, (_, i) => [mx(i / 2), my(10 * Math.pow(1.08, i / 2))] as P);
const FLAT: P[] = [[mx(0), my(10)], [mx(20), my(10)]];

const BgGrid: React.FC<{o: number}> = ({o}) => {
  const step = 60;
  return (
    <g opacity={o} strokeWidth={1}>
      {Array.from({length: 33}).map((_, i) => <line key={'v' + i} x1={i * step} x2={i * step} y1={0} y2={1080} stroke={i % 2 ? C.gridFaint : C.grid} opacity={0.55} />)}
      {Array.from({length: 19}).map((_, i) => <line key={'h' + i} x1={0} x2={1920} y1={i * step} y2={i * step} stroke={i % 2 ? C.gridFaint : C.grid} opacity={0.55} />)}
    </g>
  );
};

export const SPerson: React.FC<{f: number}> = ({f}) => {
  const lf = f - A;
  const push = 1 + 0.055 * eio(prog(lf, 0, 120));
  const pin = 1; // 硬切：第 840 帧人物直接满亮度出现
  const t1 = prog(lf, 34, 10), t2 = prog(lf, 46, 10);
  const comp = eo(prog(lf, 58, 44));
  const {d: cd, head: ch} = partial(COMP, comp);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 30% 45%, #160f0c 0%, #06060b 55%, #020204 100%)'}}>
      <Svg>
        <defs>
          <radialGradient id="gridMask" cx="0.5" cy="0.48" r="0.62"><stop offset="0.35" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
          <mask id="gm-person"><rect width={1920} height={1080} fill="url(#gridMask)" /></mask>
        </defs>
        <g mask="url(#gm-person)"><BgGrid o={0.9} /></g>
        {/* 人物身后的暖色光晕 */}
        <radialGradient id="pWarm" cx="0.5" cy="0.45" r="0.5"><stop offset="0" stopColor="#ff9a3a" stopOpacity="0.14" /><stop offset="0.6" stopColor="#ff8a2a" stopOpacity="0.05" /><stop offset="1" stopColor="#ff8a2a" stopOpacity="0" /></radialGradient>
        <rect x={0} y={60} width={840} height={820} fill="url(#pWarm)" />
      </Svg>
      {/* 人物：抠像 PNG，底部渐隐；缓慢推近 */}
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '430px 330px', opacity: pin}}>
        <Img
          src={staticFile('ep53/co-lan.png')}
          style={{position: 'absolute', left: 150, top: 150, height: 640, width: 'auto', filter: 'contrast(1.04) saturate(0.92) brightness(0.96)'}}
        />
        {/* 极淡的横向扫描线，让真人与线稿世界融在一起（参考片的“全息”质感） */}
        <div
          style={{
            position: 'absolute', left: 150, top: 150, width: 520, height: 640,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 4px)',
            WebkitMaskImage: 'url(' + staticFile('ep53/co-lan.png') + ')', WebkitMaskSize: 'auto 640px', WebkitMaskRepeat: 'no-repeat',
            maskImage: 'url(' + staticFile('ep53/co-lan.png') + ')', maskSize: 'auto 640px', maskRepeat: 'no-repeat',
          }}
        />
      </AbsoluteFill>
      <Svg>
        <Label x={420} y={842} text="Cô Lan  ·  bán rau, 20 năm bỏ heo đất" size={25} color="rgba(236,230,218,0.86)" anchor="middle" ls={1.2} o={eo(prog(lf, 6, 12))} />
        <line x1={300} x2={540} y1={862} y2={862} stroke={C.gold} strokeWidth={1} opacity={0.4 * eo(prog(lf, 10, 14))} />
        {/* 右侧：光笔画发光圆角牌 + 立柱 */}
        <Stroke pts={roundRectPts(FR.x, FR.y, FR.w, FR.h, FR.r)} f={lf} at={2} dur={30} w={2.6} />
        <Stroke pts={POST} f={lf} at={30} dur={8} w={2.6} head={false} />
        <Label x={FR.x + 56} y={FR.y + 66} text="CÙNG 10 TRIỆU  ·  SAU 20 NĂM" size={19} color={C.dim} ls={3} o={eo(prog(lf, 24, 10))} />
        <g opacity={eo(t1)}>
          <Label x={FR.x + 56} y={FR.y + 142} text="Heo đất:" size={34} color="#c9cbd6" />
          <Label x={FR.x + 236} y={FR.y + 142} text="10 triệu vẫn là 10 triệu" size={34} color={C.white} o={0.92} />
        </g>
        <g opacity={eo(t2)}>
          <Formula x={FR.x + 56} y={FR.y + 212} size={34}>Gửi 8%/năm:</Formula>
          <Formula x={FR.x + 300} y={FR.y + 212} size={34} color="#ffe2b0">10 triệu → 46,6 triệu</Formula>
        </g>
        {/* 迷你图 */}
        <g opacity={eo(prog(lf, 54, 8))}>
          <line x1={MX0 - 20} x2={MX1 + 30} y1={MY0 + 18} y2={MY0 + 18} stroke="rgba(225,228,255,0.5)" strokeWidth={1.2} />
          {[0, 10, 20].map((t) => <Label key={t} x={mx(t)} y={MY0 + 44} text={`${t}`} size={16} color={C.dim} anchor="middle" />)}
          <Label x={MX1 + 18} y={MY0 + 44} text="năm" size={16} color={C.dim} />
          <Label x={MX1 + 18} y={MY0 - 8} text="heo đất · 10" size={18} color="#c9cbd6" italic />
        </g>
        <Stroke pts={FLAT} f={lf} at={56} dur={30} w={1.5} color="#cfd3e6" head={false} o={0.75} />
        {cd ? <GlowPath d={cd} w={2.4} /> : null}
        {comp > 0 && comp < 1 ? <PenHead p={ch} f={f} size={0.8} /> : null}
        {comp >= 1 ? (
          <g opacity={eo(prog(lf, 102, 8))}>
            <circle cx={COMP[COMP.length - 1][0]} cy={COMP[COMP.length - 1][1]} r={5} fill={C.core} />
            <circle cx={COMP[COMP.length - 1][0]} cy={COMP[COMP.length - 1][1]} r={18} fill="url(#halo)" opacity={0.8} />
            <Label x={COMP[COMP.length - 1][0] + 18} y={COMP[COMP.length - 1][1] + 6} text="8%/năm · 46,6" size={18} color={C.mid} italic />
          </g>
        ) : null}
      </Svg>
    </AbsoluteFill>
  );
};
